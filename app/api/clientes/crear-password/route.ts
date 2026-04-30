import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Genera una contraseña temporal legible: XXXX-NNNN (4 letras + 4 dígitos)
// Sin caracteres ambiguos (0/O, 1/I/l) para facilitar la lectura en pantalla o voz
function generarPasswordTemporal(): string {
  const letras  = 'ABCDEFGHJKMNPQRSTUVWXYZ' // sin I, O
  const digitos = '23456789'                  // sin 0, 1
  const L = () => letras [Math.floor(Math.random() * letras.length)]
  const D = () => digitos[Math.floor(Math.random() * digitos.length)]
  return `${L()}${L()}${L()}${L()}-${D()}${D()}${D()}${D()}`
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable', 'inspector'].includes(perfil?.rol ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  const { cliente_id } = await req.json().catch(() => ({}))
  if (!cliente_id) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 })

  // ── Obtener cliente ───────────────────────────────────────────────────────
  const { data: cliente } = await supabase
    .from('clientes').select('id, nombre, email, usuario_id').eq('id', cliente_id).single()
  if (!cliente)      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  if (!cliente.email) return NextResponse.json({ error: 'El cliente no tiene correo registrado' }, { status: 400 })

  const admin    = await createServiceClient()
  const password = generarPasswordTemporal()

  let userId = cliente.usuario_id

  if (!userId) {
    // Crear usuario nuevo con la contraseña temporal
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email:          cliente.email,
      password,
      email_confirm:  true,   // no requiere confirmar correo
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
    userId = newUser.user.id

    // Registrar en tabla usuarios y vincular a clientes
    await admin.from('usuarios').upsert(
      { id: userId, email: cliente.email, nombre: cliente.nombre, rol: 'cliente', activo: true, debe_cambiar_password: true },
      { onConflict: 'id' }
    )
    await admin.from('clientes').update({ usuario_id: userId }).eq('id', cliente.id)
  } else {
    // Usuario ya existe — actualizar contraseña y activar flag
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password })
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

    await admin.from('usuarios')
      .update({ debe_cambiar_password: true })
      .eq('id', userId)
  }

  // No se almacena la contraseña — sólo se devuelve una vez
  return NextResponse.json({ ok: true, password })
}
