import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH /api/expedientes/certificado
// Body: { expediente_id, numero_certificado, fecha_emision_certificado }
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
    if (!u || !rolesPermitidos.includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { expediente_id, numero_certificado, fecha_emision_certificado } = await req.json()
    if (!expediente_id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

    const db = await createServiceClient()

    // Verify expediente exists and check ownership for non-admins
    const { data: exp } = await db
      .from('expedientes')
      .select('id, inspector_id')
      .eq('id', expediente_id)
      .single()

    if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    if (!esAdmin && exp.inspector_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
    }

    const { error } = await db
      .from('expedientes')
      .update({
        numero_certificado:        numero_certificado?.trim() || null,
        fecha_emision_certificado: fecha_emision_certificado || null,
      })
      .eq('id', expediente_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[expedientes/certificado]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
