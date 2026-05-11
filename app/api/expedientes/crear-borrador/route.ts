import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/crear-borrador
 *
 * Crea un expediente en estado 'borrador' SIN folio asignado todavía,
 * a partir de una solicitud_folio. Sirve para que el inspector pueda
 * ir adelantando la info técnica (paneles, inversor, dirección,
 * checklist, documentos del cliente, etc.) mientras admin/responsable
 * asigna el folio oficial.
 *
 * Cuando luego el folio se asigne (POST /api/folios/asignar), ese
 * endpoint detecta el borrador (vía solicitud_origen_id) y lo enlaza
 * con el folio en lugar de crear uno duplicado. Toda la info técnica
 * ya cargada se preserva.
 *
 * Body: { solicitud_id: string }
 *
 * Permisos:
 * - El inspector dueño de la solicitud (inspector_id o
 *   inspector_ejecutor_id)
 * - admin / inspector_responsable cualquiera
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json().catch(() => null) as { solicitud_id?: string } | null
    if (!body?.solicitud_id) {
      return NextResponse.json({ error: 'Falta solicitud_id' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Cargar la solicitud
    const { data: sol, error: solErr } = await db
      .from('solicitudes_folio')
      .select(`
        id, cliente_id, cliente_epc_id, cliente_nombre, propietario_nombre,
        kwp, ciudad, estado_mx, fecha_estimada, status,
        inspector_id, inspector_ejecutor_id, folio_asignado_id
      `)
      .eq('id', body.solicitud_id)
      .single()

    if (solErr || !sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

    // Authorization check
    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    const esDueno = sol.inspector_id === user.id || (sol as any).inspector_ejecutor_id === user.id
    if (!esAdmin && !esDueno) {
      return NextResponse.json(
        { error: 'No tienes permisos sobre esta solicitud — solo el inspector dueño o admin pueden adelantarla.' },
        { status: 403 },
      )
    }

    // Si ya tiene folio asignado, no tiene sentido crear borrador — debe
    // existir ya el expediente real. Devolver el id de ese expediente.
    if (sol.folio_asignado_id) {
      const { data: expExistente } = await db
        .from('expedientes')
        .select('id')
        .eq('folio_id', sol.folio_asignado_id)
        .maybeSingle()
      if (expExistente) {
        return NextResponse.json({
          ok: true,
          ya_existe: true,
          expediente_id: expExistente.id,
          mensaje: 'La solicitud ya tiene folio asignado y el expediente existe.',
        })
      }
    }

    // Si ya hay un borrador para esta solicitud, devolver ese
    const { data: borradorExistente } = await db
      .from('expedientes')
      .select('id')
      .eq('solicitud_origen_id', body.solicitud_id)
      .maybeSingle()
    if (borradorExistente) {
      return NextResponse.json({
        ok: true,
        ya_existe: true,
        expediente_id: borradorExistente.id,
        mensaje: 'Ya existe un borrador para esta solicitud — abriendo el existente.',
      })
    }

    // Crear el expediente borrador
    const cliente_id_para_exp = (sol as any).cliente_epc_id ?? sol.cliente_id ?? null

    const insertPayload: Record<string, any> = {
      // folio_id y numero_folio quedan NULL — se llenarán cuando admin
      // asigne el folio oficial (vía /api/folios/asignar que ya enlaza)
      inspector_id:          sol.inspector_id,
      inspector_ejecutor_id: (sol as any).inspector_ejecutor_id ?? null,
      cliente_id:            cliente_id_para_exp,
      kwp:                   sol.kwp,
      ciudad:                sol.ciudad ?? null,
      estado_mx:             sol.estado_mx ?? null,
      fecha_inicio:          sol.fecha_estimada ?? new Date().toISOString().slice(0, 10),
      status:                'borrador',
      solicitud_origen_id:   body.solicitud_id,
    }
    if (sol.propietario_nombre) {
      insertPayload.nombre_cliente_final = sol.propietario_nombre
    }

    const { data: nuevoExp, error: insErr } = await db
      .from('expedientes')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insErr || !nuevoExp) {
      console.error('[crear-borrador] insert error:', insErr?.message)
      return NextResponse.json({ error: `No se pudo crear el borrador: ${insErr?.message}` }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      ya_existe: false,
      expediente_id: nuevoExp.id,
    })
  } catch (err: any) {
    console.error('[POST /api/expedientes/crear-borrador]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
