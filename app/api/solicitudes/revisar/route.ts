import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    // Auth con createClient (RLS-aware), no con serviceClient
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!adminUser || !['admin', 'inspector_responsable'].includes(adminUser.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { solicitudId, nuevoStatus, notas_responsable } = body

    if (!solicitudId || !nuevoStatus) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const statusPermitidos = ['en_revision', 'aprobada', 'rechazada']
    if (!statusPermitidos.includes(nuevoStatus)) {
      return NextResponse.json({ error: 'Status no permitido' }, { status: 400 })
    }

    // Validar transición — la matriz de transiciones permitidas es:
    //   pendiente    → en_revision | aprobada | rechazada
    //   en_revision  → aprobada    | rechazada
    //   aprobada     → (terminal — sólo admin moviendo manualmente, no aquí)
    //   rechazada    → (terminal)
    //   folio_asignado → (terminal — el folio ya está asignado, no se puede des-revisar)
    const db = await createServiceClient()
    const { data: solActual, error: errLoad } = await db
      .from('solicitudes_folio')
      .select('status')
      .eq('id', solicitudId)
      .maybeSingle()
    if (errLoad || !solActual) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const transiciones: Record<string, string[]> = {
      pendiente:      ['en_revision', 'aprobada', 'rechazada'],
      en_revision:    ['aprobada', 'rechazada'],
      aprobada:       [],
      rechazada:      [],
      folio_asignado: [],
    }
    if (!(transiciones[solActual.status] ?? []).includes(nuevoStatus)) {
      return NextResponse.json({
        error: `Transición no permitida: ${solActual.status} → ${nuevoStatus}`,
      }, { status: 409 })
    }

    const updateData: Record<string, any> = {
      status: nuevoStatus,
      revisado_por: user.id,
      fecha_revision: new Date().toISOString(),
    }
    if (notas_responsable !== undefined) {
      updateData.notas_responsable = notas_responsable
    }

    // Usar serviceClient para el update (bypas RLS de escritura)
    const { error } = await db
      .from('solicitudes_folio')
      .update(updateData)
      .eq('id', solicitudId)

    if (error) {
      console.error('[solicitudes/revisar] update error:', error)
      throw error
    }

    return NextResponse.json({ success: true, status: nuevoStatus })
  } catch (err: any) {
    console.error('[solicitudes/revisar]', err)
    return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
  }
}
