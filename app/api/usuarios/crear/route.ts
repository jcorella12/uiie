import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // ── Auth: solo admin / inspector_responsable ─────────────────────────────
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

  // ── Body ─────────────────────────────────────────────────────────────────
  let body: { email: string; nombre: string; apellidos?: string; telefono?: string; rol: string; password?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const { email, nombre, apellidos, telefono, rol, password } = body

  if (!email || !nombre || !rol) {
    return NextResponse.json({ error: 'Email, nombre y rol son requeridos' }, { status: 400 })
  }

  const rolesPermitidos = ['inspector', 'inspector_responsable', 'auxiliar', 'cliente', 'admin']
  if (!rolesPermitidos.includes(rol)) {
    return NextResponse.json({ error: 'Rol no válido' }, { status: 400 })
  }

  // inspector_responsable no puede crear usuarios con rol 'admin'
  if (perfil?.rol === 'inspector_responsable' && rol === 'admin') {
    return NextResponse.json({ error: 'No tienes permiso para crear usuarios con rol administrador' }, { status: 403 })
  }

  // ── Crear usuario en Auth (service role) ─────────────────────────────────
  const admin = await createServiceClient()

  // Crear el usuario en Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: password || undefined,
    email_confirm: true,  // marcar email como confirmado
    user_metadata: { nombre, apellidos: apellidos || null },
  })

  if (authError) {
    // Mensaje amigable para email duplicado
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo electrónico.' }, { status: 409 })
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const newUserId = authData.user.id

  // ── Upsert en tabla usuarios ──────────────────────────────────────────────
  const { error: dbError } = await admin
    .from('usuarios')
    .upsert({
      id: newUserId,
      email,
      nombre,
      apellidos: apellidos || null,
      telefono: telefono || null,
      rol,
      activo: true,
    })

  if (dbError) {
    // Rollback: eliminar el usuario de Auth para no dejar registros huérfanos
    console.error('[crear-usuario] Error insertando en usuarios, haciendo rollback de Auth:', dbError)
    await admin.auth.admin.deleteUser(newUserId).catch(e =>
      console.error('[crear-usuario] No se pudo hacer rollback del usuario Auth:', e.message)
    )
    return NextResponse.json({ error: 'Error al crear el perfil del usuario. Intenta de nuevo.' }, { status: 500 })
  }

  // Si no se dio contraseña, enviar magic link / invite
  if (!password) {
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
  }

  return NextResponse.json({ ok: true, id: newUserId })
}
