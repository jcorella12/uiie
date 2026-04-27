import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/cliente/expediente/notificar
 * Body: { expediente_id: string }
 *
 * Marca cli_completado_at = now() en el expediente
 * para indicar que el cliente ya subió su información
 * y quiere que el inspector la revise.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esCliente = usuario?.rol === 'cliente'
  const esStaff   = ['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(usuario?.rol ?? '')

  if (!esCliente && !esStaff) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const { expediente_id } = body
  if (!expediente_id) {
    return NextResponse.json({ error: 'expediente_id requerido' }, { status: 400 })
  }

  // Verificar propiedad del expediente según rol
  if (esCliente) {
    const { data: clienteRecord } = await supabase
      .from('clientes')
      .select('id')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (!clienteRecord) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const { data: exp } = await supabase
      .from('expedientes')
      .select('id')
      .eq('id', expediente_id)
      .eq('cliente_id', clienteRecord.id)
      .maybeSingle()

    if (!exp) {
      return NextResponse.json({ error: 'Expediente no encontrado o sin acceso' }, { status: 403 })
    }
  } else if (esStaff) {
    // Staff solo puede marcar si es admin/responsable O si es el inspector del expediente
    const esAdmin = ['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')
    if (!esAdmin) {
      const { data: exp } = await supabase
        .from('expedientes')
        .select('inspector_id')
        .eq('id', expediente_id)
        .maybeSingle()

      if (!exp || exp.inspector_id !== user.id) {
        return NextResponse.json({ error: 'Sin permisos sobre este expediente' }, { status: 403 })
      }
    }
  }

  const ahora = new Date().toISOString()
  const db    = await createServiceClient()

  const { error } = await db
    .from('expedientes')
    .update({ cli_completado_at: ahora })
    .eq('id', expediente_id)

  if (error) {
    console.error('[notificar] update error:', error)
    return NextResponse.json({ error: 'Error al registrar la notificación' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notificado_at: ahora })
}
