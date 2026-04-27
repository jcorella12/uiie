import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido' }, { status: 400 })
  }

  const { id, ...fields } = body

  // Remove undefined values to avoid Supabase type issues
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  )

  if (id) {
    // ── UPDATE ──
    // Verify ownership: creator, admin/responsable, or the linked client user
    const { data: existing, error: fetchError } = await supabase
      .from('clientes')
      .select('id, created_by, usuario_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const isPrivileged = profile?.rol === 'admin' || profile?.rol === 'inspector_responsable'
    const isLinkedClient = existing.usuario_id === user.id
    const isCreator = existing.created_by === user.id

    if (!isCreator && !isPrivileged && !isLinkedClient) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este cliente' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('clientes')
      .update({ ...cleanFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, nombre')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } else {
    // ── INSERT ──
    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...cleanFields, created_by: user.id })
      .select('id, nombre')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }
}
