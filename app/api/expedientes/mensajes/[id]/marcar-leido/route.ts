import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/mensajes/[id]/marcar-leido
 *
 * El cliente (o admin/responsable) marca un mensaje como leído.
 * Sirve para que el badge "tienes mensaje pendiente" desaparezca.
 *
 * Auth: cualquiera con acceso al mensaje vía RLS (cliente dueño,
 * admin o responsable).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = await createServiceClient()
  // Verificar que el usuario tiene acceso al mensaje
  const { data: msj } = await db
    .from('expediente_mensajes_cliente')
    .select('id, cliente_id, leido_at')
    .eq('id', params.id)
    .maybeSingle()
  if (!msj) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })

  if (msj.leido_at) {
    return NextResponse.json({ ok: true, ya_leido: true })
  }

  // Validar que el usuario es el cliente vinculado o admin/responsable
  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const esStaff = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  let permitido = esStaff
  if (!permitido && msj.cliente_id) {
    const { data: cli } = await db
      .from('clientes')
      .select('usuario_id')
      .eq('id', msj.cliente_id)
      .single()
    permitido = cli?.usuario_id === user.id
  }
  if (!permitido) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  await db
    .from('expediente_mensajes_cliente')
    .update({ leido_at: new Date().toISOString(), leido_por: user.id })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
