import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/inversores
 *
 * Reemplaza completamente la lista de inversores de un expediente. Más fácil
 * de razonar que CRUD individual: el cliente envía el estado deseado y el
 * server lo deja igual.
 *
 * Auth:
 *  - admin / inspector_responsable: cualquier expediente
 *  - inspector: solo su expediente (dueño o ejecutor)
 *  - cliente: solo su expediente (vinculado vía clientes.usuario_id)
 *
 * Body:
 * {
 *   expediente_id: string,
 *   inversores: [{
 *     inversor_id?: string|null,
 *     marca: string,
 *     modelo: string,
 *     cantidad: number,
 *     potencia_kw?: number|null,
 *     certificacion: 'ul1741'|'ieee1547'|'homologado_cne'|'ninguna',
 *     justificacion_ieee1547?: string|null,
 *     orden?: number,
 *   }]
 * }
 */

const CERTS_VALIDAS = ['ul1741', 'ieee1547', 'homologado_cne', 'ninguna']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const { expediente_id, inversores } = body
  if (!expediente_id || !Array.isArray(inversores)) {
    return NextResponse.json({ error: 'Faltan campos: expediente_id, inversores[]' }, { status: 400 })
  }
  if (inversores.length === 0) {
    return NextResponse.json({ error: 'Debe haber al menos un inversor' }, { status: 400 })
  }

  // Validación por fila
  for (const [i, inv] of inversores.entries()) {
    if (!inv.marca?.trim() || !inv.modelo?.trim()) {
      return NextResponse.json({ error: `Fila ${i + 1}: marca y modelo son requeridos` }, { status: 400 })
    }
    if (!Number.isInteger(inv.cantidad) || inv.cantidad < 1) {
      return NextResponse.json({ error: `Fila ${i + 1}: cantidad debe ser entero ≥ 1` }, { status: 400 })
    }
    if (!CERTS_VALIDAS.includes(inv.certificacion)) {
      return NextResponse.json({ error: `Fila ${i + 1}: certificación inválida (${inv.certificacion})` }, { status: 400 })
    }
    if (inv.certificacion === 'ieee1547' && !inv.justificacion_ieee1547?.trim()) {
      return NextResponse.json({ error: `Fila ${i + 1}: IEEE 1547 requiere justificación` }, { status: 400 })
    }
  }

  // Verificar acceso al expediente
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()
  const esStaff = ['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')

  // Cargar expediente para revisar dueño/cliente
  const db = await createServiceClient()
  const { data: exp } = await db
    .from('expedientes')
    .select('id, inspector_id, inspector_ejecutor_id, cliente_id')
    .eq('id', expediente_id)
    .maybeSingle()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  let permitido = esStaff
  if (!permitido) {
    // Inspector dueño o ejecutor
    if (exp.inspector_id === user.id || exp.inspector_ejecutor_id === user.id) {
      permitido = true
    } else if (exp.cliente_id) {
      // Cliente vinculado
      const { data: cli } = await db
        .from('clientes')
        .select('usuario_id')
        .eq('id', exp.cliente_id)
        .maybeSingle()
      if (cli?.usuario_id === user.id) permitido = true
    }
  }
  if (!permitido) return NextResponse.json({ error: 'Sin permisos sobre este expediente' }, { status: 403 })

  // Reemplazo total: borrar lo viejo y meter lo nuevo
  const { error: delErr } = await db
    .from('expediente_inversores')
    .delete()
    .eq('expediente_id', expediente_id)
  if (delErr) {
    return NextResponse.json({ error: `Error borrando lista anterior: ${delErr.message}` }, { status: 500 })
  }

  const filas = inversores.map((inv: any, idx: number) => ({
    expediente_id,
    orden: inv.orden ?? idx + 1,
    inversor_id: inv.inversor_id ?? null,
    marca: inv.marca.trim(),
    modelo: inv.modelo.trim(),
    cantidad: inv.cantidad,
    potencia_kw: inv.potencia_kw ?? null,
    certificacion: inv.certificacion,
    justificacion_ieee1547: inv.justificacion_ieee1547?.trim() || null,
  }))

  const { data: insertados, error: insErr } = await db
    .from('expediente_inversores')
    .insert(filas)
    .select('id, orden, marca, modelo, cantidad, potencia_kw, certificacion, justificacion_ieee1547')
  if (insErr) {
    return NextResponse.json({ error: `Error insertando: ${insErr.message}` }, { status: 500 })
  }

  // Actualizar campos legacy para que el resto del sistema (que aún lee
  // expedientes.inversor_id/num_inversores) siga funcionando: usamos la fila #1
  // y la suma de cantidades como respaldo.
  const principal = filas[0]
  const totalCantidad = filas.reduce((s, f) => s + f.cantidad, 0)
  await db
    .from('expedientes')
    .update({
      inversor_id: principal.inversor_id,
      num_inversores: totalCantidad,
    })
    .eq('id', expediente_id)

  return NextResponse.json({ ok: true, inversores: insertados })
}
