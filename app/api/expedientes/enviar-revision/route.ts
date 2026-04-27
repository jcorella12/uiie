import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  const rol = u?.rol ?? ''
  const esAdmin = ['admin', 'inspector_responsable'].includes(rol)

  const { expediente_id, notas_envio } = await req.json()
  if (!expediente_id) return NextResponse.json({ error: 'expediente_id requerido' }, { status: 400 })

  const db = await createServiceClient()

  // Cargar expediente
  const { data: exp } = await db
    .from('expedientes')
    .select('id, status, inspector_id, numero_folio')
    .eq('id', expediente_id)
    .single()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  // Solo el inspector dueño o un admin puede enviar
  // expedientes.inspector_id referencia usuarios.id (no inspectores.id)
  if (!esAdmin && exp.inspector_id !== user.id) {
    return NextResponse.json({ error: 'No tienes acceso a este expediente' }, { status: 403 })
  }

  // Solo se puede enviar desde borrador, en_proceso o devuelto
  if (!['borrador', 'en_proceso', 'devuelto'].includes(exp.status)) {
    return NextResponse.json({
      error: `El expediente ya está en estado "${exp.status}" y no se puede enviar a revisión`,
    }, { status: 400 })
  }

  // Verificar que haya al menos un documento
  const { count } = await db
    .from('documentos_expediente')
    .select('id', { count: 'exact', head: true })
    .eq('expediente_id', expediente_id)

  if (!count || count === 0) {
    return NextResponse.json({ error: 'Debes subir al menos un documento antes de enviar' }, { status: 400 })
  }

  // Actualizar status del expediente
  await db
    .from('expedientes')
    .update({ status: 'revision', updated_at: new Date().toISOString() })
    .eq('id', expediente_id)

  // Crear registro de envío
  const { data: envio, error: envioError } = await db
    .from('envios_revision')
    .insert({
      expediente_id,
      enviado_por: user.id,
      notas_envio: notas_envio?.trim() || null,
    })
    .select()
    .single()

  if (envioError) {
    console.error('[enviar-revision]', envioError)
    return NextResponse.json({ error: 'Error al registrar el envío' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, envio })
}
