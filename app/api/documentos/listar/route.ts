import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/documentos/listar?expediente_id=...&tipo=...
 * Devuelve los documentos de un expediente, opcionalmente filtrados por tipo.
 * Ordenados del más reciente al más antiguo.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  const db = esAdmin ? await createServiceClient() : supabase

  const { searchParams } = new URL(req.url)
  const expedienteId = searchParams.get('expediente_id')
  const tipo         = searchParams.get('tipo')

  if (!expedienteId) {
    return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })
  }

  let query = db
    .from('documentos_expediente')
    .select('id, nombre, tipo, mime_type, tamano_bytes, analisis_ia, analizado_en, created_at, storage_path')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: false })

  if (tipo) {
    query = query.eq('tipo', tipo) as typeof query
  }

  const { data: docs, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ docs: docs ?? [] })
}
