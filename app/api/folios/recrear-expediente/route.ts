import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/folios/recrear-expediente
 * Body: { solicitud_id: string }
 *
 * Crea el expediente cuando el folio ya fue asignado pero el INSERT original
 * falló silenciosamente. Idempotente: si el expediente ya existe lo retorna.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { solicitud_id } = await req.json()
  if (!solicitud_id) return NextResponse.json({ error: 'Falta solicitud_id' }, { status: 400 })

  const db = await createServiceClient()

  // Obtener solicitud con folio
  const { data: sol, error: solErr } = await db
    .from('solicitudes_folio')
    .select('id, cliente_id, cliente_epc_id, propietario_nombre, kwp, ciudad, estado_mx, fecha_estimada, inspector_id, folio_asignado_id, status')
    .eq('id', solicitud_id)
    .single()

  if (solErr || !sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (sol.status !== 'folio_asignado') {
    return NextResponse.json({ error: 'La solicitud no tiene folio asignado' }, { status: 400 })
  }
  if (!sol.folio_asignado_id) {
    return NextResponse.json({ error: 'Sin folio_asignado_id' }, { status: 400 })
  }

  // Verificar si el expediente ya existe
  const { data: existing } = await db
    .from('expedientes')
    .select('id')
    .eq('folio_id', sol.folio_asignado_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, expediente_id: existing.id, ya_existia: true })
  }

  // Obtener numero_folio
  const { data: folio } = await db
    .from('folios_lista_control')
    .select('numero_folio')
    .eq('id', sol.folio_asignado_id)
    .single()

  if (!folio) return NextResponse.json({ error: 'Folio no encontrado' }, { status: 404 })

  // Crear expediente
  const expInsert: Record<string, unknown> = {
    folio_id:     sol.folio_asignado_id,
    numero_folio: folio.numero_folio,
    inspector_id: sol.inspector_id,
    kwp:          sol.kwp,
    ciudad:       sol.ciudad ?? null,
    estado_mx:    sol.estado_mx ?? null,
    fecha_inicio: sol.fecha_estimada ?? new Date().toISOString().slice(0, 10),
    status:       'en_proceso',
  }

  const clienteId = (sol as any).cliente_epc_id ?? (sol as any).cliente_id
  if (clienteId) expInsert.cliente_id = clienteId
  if ((sol as any).propietario_nombre) expInsert.nombre_cliente_final = (sol as any).propietario_nombre

  const { data: creado, error: insErr } = await db
    .from('expedientes')
    .insert(expInsert)
    .select('id')
    .single()

  if (insErr) {
    console.error('[recrear-expediente]', insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, expediente_id: creado.id, ya_existia: false })
}
