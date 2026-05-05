import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STATUS = ['nuevo', 'en_revision', 'resuelto', 'descartado'] as const

/**
 * PATCH /api/feedback/atender
 * Body: { feedback_id, status?, notas_responsable?, prioridad? }
 *
 * Solo admin / inspector_responsable.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'inspector_responsable'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { feedback_id, status, notas_responsable, prioridad } = body
  if (!feedback_id) {
    return NextResponse.json({ error: 'Falta feedback_id' }, { status: 400 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (status !== undefined) {
    if (!STATUS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
    updates.status = status
    if (status === 'resuelto' || status === 'descartado') {
      updates.atendido_por = user.id
      updates.atendido_en  = new Date().toISOString()
    }
  }
  if (notas_responsable !== undefined) {
    updates.notas_responsable = String(notas_responsable).trim() || null
  }
  if (prioridad !== undefined) {
    const p = Math.max(1, Math.min(5, parseInt(prioridad, 10) || 3))
    updates.prioridad = p
  }

  const { error } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', feedback_id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
