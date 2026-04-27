import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  if (!esAdmin) return NextResponse.json({ error: 'Solo administración puede emitir el certificado' }, { status: 403 })

  const { expediente_id } = await req.json()
  if (!expediente_id) return NextResponse.json({ error: 'expediente_id requerido' }, { status: 400 })

  const db = await createServiceClient()

  // Validar que el expediente esté en estado 'aprobado'
  const { data: exp } = await db
    .from('expedientes')
    .select('id, status, numero_folio, inspector_id, cliente:clientes(nombre, firmante_correo, atiende_correo)')
    .eq('id', expediente_id)
    .single()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  if (exp.status !== 'aprobado') {
    return NextResponse.json(
      { error: `El expediente debe estar en estado "Aprobado" para emitir el certificado (actual: ${exp.status})` },
      { status: 422 }
    )
  }

  // Obtener correo del inspector
  const { data: inspUser } = await db
    .from('usuarios')
    .select('nombre, email')
    .eq('id', exp.inspector_id)
    .single()

  // Marcar como cerrado
  const ahora = new Date().toISOString()
  await db
    .from('expedientes')
    .update({
      status: 'cerrado',
      updated_at: ahora,
    })
    .eq('id', expediente_id)

  const cliente = exp.cliente as any
  const clienteCorreo = cliente?.firmante_correo ?? cliente?.atiende_correo ?? null

  return NextResponse.json({
    ok: true,
    folio: exp.numero_folio,
    cerrado_en: ahora,
    inspector: {
      nombre: inspUser?.nombre ?? null,
      correo: inspUser?.email ?? null,
    },
    cliente: {
      nombre: cliente?.nombre ?? null,
      correo: clienteCorreo,
    },
  })
}
