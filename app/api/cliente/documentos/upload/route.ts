import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const LOCKED_STATUSES = ['revision', 'aprobado', 'cerrado']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file          = formData.get('file')          as File | null
  const expediente_id = formData.get('expediente_id') as string | null
  const tipo          = formData.get('tipo')          as string | null
  const nombre        = formData.get('nombre')        as string | null

  if (!file || !expediente_id || !tipo || !nombre) {
    return NextResponse.json({ error: 'Faltan campos requeridos: file, expediente_id, tipo, nombre' }, { status: 400 })
  }

  // Validar tamaño (50 MB máximo)
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo excede el tamaño máximo permitido (50 MB)' }, { status: 413 })
  }

  // Validar tipo MIME
  const MIMES_PERMITIDOS = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  ]
  if (file.type && !MIMES_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo PDF e imágenes.' }, { status: 415 })
  }

  // Obtener expediente
  const { data: expediente } = await supabase
    .from('expedientes')
    .select('id, status, cliente_id, folio_id')
    .eq('id', expediente_id)
    .single()

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // Verificar si el expediente está bloqueado
  if (LOCKED_STATUSES.includes(expediente.status)) {
    return NextResponse.json({ error: 'El expediente está en modo solo lectura' }, { status: 403 })
  }

  // Access check: the expediente query above used the RLS-aware client.
  // If it returned data, the user's RLS policy (cliente_read_own_expedientes) allowed it.
  // Additionally verify the user has a cliente role, not just an open inspector session.
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  const esCliente = perfil?.rol === 'cliente'
  const esStaff   = ['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(perfil?.rol ?? '')

  if (!esCliente && !esStaff) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // For staff accessing via this client-upload endpoint, verify they own the expediente
  if (esStaff) {
    const { data: expStaff } = await supabase
      .from('expedientes')
      .select('id')
      .eq('id', expediente_id)
      .single()
    if (!expStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Determinar extensión del archivo
  const originalName = file.name
  const ext = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : 'bin'
  const storagePath = `cliente/${expediente_id}/${tipo}-${Date.now()}.${ext}`

  // Subir archivo al bucket
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const serviceClient = await createServiceClient()
  const { error: uploadError } = await serviceClient.storage
    .from('documentos')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error subiendo archivo:', uploadError)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }

  // Insertar registro en documentos_expediente
  const { data: docRecord, error: insertError } = await serviceClient
    .from('documentos_expediente')
    .insert({
      expediente_id,
      nombre,
      tipo,
      storage_path: storagePath,
      mime_type:    file.type || null,
      tamano_bytes: file.size || null,
      subido_por_cliente: true,
    })
    .select('id, nombre, tipo, storage_path')
    .single()

  if (insertError || !docRecord) {
    console.error('Error insertando documento:', insertError)
    // Intentar limpiar el archivo subido
    await serviceClient.storage.from('documentos').remove([storagePath])
    return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 })
  }

  // Generar URL pública
  const { data: urlData } = serviceClient.storage.from('documentos').getPublicUrl(storagePath)

  return NextResponse.json({
    ok: true,
    doc: {
      id:          docRecord.id,
      nombre:      docRecord.nombre,
      tipo:        docRecord.tipo,
      storage_path: docRecord.storage_path,
      publicUrl:   urlData.publicUrl,
    },
  })
}
