import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncCertificadoCre } from '@/lib/certificados/sync'

/**
 * POST /api/cne/inbound
 *
 * Webhook de SendGrid Inbound Parse. Recibe correos del CNE con el
 * certificado de cumplimiento adjunto. Intenta auto-asignarlo al
 * expediente correspondiente; si no es posible, lo deja en la cola
 * cne_inbound_pendientes para revisión manual.
 *
 * Seguridad: requiere ?secret=XXX que coincida con CNE_INBOUND_SECRET
 * (configurado tanto en Vercel env vars como en la URL del webhook
 * que se le da a SendGrid).
 *
 * Formato del payload (multipart/form-data):
 *   from, to, subject, text, html, attachments (count)
 *   attachment1, attachment2, ... (File)
 *
 * Estrategia de match:
 *   1. Extrae numero_certificado del body (regex: UIIE-CC-\d{5}-\d{4})
 *   2. Extrae cliente del body
 *   3. Busca expedientes status IN ('aprobado','cerrado','en_proceso','revision')
 *      con cliente fuzzy-match Y sin numero_certificado
 *   4. Si exactamente 1 match → auto-aplica
 *   5. Si 0 o varios → guarda en cne_inbound_pendientes
 */

const CERT_REGEX = /UIIE-CC-\d{4,6}-\d{4}/i
// "instalación de XXX" o "instalación de XXX ubicada"
const CLIENTE_REGEX = /instalaci[oó]n\s+de\s+(.+?)(?:\s+ubicad|\s+resultado|\.\s|\n)/i

const STATUSES_CANDIDATOS = ['en_proceso', 'revision', 'aprobado', 'cerrado']

export async function POST(req: NextRequest) {
  // Auth via shared secret en query
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (!process.env.CNE_INBOUND_SECRET) {
    console.error('[cne/inbound] CNE_INBOUND_SECRET no está configurado')
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }
  if (secret !== process.env.CNE_INBOUND_SECRET) {
    console.warn('[cne/inbound] secret inválido — rechazado')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const from    = String(formData.get('from')    ?? '')
    const to      = String(formData.get('to')      ?? '')
    const subject = String(formData.get('subject') ?? '')
    const text    = String(formData.get('text')    ?? '')

    // Adjuntos
    const attachmentCount = Number(formData.get('attachments') ?? 0)
    const attachments: Array<{ name: string; file: File }> = []
    for (let i = 1; i <= attachmentCount; i++) {
      const f = formData.get(`attachment${i}`)
      if (f instanceof File) {
        attachments.push({ name: f.name, file: f })
      }
    }
    // PDF candidato: el primer adjunto que sea application/pdf o termine en .pdf
    const pdfAtt = attachments.find(a =>
      a.file.type === 'application/pdf' || /\.pdf$/i.test(a.name)
    )

    // Extracción
    const certMatch = text.match(CERT_REGEX) ?? subject.match(CERT_REGEX)
    const numero_certificado = certMatch ? certMatch[0].toUpperCase() : null

    const cliMatch = text.match(CLIENTE_REGEX)
    const cliente_extraido = cliMatch ? cliMatch[1].trim().replace(/\s+/g, ' ') : null

    const db = await createServiceClient()

    // Subir PDF al bucket si existe
    let pdf_storage_path: string | null = null
    let pdf_nombre: string | null = null
    let pdf_size_bytes: number | null = null
    if (pdfAtt) {
      const ts = Date.now()
      const safe = pdfAtt.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      pdf_storage_path = `cne-inbound/${ts}-${safe}`
      pdf_nombre       = pdfAtt.name
      pdf_size_bytes   = pdfAtt.file.size
      const buf = await pdfAtt.file.arrayBuffer()
      const { error: upErr } = await db.storage
        .from('documentos')
        .upload(pdf_storage_path, buf, { contentType: 'application/pdf', upsert: false })
      if (upErr) {
        console.error('[cne/inbound] storage upload error:', upErr.message)
        pdf_storage_path = null  // no inflar el registro con paths falsos
      }
    }

    // Buscar candidatos por cliente (fuzzy)
    let candidates: Array<{ expediente_id: string; folio: string; cliente: string; score: number }> = []
    if (cliente_extraido) {
      // Tomamos los expedientes en estado relevante sin número de certificado
      const { data: exps } = await db
        .from('expedientes')
        .select('id, numero_folio, status, nombre_cliente_final, cliente:clientes(nombre), inspector_id')
        .in('status', STATUSES_CANDIDATOS)
        .is('numero_certificado', null)

      candidates = (exps ?? [])
        .map((e: any) => {
          const target = (e.nombre_cliente_final ?? e.cliente?.nombre ?? '')
            .toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
          const search = cliente_extraido.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
          if (!target || !search) return null
          // Score simple: nº de tokens del search que aparecen en target
          const tokens = search.split(/\s+/).filter(t => t.length >= 3)
          if (tokens.length === 0) return null
          const hits = tokens.filter(t => target.includes(t)).length
          const score = hits / tokens.length
          return {
            expediente_id: e.id,
            folio:         e.numero_folio,
            cliente:       e.nombre_cliente_final ?? e.cliente?.nombre ?? '—',
            score,
          }
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.score >= 0.5)
        .sort((a, b) => b.score - a.score)
    }

    // ── Auto-aplicar si hay exactamente 1 match con score perfecto ───────
    let autoResolvido = false
    let autoExpedienteId: string | null = null
    if (
      pdf_storage_path && numero_certificado &&
      candidates.length === 1 && candidates[0].score >= 0.85
    ) {
      const exp = candidates[0]
      // 1. Insertar documento del cert
      await db.from('documentos_expediente').insert({
        expediente_id: exp.expediente_id,
        tipo:          'certificado_cre',
        nombre:        pdf_nombre ?? `Certificado ${numero_certificado}`,
        storage_path:  pdf_storage_path,
        mime_type:     'application/pdf',
        tamano_bytes:  pdf_size_bytes ?? 0,
        // subido_por queda null (auto-import desde webhook)
      })
      // 2. Actualizar expediente
      const today = new Date().toISOString().slice(0, 10)
      await db.from('expedientes').update({
        numero_certificado:        numero_certificado,
        fecha_emision_certificado: today,
      }).eq('id', exp.expediente_id)
      // 3. Sincronizar con Bóveda CNE
      try {
        await syncCertificadoCre(db, exp.expediente_id, null)
      } catch (e: any) {
        console.warn('[cne/inbound] sync Bóveda CNE warning:', e?.message)
      }
      autoResolvido = true
      autoExpedienteId = exp.expediente_id
    }

    // ── Registrar siempre en la cola (también los auto, para auditoría) ──
    const { error: insErr } = await db.from('cne_inbound_pendientes').insert({
      from_email:          from || null,
      to_email:            to || null,
      subject:             subject || null,
      body_text:           text?.slice(0, 8000) || null,
      numero_certificado,
      cliente_extraido,
      pdf_storage_path,
      pdf_nombre,
      pdf_size_bytes,
      match_candidates:    candidates.slice(0, 10),
      status:              autoResolvido ? 'aplicado' : 'pendiente',
      expediente_id:       autoExpedienteId,
      auto_resuelto:       autoResolvido,
      resuelto_at:         autoResolvido ? new Date().toISOString() : null,
    })
    if (insErr) {
      console.error('[cne/inbound] insert pendiente error:', insErr.message)
    }

    return NextResponse.json({
      ok: true,
      auto_resuelto:      autoResolvido,
      numero_certificado, cliente_extraido,
      candidates_count:   candidates.length,
      expediente_id:      autoExpedienteId,
    })
  } catch (err: any) {
    console.error('[cne/inbound] error', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

// Para que SendGrid pueda hacer health checks o verificaciones
export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST only — SendGrid Inbound Parse webhook' })
}
