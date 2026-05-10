import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { syncCertificadoCre } from '@/lib/certificados/sync'

/**
 * POST /api/cne/inbound/pendientes/[id]/resolver
 *
 * Aplica un correo CNE pendiente a un expediente específico (elegido
 * por el admin desde la UI de revisión manual).
 *
 * Body: { expediente_id: string }
 *  o    { descartar: true, motivo: string }   ← marca como descartado
 *
 * Solo admin / inspector_responsable.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json().catch(() => null) as
    | { expediente_id?: string; descartar?: boolean; motivo?: string }
    | null
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const db = await createServiceClient()

  const { data: pendiente } = await db
    .from('cne_inbound_pendientes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pendiente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (pendiente.status !== 'pendiente') {
    return NextResponse.json({ error: `Ya fue ${pendiente.status}` }, { status: 422 })
  }

  // ── Descartar ──────────────────────────────────────────────────────
  if (body.descartar) {
    if (!body.motivo || body.motivo.trim().length < 5) {
      return NextResponse.json({ error: 'Motivo de descarte requerido (mín 5 chars)' }, { status: 400 })
    }
    await db.from('cne_inbound_pendientes').update({
      status:           'descartado',
      motivo_descarte:  body.motivo.trim(),
      resuelto_por:     user.id,
      resuelto_at:      new Date().toISOString(),
    }).eq('id', params.id)
    return NextResponse.json({ ok: true, descartado: true })
  }

  // ── Aplicar a expediente ──────────────────────────────────────────
  if (!body.expediente_id) {
    return NextResponse.json({ error: 'expediente_id requerido' }, { status: 400 })
  }

  // Verificar que el expediente existe
  const { data: exp } = await db
    .from('expedientes')
    .select('id, numero_folio, numero_certificado')
    .eq('id', body.expediente_id)
    .single()
  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  // Si ya tenía cert, advertir pero permitir sobrescribir (admin lo está haciendo a mano)
  // 1. Insertar el documento
  if (pendiente.pdf_storage_path) {
    await db.from('documentos_expediente').insert({
      expediente_id: exp.id,
      tipo:          'certificado_cre',
      nombre:        pendiente.pdf_nombre ?? `Certificado ${pendiente.numero_certificado}`,
      storage_path:  pendiente.pdf_storage_path,
      mime_type:     'application/pdf',
      tamano_bytes:  pendiente.pdf_size_bytes ?? 0,
      subido_por:    user.id,
    })
  }

  // 2. Actualizar expediente con número y fecha
  const update: Record<string, any> = {}
  if (pendiente.numero_certificado) update.numero_certificado = pendiente.numero_certificado
  // La fecha de emisión la tomamos del received_at del correo (no tenemos
  // mejor referencia desde el body sin parsing más complejo)
  update.fecha_emision_certificado = (pendiente.received_at as string).slice(0, 10)
  await db.from('expedientes').update(update).eq('id', exp.id)

  // 3. Sincronizar con Bóveda CNE
  try {
    await syncCertificadoCre(db, exp.id, user.id)
  } catch (e: any) {
    console.warn('[cne/inbound/resolver] sync warning:', e?.message)
  }

  // 4. Marcar como aplicado
  await db.from('cne_inbound_pendientes').update({
    status:        'aplicado',
    expediente_id: exp.id,
    resuelto_por:  user.id,
    resuelto_at:   new Date().toISOString(),
  }).eq('id', params.id)

  return NextResponse.json({ ok: true, aplicado_a: exp.numero_folio })
}
