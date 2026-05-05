import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * DELETE /api/inspecciones/eliminar
 * Body: { inspeccion_id: string }
 *
 * Borra una inspección agendada SI:
 *   - El expediente NO está cerrado y NO tiene certificado emitido
 *   - La inspección NO está marcada como 'realizada'
 *
 * Una vez emitido el certificado en CNE, la inspección queda histórica y
 * no se puede borrar (auditoría).
 *
 * Permisos: admin / inspector_responsable / inspector dueño / ejecutor.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  const rol = profile?.rol ?? ''
  const esAdmin = ['admin', 'inspector_responsable'].includes(rol)
  const esInspector = ['inspector', 'auxiliar'].includes(rol)
  if (!esAdmin && !esInspector) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { inspeccion_id } = await req.json().catch(() => ({}))
  if (!inspeccion_id) {
    return NextResponse.json({ error: 'Falta inspeccion_id' }, { status: 400 })
  }

  const db = await createServiceClient()

  // Cargar la inspección con el expediente vinculado
  const { data: insp } = await db
    .from('inspecciones_agenda')
    .select(`
      id, status, inspector_id, inspector_ejecutor_id, expediente_id,
      expediente:expedientes(id, status, numero_certificado, inspector_id, inspector_ejecutor_id)
    `)
    .eq('id', inspeccion_id)
    .maybeSingle()

  if (!insp) {
    return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 })
  }

  const exp = insp.expediente as any

  // Ownership: si no es admin, el usuario debe ser dueño/ejecutor de la inspección O del expediente
  if (!esAdmin) {
    const esOwnerInsp = insp.inspector_id === user.id || insp.inspector_ejecutor_id === user.id
    const esOwnerExp  = exp?.inspector_id === user.id || exp?.inspector_ejecutor_id === user.id
    if (!esOwnerInsp && !esOwnerExp) {
      return NextResponse.json({ error: 'No autorizado para esta inspección' }, { status: 403 })
    }
  }

  // Reglas de bloqueo
  if (exp?.numero_certificado) {
    return NextResponse.json({
      error: 'No se puede borrar: el expediente ya tiene certificado emitido en CNE',
    }, { status: 409 })
  }
  if (exp?.status === 'cerrado') {
    return NextResponse.json({
      error: 'No se puede borrar: el expediente ya está cerrado',
    }, { status: 409 })
  }
  if (insp.status === 'realizada') {
    return NextResponse.json({
      error: 'No se puede borrar: la inspección está marcada como realizada',
    }, { status: 409 })
  }

  const { error } = await db.from('inspecciones_agenda').delete().eq('id', inspeccion_id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
