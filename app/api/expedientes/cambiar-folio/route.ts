import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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
      | { expediente_id?: string; nuevo_folio?: string; justificacion?: string }
      | null
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const expediente_id = body.expediente_id?.trim()
    const nuevo_folio = body.nuevo_folio?.trim()
    const justificacion = body.justificacion?.trim()

    if (!expediente_id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })
    if (!nuevo_folio) return NextResponse.json({ error: 'Falta nuevo folio' }, { status: 400 })
    if (!justificacion || justificacion.length < 10) {
      return NextResponse.json(
        { error: 'La justificación es obligatoria (mínimo 10 caracteres)' },
        { status: 400 },
      )
    }

    const db = await createServiceClient()

    const { data: expediente, error: expErr } = await db
      .from('expedientes')
      .select('id, numero_folio')
      .eq('id', expediente_id)
      .single()

    if (expErr || !expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    const folioAnterior = expediente.numero_folio ?? ''
    if (folioAnterior === nuevo_folio) {
      return NextResponse.json({ error: 'El nuevo folio es igual al actual' }, { status: 400 })
    }

    // Bloquear duplicados con otro expediente
    const { data: dup } = await db
      .from('expedientes')
      .select('id')
      .eq('numero_folio', nuevo_folio)
      .neq('id', expediente_id)
      .maybeSingle()
    if (dup) {
      return NextResponse.json(
        { error: 'Ya existe otro expediente con ese folio' },
        { status: 409 },
      )
    }

    const { error: updErr } = await db
      .from('expedientes')
      .update({ numero_folio: nuevo_folio })
      .eq('id', expediente_id)

    if (updErr) throw updErr

    const { error: auditErr } = await db
      .from('expediente_folio_audit')
      .insert({
        expediente_id,
        folio_anterior: folioAnterior,
        folio_nuevo: nuevo_folio,
        justificacion,
        cambiado_por: user.id,
      })

    if (auditErr) {
      // Rollback manual del update si el audit falla — la consistencia importa
      await db
        .from('expedientes')
        .update({ numero_folio: folioAnterior })
        .eq('id', expediente_id)
      throw auditErr
    }

    return NextResponse.json({ ok: true, folio_anterior: folioAnterior, folio_nuevo: nuevo_folio })
  } catch (err: any) {
    console.error('[POST /api/expedientes/cambiar-folio]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
