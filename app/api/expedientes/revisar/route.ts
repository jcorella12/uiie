import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH — admin aprueba o rechaza el paquete documental
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  if (!esAdmin) return NextResponse.json({ error: 'Solo administradores pueden revisar' }, { status: 403 })

  const { expediente_id, envio_id, decision, notas_revision } = await req.json()
  if (!expediente_id || !decision) {
    return NextResponse.json({ error: 'expediente_id y decision requeridos' }, { status: 400 })
  }
  if (!['aprobado', 'rechazado'].includes(decision)) {
    return NextResponse.json({ error: 'decision debe ser "aprobado" o "rechazado"' }, { status: 400 })
  }

  const db = await createServiceClient()

  // Solo permitir cambio de status si el expediente está en estado 'revision'
  // (significa que el inspector ya envió a revisión y el admin lo evalúa).
  // Bloquea reapertura accidental de un expediente ya cerrado o aprobado.
  const { data: expActual } = await db
    .from('expedientes').select('status').eq('id', expediente_id).maybeSingle()
  if (!expActual) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }
  if (expActual.status !== 'revision') {
    return NextResponse.json({
      error: `El expediente debe estar en revisión para aprobarse o devolverse (status actual: ${expActual.status})`,
    }, { status: 409 })
  }

  // Actualizar expediente
  const nuevoStatus = decision === 'aprobado' ? 'aprobado' : 'devuelto'
  await db
    .from('expedientes')
    .update({ status: nuevoStatus, updated_at: new Date().toISOString() })
    .eq('id', expediente_id)

  // Actualizar envío de revisión
  if (envio_id) {
    await db
      .from('envios_revision')
      .update({
        decision,
        revisado_por: user.id,
        revisado_en: new Date().toISOString(),
        notas_revision: notas_revision?.trim() || null,
      })
      .eq('id', envio_id)
  } else {
    // Si no se pasó envio_id, actualizar el más reciente
    await db
      .from('envios_revision')
      .update({
        decision,
        revisado_por: user.id,
        revisado_en: new Date().toISOString(),
        notas_revision: notas_revision?.trim() || null,
      })
      .eq('expediente_id', expediente_id)
      .is('decision', null)
      .order('created_at', { ascending: false })
      .limit(1)
  }

  return NextResponse.json({ ok: true, decision, nuevoStatus })
}

// PATCH para marcar/desmarcar un documento individual como revisado
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  if (!esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { documento_id, revisado, nota_revision } = await req.json()
  if (!documento_id) return NextResponse.json({ error: 'documento_id requerido' }, { status: 400 })

  const db = await createServiceClient()
  await db
    .from('documentos_expediente')
    .update({
      revisado: revisado ?? true,
      revisado_por: user.id,
      revisado_en: revisado ? new Date().toISOString() : null,
      nota_revision: nota_revision?.trim() || null,
    })
    .eq('id', documento_id)

  return NextResponse.json({ ok: true })
}
