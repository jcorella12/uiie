import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendFolioAsignadoEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Use cookie-aware client for auth, service client for privileged DB writes
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: adminUser } = await authClient
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!adminUser || !['admin', 'inspector_responsable'].includes(adminUser.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const supabase = await createServiceClient()

    const body = await request.json()
    const { solicitudId, folioId } = body

    if (!solicitudId || !folioId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Get solicitud details
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_folio')
      .select(`
        id, cliente_id, cliente_epc_id, cliente_nombre, propietario_nombre, kwp, ciudad, estado_mx, fecha_estimada, status, inspector_id, inspector_ejecutor_id,
        inspector:usuarios!inspector_id(nombre, apellidos, email)
      `)
      .eq('id', solicitudId)
      .single()

    if (solError || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (solicitud.status === 'folio_asignado') {
      return NextResponse.json({ error: 'Esta solicitud ya tiene folio asignado' }, { status: 400 })
    }

    // Get folio
    const { data: folio, error: folioError } = await supabase
      .from('folios_lista_control')
      .select('id, numero_folio, asignado')
      .eq('id', folioId)
      .single()

    if (folioError || !folio) {
      return NextResponse.json({ error: 'Folio no encontrado' }, { status: 404 })
    }

    if (folio.asignado) {
      return NextResponse.json({ error: 'Este folio ya fue asignado' }, { status: 400 })
    }

    // Update atómico: solo actualiza si asignado=false en este momento (evita race condition)
    const { data: folioUpdated, error: folioUpdateError } = await supabase
      .from('folios_lista_control')
      .update({
        asignado: true,
        asignado_a: solicitud.inspector_id,
        fecha_asignacion: new Date().toISOString(),
      })
      .eq('id', folioId)
      .eq('asignado', false)   // condición atómica: solo si aún no está asignado
      .select('id')

    if (folioUpdateError) throw folioUpdateError
    if (!folioUpdated || folioUpdated.length === 0) {
      return NextResponse.json({ error: 'Este folio ya fue asignado por otra operación concurrente' }, { status: 409 })
    }

    const { error: solicitudUpdateError } = await supabase
      .from('solicitudes_folio')
      .update({
        status: 'folio_asignado',
        folio_asignado_id: folioId,
        revisado_por: user.id,
        fecha_revision: new Date().toISOString(),
      })
      .eq('id', solicitudId)

    if (solicitudUpdateError) throw solicitudUpdateError

    // Crear expediente para el inspector
    // (cliente_id puede ser null si la solicitud no vinculó un registro de cliente)
    const expInsert: Record<string, any> = {
      folio_id:     folioId,
      numero_folio: folio.numero_folio,
      inspector_id: solicitud.inspector_id,
      // Si la solicitud tenía ejecutor delegado, copiarlo al expediente
      inspector_ejecutor_id: (solicitud as any).inspector_ejecutor_id ?? null,
      kwp:          solicitud.kwp,
      ciudad:       solicitud.ciudad ?? null,
      estado_mx:    solicitud.estado_mx ?? null,
      fecha_inicio: solicitud.fecha_estimada ?? new Date().toISOString().slice(0, 10),
      status:       'en_proceso',
    }
    // Prefer the EPC client (cliente_epc_id) — that's now the true client of CIAE
    // Fall back to cliente_id for legacy records
    const clienteIdParaExp = (solicitud as any).cliente_epc_id ?? (solicitud as any).cliente_id
    if (clienteIdParaExp) {
      expInsert.cliente_id = clienteIdParaExp
    }
    if ((solicitud as any).propietario_nombre) {
      expInsert.nombre_cliente_final = (solicitud as any).propietario_nombre
    }

    // Si el inspector ya creó un expediente borrador desde esta solicitud
    // (sin folio aún), enlazamos en lugar de crear uno nuevo. Así
    // preservamos toda la info técnica que ya cargó.
    const { data: borradorExistente } = await supabase
      .from('expedientes')
      .select('id, status')
      .eq('solicitud_origen_id', solicitudId)
      .is('folio_id', null)
      .maybeSingle()

    let expCreado: { id: string } | null = null
    if (borradorExistente) {
      // UPDATE: enlazar folio + actualizar campos que faltaban
      const updPayload: Record<string, any> = {
        folio_id:     folioId,
        numero_folio: folio.numero_folio,
        // Preservamos status del borrador si ya lo movió el inspector,
        // pero si seguía en 'borrador' lo subimos a 'en_proceso'
        ...(borradorExistente.status === 'borrador' ? { status: 'en_proceso' } : {}),
      }
      const { error: updErr } = await supabase
        .from('expedientes')
        .update(updPayload)
        .eq('id', borradorExistente.id)
      if (updErr) {
        console.error('[asignar-folio] Error linkeando borrador:', updErr.message)
        return NextResponse.json({
          error: `Folio asignado pero falló enlazar el borrador: ${updErr.message}`,
        }, { status: 500 })
      }
      expCreado = { id: borradorExistente.id }
      console.log('[asignar-folio] Expediente borrador linkeado:', borradorExistente.id)
    } else {
      // No hay borrador → crear expediente desde cero (flujo original)
      expInsert.solicitud_origen_id = solicitudId
      const { data: nuevo, error: expError } = await supabase
        .from('expedientes')
        .insert(expInsert)
        .select('id')
        .single()
      if (expError) {
        console.error('[asignar-folio] Error creando expediente:', expError.message, expError.details, expError.hint)
        return NextResponse.json({
          error: `Folio asignado pero falló la creación del expediente: ${expError.message}`,
        }, { status: 500 })
      }
      expCreado = nuevo
      console.log('[asignar-folio] Expediente creado:', expCreado?.id)
    }

    // Send email notification (non-blocking — a failed email must not fail the assignment)
    const insp = solicitud.inspector as any
    if (insp?.email) {
      sendFolioAsignadoEmail({
        toEmail: insp.email,
        toName: `${insp.nombre} ${insp.apellidos ?? ''}`.trim(),
        inspectorNombre: `${insp.nombre} ${insp.apellidos ?? ''}`.trim(),
        clienteNombre: solicitud.cliente_nombre,
        numeroFolio: folio.numero_folio,
        kwp: solicitud.kwp,
        fechaEstimada: new Date(solicitud.fecha_estimada).toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        ciudad: solicitud.ciudad,
      }).catch((emailErr: any) => {
        console.error('[asignar-folio] email error (non-fatal):', emailErr?.message)
      })
    }

    return NextResponse.json({
      success: true,
      folio: folio.numero_folio,
      message: `Folio ${folio.numero_folio} asignado correctamente`,
    })

  } catch (err: any) {
    console.error('[asignar-folio]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
