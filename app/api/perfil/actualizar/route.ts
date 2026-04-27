import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { nombre, apellidos, telefono, avatar_url, numero_cedula, especialidad } = body

  // ── Validaciones básicas ──────────────────────────────────────
  if (nombre !== undefined && (!nombre || nombre.trim().length < 2)) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
  }

  // ── Actualizar tabla usuarios ────────────────────────────────
  const usuarioFields: Record<string, any> = {}
  if (nombre     !== undefined) usuarioFields.nombre     = nombre.trim()
  if (apellidos  !== undefined) usuarioFields.apellidos  = apellidos?.trim() || null
  if (telefono   !== undefined) usuarioFields.telefono   = telefono?.trim()  || null
  if (avatar_url !== undefined) usuarioFields.avatar_url = avatar_url || null

  if (Object.keys(usuarioFields).length > 0) {
    const { error } = await supabase
      .from('usuarios')
      .update(usuarioFields)
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Actualizar tabla inspectores (si aplica) ─────────────────
  const inspectorFields: Record<string, any> = {}
  if (numero_cedula !== undefined) inspectorFields.numero_cedula = numero_cedula?.trim() || null
  if (especialidad  !== undefined) inspectorFields.especialidad  = especialidad?.trim()  || null

  if (Object.keys(inspectorFields).length > 0) {
    // Verificar que el usuario tiene perfil de inspector
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rolesInspector = ['inspector', 'inspector_responsable']
    if (perfil && rolesInspector.includes(perfil.rol)) {
      // Upsert: puede que aún no tenga fila en inspectores
      await supabase
        .from('inspectores')
        .upsert(
          { usuario_id: user.id, ...inspectorFields },
          { onConflict: 'usuario_id' }
        )
    }
  }

  return NextResponse.json({ ok: true })
}
