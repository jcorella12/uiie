import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/[id]/respaldo-archivado
 *
 * El usuario confirma que ya descargó y archivó el respaldo en sus carpetas
 * locales. A partir de este momento empieza a contar el plazo de 20 días
 * para el auto-borrado de los archivos del servidor.
 *
 * Body: { archivado: boolean }   // true para confirmar, false para revertir
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!u || !['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const archivado = body?.archivado !== false   // default true

  const db = await createServiceClient()
  const { data: exp } = await db
    .from('expedientes')
    .select('id, inspector_id, numero_folio')
    .eq('id', params.id)
    .single()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
  if (!esAdmin && exp.inspector_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
  }

  // Setear o limpiar respaldo_archivado_at
  const { error: errUpd } = await db
    .from('expedientes')
    .update({ respaldo_archivado_at: archivado ? new Date().toISOString() : null })
    .eq('id', params.id)
  if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

  // Crear notificación para el inspector responsable del expediente
  if (archivado) {
    try {
      await db.from('notificaciones').insert({
        usuario_id: exp.inspector_id,
        tipo: 'expediente_actualizado',
        titulo: '✓ Respaldo archivado',
        mensaje: `Confirmaste el archivado del expediente ${exp.numero_folio ?? ''}. Los archivos del servidor se borrarán automáticamente en 20 días.`,
        url: `/dashboard/inspector/expedientes/${exp.id}`,
      })
    } catch (e: any) {
      // No bloqueamos si falla la notificación
      console.warn('[respaldo-archivado] no se pudo crear notificación:', e?.message)
    }
  }

  return NextResponse.json({ ok: true, archivado })
}
