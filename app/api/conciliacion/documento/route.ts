import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/conciliacion/documento
// Multipart: { conciliacion_id, tipo: 'factura'|'comprobante', file }
// - 'factura'     → solo admin/inspector_responsable
// - 'comprobante' → inspector dueño de la conciliación
export async function POST(request: NextRequest) {
  try {
    const supabase   = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuarioData) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const formData       = await request.formData()
    const file           = formData.get('file')          as File | null
    const conciliacionId = formData.get('conciliacion_id') as string | null
    const tipo           = formData.get('tipo')          as 'factura' | 'comprobante' | null

    if (!file || !conciliacionId || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }
    if (!['factura', 'comprobante'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Obtener la conciliación
    const { data: conc, error: concError } = await db
      .from('conciliaciones')
      .select('id, inspector_id, status')
      .eq('id', conciliacionId)
      .single()

    if (concError || !conc) {
      return NextResponse.json({ error: 'Conciliación no encontrada' }, { status: 404 })
    }

    // Validar permisos según tipo
    const esStaff = ['admin', 'inspector_responsable'].includes(usuarioData.rol)
    const esDueno  = conc.inspector_id === user.id

    if (tipo === 'factura' && !esStaff) {
      return NextResponse.json({ error: 'Solo el equipo CIAE puede subir la factura' }, { status: 403 })
    }
    if (tipo === 'comprobante' && !esDueno && !esStaff) {
      return NextResponse.json({ error: 'Solo el inspector puede subir su comprobante' }, { status: 403 })
    }

    // Subir archivo a Storage
    const ext       = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const timestamp = Date.now()
    const path      = `conciliaciones/${conciliacionId}/${tipo}-${timestamp}.${ext}`
    const buffer    = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await db.storage
      .from('documentos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (storageError) throw storageError

    // El bucket "documentos" es privado — la URL pública NO funciona.
    // Persistimos solo el storage_path; la URL firmada se genera bajo demanda
    // al leer el documento (lifetime corto, regenerable).
    const { data: signed } = await db.storage
      .from('documentos')
      .createSignedUrl(path, 60 * 60)
    const signedUrl = signed?.signedUrl ?? null

    // Actualizar conciliación. Las columnas *_url se mantienen para retrocompat,
    // pero el path es la fuente de verdad.
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (tipo === 'factura') {
      updatePayload.factura_url          = signedUrl
      updatePayload.factura_storage_path = path
      updatePayload.factura_nombre       = file.name
      updatePayload.factura_subida_at    = new Date().toISOString()
      updatePayload.factura_subida_por   = user.id
      // Avanzar status si estaba en aceptada
      if (conc.status === 'aceptada') updatePayload.status = 'facturada'
    } else {
      updatePayload.comprobante_url          = signedUrl
      updatePayload.comprobante_storage_path = path
      updatePayload.comprobante_nombre       = file.name
      updatePayload.comprobante_subido_at    = new Date().toISOString()
      // Si ya tiene factura, marcar como pagada
      if (['facturada'].includes(conc.status)) updatePayload.status = 'pagada'
    }

    const { error: updateError } = await db
      .from('conciliaciones')
      .update(updatePayload)
      .eq('id', conciliacionId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, url: signedUrl, nombre: file.name })

  } catch (err: any) {
    console.error('[conciliacion/documento]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
