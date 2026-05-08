import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { syncCertificadoCre } from '@/lib/certificados/sync'

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
      .select('id, inspector_id, status')
      .eq('id', expediente_id)
      .single()

    if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    if (!esAdmin && exp.inspector_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
    }

    // No se puede modificar datos del certificado si el expediente ya está cerrado
    if (exp.status === 'cerrado' && !esAdmin) {
      return NextResponse.json({ error: 'El expediente está cerrado y no puede modificarse' }, { status: 422 })
    }

    const { error } = await db
      .from('expedientes')
      .update({
        numero_certificado:        numero_certificado?.trim() || null,
        fecha_emision_certificado: fecha_emision_certificado || null,
      })
      .eq('id', expediente_id)

    if (error) throw error

    // Sincroniza con la tabla central certificados_cre (Bóveda CNE / Mis
    // Certificados). Solo crea/actualiza la fila si ya hay un PDF de
    // certificado subido en documentos_expediente. Si solo se llenó el
    // número, se materializará al subir el PDF.
    const sync = await syncCertificadoCre(db, expediente_id, user.id)
    if (!sync.ok && sync.reason !== 'sin_documento_certificado_cre') {
      // Logueamos pero no rompemos la respuesta — guardar el número del
      // expediente igual debe funcionar aunque la sincronización falle
      console.warn('[expedientes/certificado] sync skipped:', sync.reason)
    }

    return NextResponse.json({ success: true, sincronizado: sync.ok })
  } catch (err: any) {
    console.error('[expedientes/certificado]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
