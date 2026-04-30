import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — upload a document for an expediente
// Accepts multipart/form-data: file, tipo, nombre, expediente_id
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
    if (!u || !rolesPermitidos.includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Service client bypasses RLS for storage + DB writes
    const db = await createServiceClient()

    const formData = await req.formData()
    const file         = formData.get('file')         as File | null
    const tipo         = formData.get('tipo')         as string | null
    const nombre       = formData.get('nombre')       as string | null
    const expedienteId = formData.get('expediente_id')as string | null

    if (!file || !tipo || !nombre || !expedienteId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo no puede superar 50 MB' }, { status: 413 })
    }

    // Verify expediente exists (and non-admin users own it)
    const { data: exp } = await db
      .from('expedientes')
      .select('id, inspector_id')
      .eq('id', expedienteId)
      .single()

    if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    if (!esAdmin && exp.inspector_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
    }

    // Build storage path under the expediente's inspector (not the admin) for consistency
    const ownerId   = exp.inspector_id ?? user.id
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${ownerId}/${expedienteId}/${timestamp}-${safeFilename}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await db.storage
      .from('documentos')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

    const { data: docData, error: insertError } = await db.from('documentos_expediente').insert({
      expediente_id: expedienteId,
      tipo,
      nombre:        nombre.trim(),
      storage_path:  storagePath,
      mime_type:     file.type,
      tamano_bytes:  file.size,
      subido_por:    user.id,
    }).select('id').single()

    if (insertError) throw new Error(`Error al registrar documento: ${insertError.message}`)

    return NextResponse.json({ success: true, documento_id: docData?.id, storage_path: storagePath })
  } catch (err: any) {
    console.error('[documentos/subir]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
