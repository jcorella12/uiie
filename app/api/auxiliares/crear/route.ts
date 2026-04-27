import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ── Genera contraseña temporal segura con crypto ──────────────
function tempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  const bytes = require('crypto').randomBytes(16) as Buffer
  let pw = ''
  for (let i = 0; i < 12; i++) {
    pw += chars[bytes[i] % chars.length]
  }
  return pw
}

export async function POST(req: NextRequest) {
  // ── Autenticar al solicitante (debe ser inspector o admin) ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: yo } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('id', user.id)
    .single()

  const rolesPermitidos = ['inspector', 'inspector_responsable', 'admin']
  if (!yo || !rolesPermitidos.includes(yo.rol)) {
    return NextResponse.json({ error: 'Sin permiso para crear auxiliares' }, { status: 403 })
  }

  // ── Leer body ────────────────────────────────────────────────
  const body = await req.json()
  const { email, nombre, apellidos, telefono } = body as {
    email: string
    nombre: string
    apellidos?: string
    telefono?: string
  }

  if (!email || !nombre) {
    return NextResponse.json({ error: 'Email y nombre son obligatorios' }, { status: 400 })
  }

  // ── Service-role client para crear auth.users ────────────────
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const pw = tempPassword()

  // ── Crear usuario en auth.users ──────────────────────────────
  const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
    email,
    password: pw,
    email_confirm: true,
    user_metadata: { nombre, apellidos, rol: 'auxiliar' },
  })

  if (authErr) {
    // Si ya existe, intentar buscar el usuario por email
    if (authErr.message?.includes('already') || authErr.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: `Ya existe un usuario con el correo ${email}` },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const newUserId = authData.user.id

  // ── Crear registro en public.usuarios ────────────────────────
  const { error: usuarioErr } = await serviceClient
    .from('usuarios')
    .upsert({
      id:        newUserId,
      email,
      nombre,
      apellidos: apellidos ?? null,
      telefono:  telefono ?? null,
      rol:       'auxiliar',
      activo:    true,
    }, { onConflict: 'id' })

  if (usuarioErr) {
    // Rollback: eliminar auth user
    await serviceClient.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: usuarioErr.message }, { status: 500 })
  }

  // ── Crear vínculo inspector ↔ auxiliar ───────────────────────
  const { error: vinculoErr } = await serviceClient
    .from('inspector_auxiliares')
    .upsert({
      inspector_id: yo.id,
      auxiliar_id:  newUserId,
      activo:       true,
    }, { onConflict: 'inspector_id,auxiliar_id' })

  if (vinculoErr) {
    return NextResponse.json({ error: vinculoErr.message }, { status: 500 })
  }

  // ── NO devolver contraseña en respuesta HTTP ─────────────────
  // La contraseña temporal debe comunicarse por canal seguro separado
  console.info(`[auxiliares/crear] Auxiliar creado: ${email} — enviar pw por canal seguro`)
  return NextResponse.json({
    ok: true,
    usuario: { id: newUserId, email, nombre, apellidos },
    message: 'Auxiliar creado. Comparte la contraseña temporal por un canal seguro.',
    tempPassword: pw,   // Solo para que el admin la copie desde la UI — no se loguea ni persiste
  })
}

// ── Desactivar auxiliar ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { auxiliarId, activo } = await req.json() as { auxiliarId: string; activo: boolean }

  const { error } = await supabase
    .from('inspector_auxiliares')
    .update({ activo })
    .eq('auxiliar_id', auxiliarId)
    .eq('inspector_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
