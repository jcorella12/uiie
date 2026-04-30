import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const q  = url.searchParams.get('q')?.trim() ?? ''
  const id = url.searchParams.get('id')?.trim() ?? ''

  // Fetch single inversor by ID (for initializing a previously-selected catalog entry)
  if (id) {
    const { data, error } = await supabase
      .from('inversores')
      .select('id, marca, modelo, potencia_kw, certificacion, certificado_url, fase')
      .eq('id', id)
      .single()
    if (error || !data) return NextResponse.json({ inversor: null })
    return NextResponse.json({ inversor: data })
  }

  // Search by brand or model (ordered by usage count so popular ones come first)
  let query = supabase
    .from('inversores')
    .select('id, marca, modelo, potencia_kw, certificacion, certificado_url, fase')
    .eq('activo', true)
    .order('total_usos', { ascending: false })
    .limit(25)

  if (q) {
    query = query.or(`marca.ilike.%${q}%,modelo.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inversores: data ?? [] })
}
