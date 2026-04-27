import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * PATCH /api/usuarios/actualizar
 * Actualiza datos de un usuario: nombre, apellidos, teléfono, rol, activo y/o contraseña.
 * Solo accesible para admin / inspector_responsable.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const {
    id,           // UUID del usuario a actualizar
    nombre,
    apellidos,
    telefono,
    rol,
    activo,
    password,     // opcional — si viene, se cambia la contraseña
  } = body

  if (!id) return NextResponse.json({ error: 'Falta id del usuario' }, { status: 400 })

  const admin = await createServiceClient()

  // ── 1. Actualizar tabla pública usuarios ─────────────────────────────────
  const updatePub: Record<string, unknown> = {}
  if (nombre    !== undefined) updatePub.nombre    = nombre
  if (apellidos !== undefined) updatePub.apellidos = apellidos || null
  if (telefono  !== undefined) updatePub.telefono  = telefono || null
  if (rol       !== undefined) updatePub.rol       = rol
  if (activo    !== undefined) updatePub.activo    = activo

  if (Object.keys(updatePub).length > 0) {
    const { error: errPub } = await admin
      .from('usuarios')
      .update(updatePub)
      .eq('id', id)

    if (errPub) return NextResponse.json({ error: errPub.message }, { status: 500 })
  }

  // ── 2. Cambiar contraseña si se proporcionó ───────────────────────────────
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    const { error: errPass } = await admin.auth.admin.updateUserById(id, { password })
    if (errPass) return NextResponse.json({ error: errPass.message }, { status: 500 })
  }

  // ── 3. Cambiar email si se proporcionó ────────────────────────────────────
  if (body.email) {
    const { error: errEmail } = await admin.auth.admin.updateUserById(id, {
      email: body.email,
      email_confirm: true,
    })
    if (errEmail) return NextResponse.json({ error: errEmail.message }, { status: 500 })

    await admin.from('usuarios').update({ email: body.email }).eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
