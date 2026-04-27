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

    const updateData: Record<string, any> = {
      status: nuevoStatus,
      revisado_por: user.id,
      fecha_revision: new Date().toISOString(),
    }
    if (notas_responsable !== undefined) {
      updateData.notas_responsable = notas_responsable
    }

    // Usar serviceClient para el update (bypas RLS de escritura)
    const db = await createServiceClient()
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
