import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/borrar-respaldos
 *
 * Job diario que borra los archivos del storage de expedientes cuyo respaldo
 * fue descargado hace más de 20 días. Solo borra archivos del storage —
 * los registros en DB se conservan (solo se setea `respaldo_borrado_at`).
 *
 * Activado por Vercel Cron — protegido con CRON_SECRET en header Authorization.
 *
 * Para correr manualmente desde la UI:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://app.uiie.com.mx/api/cron/borrar-respaldos
 */

const DIAS_PARA_BORRAR = 20

export async function GET(req: NextRequest) {
  // ── Auth: aceptar Vercel Cron header o Bearer secret ─────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron envía un header especial; en producción debería existir CRON_SECRET
  const esVercelCron = req.headers.get('user-agent')?.includes('vercel-cron')
  const tokenValido = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!esVercelCron && !tokenValido) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = await createServiceClient()
  const ahora = Date.now()
  const limiteBorrar = new Date(ahora - DIAS_PARA_BORRAR * 24 * 60 * 60 * 1000).toISOString()
  const limiteAviso  = new Date(ahora - (DIAS_PARA_BORRAR - 3) * 24 * 60 * 60 * 1000).toISOString() // día 17
  const ventanaAviso = new Date(ahora - (DIAS_PARA_BORRAR - 4) * 24 * 60 * 60 * 1000).toISOString() // día 16

  // ── 1. Aviso 3 días antes — expedientes archivados hace ~17 días ─────────
  const { data: paraAvisar } = await db
    .from('expedientes')
    .select('id, numero_folio, inspector_id')
    .lte('respaldo_archivado_at', limiteAviso)
    .gt('respaldo_archivado_at', ventanaAviso)
    .is('respaldo_borrado_at', null)
    .limit(100)

  const avisosCreados: string[] = []
  for (const exp of paraAvisar ?? []) {
    if (!exp.inspector_id) continue
    try {
      await db.from('notificaciones').insert({
        usuario_id: exp.inspector_id,
        tipo: 'expediente_actualizado',
        titulo: '⏳ Respaldo se borrará en 3 días',
        mensaje: `El respaldo del expediente ${exp.numero_folio ?? ''} se eliminará del servidor en 3 días. Asegúrate de tener tu copia local guardada.`,
        url: `/dashboard/inspector/expedientes/${exp.id}`,
      })
      avisosCreados.push(exp.id)
    } catch {}
  }

  // ── 2. Borrar — expedientes archivados hace 20+ días ─────────────────────
  // Solo borra los que ya confirmaron archivado local (respaldo_archivado_at no null)
  const { data: expedientesABorrar, error } = await db
    .from('expedientes')
    .select('id, numero_folio, inspector_id, respaldo_archivado_at')
    .lt('respaldo_archivado_at', limiteBorrar)
    .is('respaldo_borrado_at', null)
    .limit(50)

  if (error) {
    console.error('[cron/borrar-respaldos] Error consultando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expedientesABorrar || expedientesABorrar.length === 0) {
    return NextResponse.json({
      ok: true,
      mensaje: 'No hay expedientes para borrar',
      borrados: 0,
      avisos_creados: avisosCreados.length,
    })
  }

  const resultados: Array<{ id: string; folio: string; archivos_borrados: number; error?: string }> = []
  let totalBorrados = 0

  for (const exp of expedientesABorrar) {
    try {
      // 1) Obtener todos los documentos del expediente
      const { data: docs } = await db
        .from('documentos_expediente')
        .select('id, storage_path')
        .eq('expediente_id', exp.id)

      const paths = (docs ?? []).map((d: any) => d.storage_path).filter(Boolean)

      // 2) Borrar del storage en lotes
      let borradosEnExp = 0
      if (paths.length > 0) {
        const { error: errStorage } = await db.storage.from('documentos').remove(paths)
        if (errStorage) {
          console.warn(`[cron] Error borrando storage de exp ${exp.id}:`, errStorage.message)
        } else {
          borradosEnExp = paths.length
        }
      }

      // 3) Marcar el expediente como respaldo borrado
      await db.from('expedientes').update({
        respaldo_borrado_at: new Date().toISOString(),
      }).eq('id', exp.id)

      // 4) Notificar al inspector que el respaldo fue archivado y borrado
      if (exp.inspector_id) {
        try {
          await db.from('notificaciones').insert({
            usuario_id: exp.inspector_id,
            tipo: 'expediente_actualizado',
            titulo: '✓ Respaldo archivado y borrado del servidor',
            mensaje: `El expediente ${exp.numero_folio ?? ''} se archivó correctamente. Los archivos se borraron del servidor para liberar espacio. Tu copia local sigue intacta.`,
            url: `/dashboard/inspector/expedientes/${exp.id}`,
          })
        } catch {}
      }

      resultados.push({
        id: exp.id,
        folio: exp.numero_folio ?? '?',
        archivos_borrados: borradosEnExp,
      })
      totalBorrados += borradosEnExp

    } catch (e: any) {
      console.error(`[cron] Falló borrado de exp ${exp.id}:`, e?.message)
      resultados.push({
        id: exp.id,
        folio: exp.numero_folio ?? '?',
        archivos_borrados: 0,
        error: e?.message ?? 'unknown',
      })
    }
  }

  console.log(`[cron/borrar-respaldos] Procesados ${resultados.length} expedientes, ${totalBorrados} archivos borrados`)

  return NextResponse.json({
    ok: true,
    expedientes_procesados: resultados.length,
    archivos_borrados_total: totalBorrados,
    avisos_creados: avisosCreados.length,
    detalle: resultados,
  })
}
