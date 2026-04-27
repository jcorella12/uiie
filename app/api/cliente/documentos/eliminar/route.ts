import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const LOCKED_STATUSES = ['revision', 'aprobado', 'cerrado']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { doc_id } = await req.json()
  if (!doc_id) {
    return NextResponse.json({ error: 'doc_id es requerido' }, { status: 400 })
  }

  // Obtener el documento con info del expediente
  const { data: doc } = await supabase
    .from('documentos_expediente')
    .select('id, storage_path, subido_por_cliente, expediente_id, expediente:expedientes(id, status, cliente_id, folio_id)')
    .eq('id', doc_id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  // Solo se pueden eliminar documentos subidos por el cliente
  if (!doc.subido_por_cliente) {
    return NextResponse.json({ error: 'Solo se pueden eliminar documentos subidos por el cliente' }, { status: 403 })
  }

  const expediente = doc.expediente as any

  // Verificar que el expediente no esté bloqueado
  if (LOCKED_STATUSES.includes(expediente?.status)) {
    return NextResponse.json({ error: 'El expediente está en modo solo lectura' }, { status: 403 })
  }

  // Access verified via RLS: if doc was readable, user has access to the expediente.
  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  const rolValido = ['cliente', 'admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(perfil?.rol ?? '')
  if (!rolValido) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const serviceClient = await createServiceClient()

  // Eliminar archivo del storage
  if (doc.storage_path) {
    const { error: storageError } = await serviceClient.storage
      .from('documentos')
      .remove([doc.storage_path])

    if (storageError) {
      console.error('Error eliminando archivo del storage:', storageError)
      // Continuar aunque falle el storage para no dejar registros huérfanos
    }
  }

  // Eliminar registro de la base de datos
  const { error: deleteError } = await serviceClient
    .from('documentos_expediente')
    .delete()
    .eq('id', doc_id)

  if (deleteError) {
    console.error('Error eliminando registro de documento:', deleteError)
    return NextResponse.json({ error: 'Error al eliminar el documento' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
