import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
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

  let body: { keepId: string; mergeIds: string[] }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const { keepId, mergeIds } = body
  if (!keepId || !mergeIds?.length) {
    return NextResponse.json({ error: 'Faltan keepId o mergeIds' }, { status: 400 })
  }

  // ── Service client (bypasea RLS completamente) ───────────────────────────────
  const admin = await createServiceClient()
  const log: string[] = []
  const errores: string[] = []

  for (const dupId of mergeIds) {
    if (dupId === keepId) continue

    log.push(`--- procesando ${dupId} ---`)

    // 1. Reasignar expedientes
    const { error: e1 } = await admin
      .from('expedientes')
      .update({ cliente_id: keepId })
      .eq('cliente_id', dupId)
    if (e1) { errores.push(`expedientes: ${e1.message}`); continue }

    // 2. Reasignar solicitudes cliente_id
    const { error: e2 } = await admin
      .from('solicitudes_folio')
      .update({ cliente_id: keepId })
      .eq('cliente_id', dupId)
    if (e2) { errores.push(`solicitudes: ${e2.message}`); continue }

    // 3. Reasignar solicitudes cliente_epc_id
    const { error: e3 } = await admin
      .from('solicitudes_folio')
      .update({ cliente_epc_id: keepId })
      .eq('cliente_epc_id', dupId)
    if (e3) { errores.push(`solicitudes epc: ${e3.message}`); continue }

    // 3a. Reasignar mensajes al cliente (tabla nueva — sin ON DELETE)
    const { error: e3a } = await admin
      .from('expediente_mensajes_cliente')
      .update({ cliente_id: keepId })
      .eq('cliente_id', dupId)
    if (e3a) { errores.push(`mensajes: ${e3a.message}`); continue }

    // 3b. Reasignar INEs del cliente (tienen ON DELETE CASCADE — re-asignamos
    //     para que NO se borren cuando eliminemos al duplicado).
    const { error: e3b } = await admin
      .from('cliente_ines')
      .update({ cliente_id: keepId })
      .eq('cliente_id', dupId)
    if (e3b) { errores.push(`cliente_ines: ${e3b.message}`); continue }

    // 4. Verificar que no queden otras FKs apuntando a dupId
    //    buscando en todas las tablas conocidas
    const { data: expCheck } = await admin
      .from('expedientes').select('id').eq('cliente_id', dupId).limit(1)
    if (expCheck?.length) {
      errores.push(`${dupId}: aún tiene ${expCheck.length} expediente(s) — reasignación falló`)
      continue
    }

    // 5. Intentar el delete
    const { error: e4 } = await admin
      .from('clientes')
      .delete()
      .eq('id', dupId)

    if (e4) {
      errores.push(`delete ${dupId}: ${e4.message}`)
      continue
    }

    // 6. Verificar que realmente se eliminó
    const { data: stillExists } = await admin
      .from('clientes').select('id').eq('id', dupId).maybeSingle()

    if (stillExists) {
      errores.push(`delete ${dupId}: la fila sigue existiendo después del delete — verificar triggers o FKs en Supabase`)
    } else {
      log.push(`${dupId}: eliminado ✓`)
    }
  }

  revalidatePath('/dashboard/inspector/clientes')
  revalidatePath('/dashboard/inspector/clientes/duplicados')

  if (errores.length) {
    return NextResponse.json({ error: errores.join(' | '), log }, { status: 500 })
  }

  return NextResponse.json({ ok: true, merged: mergeIds.length, log })
}
