import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/[id]/precio
 *
 * Permite modificar el precio del expediente DESPUÉS de que el folio
 * fue asignado. El precio vive en `solicitudes_folio.precio_propuesto`
 * (la solicitud que originó el expediente, vinculada por folio_id).
 *
 * Cada cambio se anota en `solicitudes_folio.precio_historial` (JSONB
 * append) con: precio_anterior, precio_nuevo, fecha, usuario_id, motivo.
 *
 * Permisos:
 *  - admin / inspector_responsable: cualquier expediente
 *  - inspector: solo si es dueño o ejecutor
 *  - auxiliar: cualquier expediente (apoyan a varios inspectores)
 *
 * Body: { precio: number, motivo?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!u || !rolesPermitidos.includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // ── Body ────────────────────────────────────────────────────────────────────
  let body: { precio?: number; motivo?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const precio = Number(body.precio)
  if (!Number.isFinite(precio) || precio < 0) {
    return NextResponse.json({ error: 'El precio debe ser un número ≥ 0' }, { status: 400 })
  }
  if (precio > 10_000_000) {
    return NextResponse.json({ error: 'Precio fuera de rango' }, { status: 400 })
  }
  const motivo = (body.motivo ?? '').trim().slice(0, 500) || null

  // ── Cargar expediente ───────────────────────────────────────────────────────
  const db = await createServiceClient()
  const { data: exp } = await db
    .from('expedientes')
    .select('id, folio_id, status, inspector_id, inspector_ejecutor_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  // Inspector solo edita los suyos. Admin/responsable/auxiliar — cualquiera.
  if (u.rol === 'inspector') {
    const esDueno = exp.inspector_id === user.id || exp.inspector_ejecutor_id === user.id
    if (!esDueno) {
      return NextResponse.json({ error: 'Solo puedes editar el precio de tus propios expedientes' }, { status: 403 })
    }
  }

  if (!exp.folio_id) {
    return NextResponse.json({
      error: 'El expediente aún no tiene folio asignado — el precio se captura al crear la solicitud',
    }, { status: 422 })
  }

  // No se permite cambiar precio en expedientes ya cerrados (ya facturados)
  if (exp.status === 'cerrado') {
    return NextResponse.json({
      error: 'El expediente ya está cerrado — no se puede cambiar el precio',
    }, { status: 422 })
  }

  // ── Cargar solicitud asociada ───────────────────────────────────────────────
  const { data: sol } = await db
    .from('solicitudes_folio')
    .select('id, precio_propuesto, precio_historial')
    .eq('folio_asignado_id', exp.folio_id)
    .maybeSingle()
  if (!sol) {
    return NextResponse.json({
      error: 'No se encontró la solicitud asociada al folio del expediente',
    }, { status: 404 })
  }

  const precioAnterior = sol.precio_propuesto != null ? Number(sol.precio_propuesto) : null
  if (precioAnterior !== null && Math.abs(precioAnterior - precio) < 0.005) {
    // Mismo precio (con tolerancia de centavos), no hay nada que hacer
    return NextResponse.json({ ok: true, sin_cambio: true, precio })
  }

  // ── Actualizar precio + append a historial ──────────────────────────────────
  const nuevoEvento = {
    precio_anterior: precioAnterior,
    precio_nuevo:    precio,
    fecha:           new Date().toISOString(),
    usuario_id:      user.id,
    rol:             u.rol,
    motivo,
  }
  const historialActualizado = Array.isArray(sol.precio_historial)
    ? [...sol.precio_historial, nuevoEvento]
    : [nuevoEvento]

  const { error: upErr } = await db
    .from('solicitudes_folio')
    .update({
      precio_propuesto: precio,
      precio_historial: historialActualizado,
    })
    .eq('id', sol.id)

  if (upErr) {
    return NextResponse.json({ error: `Error al guardar: ${upErr.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    precio,
    precio_anterior: precioAnterior,
    historial: historialActualizado,
  })
}
