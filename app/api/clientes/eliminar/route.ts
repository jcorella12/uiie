import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/clientes/eliminar
 *
 * Borra un cliente del catálogo. Solo se permite si NO tiene
 * expedientes ni solicitudes_folio activas vinculadas (ese tipo de
 * borrado debe pasar por borrar el expediente primero).
 *
 * Body: { cliente_id: string, justificacion: string (>=5 chars) }
 *
 * Permisos:
 * - admin / inspector_responsable: cualquier cliente
 * - inspector / auxiliar: solo los que crearon o tienen asignados
 *   (created_by o inspector_id = auth.uid())
 *
 * Operación auditada en cliente_eliminacion_audit.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await req.json().catch(() => null) as
      | { cliente_id?: string; justificacion?: string }
      | null
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const cliente_id = body.cliente_id?.trim()
    const justificacion = body.justificacion?.trim()
    if (!cliente_id) return NextResponse.json({ error: 'Falta cliente_id' }, { status: 400 })
    if (!justificacion || justificacion.length < 5) {
      return NextResponse.json({ error: 'La justificación es obligatoria (mínimo 5 caracteres)' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Snapshot del cliente
    const { data: cli, error: cliErr } = await db
      .from('clientes')
      .select('id, nombre, rfc, inspector_id, created_by')
      .eq('id', cliente_id)
      .single()
    if (cliErr || !cli) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Authorization: admin/responsable, o inspector dueño/creador
    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    const esDueno = cli.created_by === user.id || cli.inspector_id === user.id
    if (!esAdmin && !esDueno) {
      return NextResponse.json(
        { error: 'No tienes permisos sobre este cliente. Solo el inspector dueño o admin pueden borrarlo.' },
        { status: 403 },
      )
    }

    // Bloqueo: no borrar si tiene expedientes vinculados
    const { count: numExp } = await db
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', cliente_id)
    if ((numExp ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Tiene ${numExp} expediente(s) vinculado(s). Borra primero los expedientes o desvincula al cliente.`,
          expedientes_count: numExp,
        },
        { status: 409 },
      )
    }

    // Bloqueo: no borrar si tiene solicitudes_folio vinculadas (cliente o EPC)
    const { count: numSol } = await db
      .from('solicitudes_folio')
      .select('id', { count: 'exact', head: true })
      .or(`cliente_id.eq.${cliente_id},cliente_epc_id.eq.${cliente_id}`)
    if ((numSol ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Tiene ${numSol} solicitud(es) de folio vinculada(s). Bórralas o reasígnalas primero.`,
          solicitudes_count: numSol,
        },
        { status: 409 },
      )
    }

    // Audit (antes del DELETE para que sobreviva si algo falla)
    await db.from('cliente_eliminacion_audit').insert({
      cliente_id:     cli.id,
      cliente_nombre: cli.nombre,
      cliente_rfc:    cli.rfc,
      inspector_id:   cli.inspector_id,
      justificacion,
      borrado_por:    user.id,
    })

    // DELETE — cliente_ines tiene CASCADE
    const { error: delErr } = await db.from('clientes').delete().eq('id', cliente_id)
    if (delErr) {
      return NextResponse.json(
        { error: `No se pudo borrar: ${delErr.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, nombre: cli.nombre })
  } catch (err: any) {
    console.error('[POST /api/clientes/eliminar]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
