import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/folios/eliminar
 *
 * Borra un folio del catálogo. Solo se permite si NO está asignado a un
 * expediente activo. Para liberar un folio asignado, primero hay que
 * borrar el expediente (que automáticamente lo libera).
 *
 * Body: { folio_id: string, justificacion: string }
 *
 * Solo admin / inspector_responsable.
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
      | { folio_id?: string; justificacion?: string }
      | null
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const folio_id = body.folio_id?.trim()
    const justificacion = body.justificacion?.trim()
    if (!folio_id) return NextResponse.json({ error: 'Falta folio_id' }, { status: 400 })
    if (!justificacion || justificacion.length < 10) {
      return NextResponse.json(
        { error: 'La justificación es obligatoria (mínimo 10 caracteres)' },
        { status: 400 },
      )
    }

    const db = await createServiceClient()

    // Bloquear si hay expediente vinculado
    const { data: expsLinked } = await db
      .from('expedientes')
      .select('id, numero_folio')
      .eq('folio_id', folio_id)
      .limit(1)

    if (expsLinked && expsLinked.length > 0) {
      return NextResponse.json(
        {
          error: 'No se puede borrar: el folio tiene un expediente asociado. Borra primero el expediente o márcalo como sin folio.',
          expediente: expsLinked[0],
        },
        { status: 409 },
      )
    }

    const { data: folio, error: folioErr } = await db
      .from('folios_lista_control')
      .select('id, numero_folio')
      .eq('id', folio_id)
      .single()

    if (folioErr || !folio) {
      return NextResponse.json({ error: 'Folio no encontrado' }, { status: 404 })
    }

    const { error: delErr } = await db
      .from('folios_lista_control')
      .delete()
      .eq('id', folio_id)

    if (delErr) {
      return NextResponse.json(
        { error: `No se pudo borrar el folio: ${delErr.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, numero_folio: folio.numero_folio })
  } catch (err: any) {
    console.error('[POST /api/folios/eliminar]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
