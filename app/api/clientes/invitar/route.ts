import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // ── Validar rol ─────────────────────────────────────────────────────────────
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || !['admin', 'inspector_responsable', 'inspector'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos para invitar clientes' }, { status: 403 })
  }

  // ── Body ────────────────────────────────────────────────────────────────────
  let body: { cliente_id: string; action: 'invite' | 'link'; origin?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const { cliente_id, action, origin } = body
  if (!cliente_id || !action) {
    return NextResponse.json({ error: 'cliente_id y action son requeridos' }, { status: 400 })
  }

  // ── Obtener cliente ─────────────────────────────────────────────────────────
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nombre, email, usuario_id')
    .eq('id', cliente_id)
    .single()

  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  if (!cliente.email) {
    return NextResponse.json({ error: 'El cliente no tiene correo registrado. Agrégalo primero.' }, { status: 400 })
  }

  const admin = await createServiceClient()
  // Whitelist de orígenes permitidos — evita open redirect.
  // En producción NUNCA permitimos localhost: si un inspector dispara la
  // invitación desde su entorno local (npm run dev), el correo aún debe
  // llevar al cliente a app.uiie.com.mx, no a la laptop del inspector.
  const PROD_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.uiie.com.mx'
  const isProd = process.env.NODE_ENV === 'production'
  const ALLOWED_ORIGINS = [
    PROD_URL,
    ...(!isProd ? ['http://localhost:3000', 'http://localhost:3001'] : []),
  ]
  const safeOrigin = ALLOWED_ORIGINS.includes(origin ?? '')
    ? origin!
    : PROD_URL
  const redirectTo = `${safeOrigin}/auth/callback?next=/dashboard/cliente`

  // ── Acción: invite — crea cuenta y envía correo ─────────────────────────────
  if (action === 'invite') {
    // inviteUserByEmail crea el usuario si no existe y envía el correo
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      cliente.email,
      { redirectTo }
    )

    if (inviteError) {
      // Si ya existe, simplemente enviamos un magic link como fallback
      if (inviteError.message.toLowerCase().includes('already') || inviteError.message.includes('registered')) {
        const { error: mlError } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: cliente.email,
          options: { redirectTo },
        })
        if (mlError) return NextResponse.json({ error: mlError.message }, { status: 400 })
        return NextResponse.json({ ok: true, resent: true })
      }
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    // Vincular usuario con cliente
    if (inviteData?.user?.id) {
      await vincularUsuario(admin, inviteData.user.id, cliente)
    }

    return NextResponse.json({ ok: true })
  }

  // ── Acción: link — genera link copiable sin enviar correo ───────────────────
  if (action === 'link') {
    let link: string

    if (!cliente.usuario_id) {
      // Usuario no existe aún — usar generateLink type 'invite' (crea usuario + retorna link)
      const { data: genData, error: genError } = await admin.auth.admin.generateLink({
        type: 'invite',
        email: cliente.email,
        options: { redirectTo },
      })
      if (genError) return NextResponse.json({ error: genError.message }, { status: 400 })

      link = genData.properties.action_link
      await vincularUsuario(admin, genData.user.id, cliente)
    } else {
      // Usuario ya existe — generar magic link
      const { data: mlData, error: mlError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: cliente.email,
        options: { redirectTo },
      })
      if (mlError) return NextResponse.json({ error: mlError.message }, { status: 400 })
      link = mlData.properties.action_link
    }

    return NextResponse.json({ ok: true, link })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}

// ── Helper ───────────────────────────────────────────────────────────────────

async function vincularUsuario(
  admin: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  cliente: { id: string; nombre: string; email: string }
) {
  // Upsert en tabla usuarios con rol cliente
  await admin.from('usuarios').upsert(
    { id: userId, email: cliente.email, nombre: cliente.nombre, rol: 'cliente', activo: true },
    { onConflict: 'id' }
  )
  // Vincular usuario_id en clientes
  await admin.from('clientes').update({ usuario_id: userId }).eq('id', cliente.id)
}
