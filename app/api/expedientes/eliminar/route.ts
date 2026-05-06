import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/eliminar
 *
 * Borra un expediente y todos sus datos relacionados (documentos, dictámenes,
 * inspecciones, hallazgos, etc. — se eliminan vía CASCADE del FK).
 *
 * Body: {
 *   expediente_id: string,
 *   justificacion: string  (>= 10 chars),
 *   eliminar_folio?: boolean  (si true, borra el folio del catálogo;
 *                              si false, lo libera para reutilización)
 * }
 *
 * Solo admin / inspector_responsable. Operación auditada en
 * expediente_eliminacion_audit (registro inmutable con justificación).
 *
 * Limpieza de storage: se borran todos los archivos en bucket "documentos"
 * referenciados por documentos_expediente antes del DELETE de la fila.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json().catch(() => null) as
      | { expediente_id?: string; justificacion?: string; eliminar_folio?: boolean }
      | null
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const expediente_id = body.expediente_id?.trim()
    const justificacion = body.justificacion?.trim()
    const eliminarFolio = body.eliminar_folio === true

    if (!expediente_id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })
    if (!justificacion || justificacion.length < 10) {
      return NextResponse.json(
        { error: 'La justificación es obligatoria (mínimo 10 caracteres)' },
        { status: 400 },
      )
    }

    const db = await createServiceClient()

    // Snapshot del expediente para el audit
    const { data: exp, error: expErr } = await db
      .from('expedientes')
      .select(`
        id, numero_folio, folio_id, cliente_id, inspector_id, status,
        cliente:clientes(nombre)
      `)
      .eq('id', expediente_id)
      .single()

    if (expErr || !exp) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    // Listar paths de storage antes del CASCADE
    const { data: docs } = await db
      .from('documentos_expediente')
      .select('storage_path')
      .eq('expediente_id', expediente_id)

    const paths = (docs ?? []).map(d => d.storage_path).filter(Boolean) as string[]

    // Limpieza de storage en lote (continúa aunque falle alguno individual)
    if (paths.length > 0) {
      const { error: stErr } = await db.storage.from('documentos').remove(paths)
      if (stErr) {
        console.warn('[expedientes/eliminar] storage cleanup warning:', stErr.message)
      }
    }

    // DELETE del expediente — los registros relacionados caen vía CASCADE
    const { error: delErr } = await db
      .from('expedientes')
      .delete()
      .eq('id', expediente_id)

    if (delErr) {
      return NextResponse.json(
        { error: `No se pudo borrar el expediente: ${delErr.message}` },
        { status: 500 },
      )
    }

    // Manejo del folio: borrar o liberar
    if (exp.folio_id) {
      if (eliminarFolio) {
        const { error: folioDelErr } = await db
          .from('folios_lista_control')
          .delete()
          .eq('id', exp.folio_id)
        if (folioDelErr) {
          console.warn('[expedientes/eliminar] no se pudo borrar el folio:', folioDelErr.message)
        }
      } else {
        // Liberar el folio para reutilización
        await db
          .from('folios_lista_control')
          .update({ asignado: false, asignado_a: null, fecha_asignacion: null })
          .eq('id', exp.folio_id)
      }
    }

    // Audit
    await db.from('expediente_eliminacion_audit').insert({
      expediente_id: exp.id,
      numero_folio: exp.numero_folio,
      cliente_id: exp.cliente_id,
      cliente_nombre: (exp.cliente as any)?.nombre ?? null,
      inspector_id: exp.inspector_id,
      status_anterior: exp.status,
      documentos_borrados: paths.length,
      justificacion,
      borrado_por: user.id,
    })

    return NextResponse.json({
      ok: true,
      documentos_borrados: paths.length,
      folio_eliminado: eliminarFolio,
      folio_liberado: !eliminarFolio && !!exp.folio_id,
    })
  } catch (err: any) {
    console.error('[POST /api/expedientes/eliminar]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
