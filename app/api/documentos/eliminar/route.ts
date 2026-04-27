import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
    const db = await createServiceClient()

    const { documento_id } = await req.json()
    if (!documento_id) return NextResponse.json({ error: 'Falta documento_id' }, { status: 400 })

    const { data: doc } = await db
      .from('documentos_expediente')
      .select('id, storage_path, expediente:expedientes(inspector_id)')
      .eq('id', documento_id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

    if (!esAdmin && (doc.expediente as any)?.inspector_id !== user.id) {
      return NextResponse.json({ error: 'Sin permiso para eliminar este documento' }, { status: 403 })
    }

    // Delete from storage
    if (doc.storage_path) {
      await db.storage.from('documentos').remove([doc.storage_path])
    }

    // Delete DB record
    const { error } = await db.from('documentos_expediente').delete().eq('id', documento_id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[documentos/eliminar]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
