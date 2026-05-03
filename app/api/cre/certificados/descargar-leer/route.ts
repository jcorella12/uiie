import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { registrarCostoIA } from '@/lib/ai/cost'

const CRE_BOVEDA = 'https://cre-boveda.azurewebsites.net/Api/Documento'
const BUCKET     = 'certificados-cne'

const AI_PROMPT = `Eres un extractor de datos de certificados de la CNE (Comisión Nacional de Energía) de México.
Analiza este PDF de certificado de cumplimiento de interconexión y extrae los siguientes datos en JSON:

{
  "numero_certificado": "string — número de certificado, formato UIIE-CC-NNNNN-YYYY (ej. UIIE-CC-02311-2026)",
  "fecha_emision": "string — fecha en formato YYYY-MM-DD (ej. 2026-01-09)",
  "folio_interno": "string — campo 'NumeroActaInspeccion' o 'Número Acta de Inspección', formato UIIE-NNN-YYYY (ej. UIIE-513-2026)",
  "razon_social": "string — campo 'RazonSocialEmpresa' o 'Razón Social' — nombre del propietario/cliente final de la instalación",
  "inspector": "string — nombre completo del inspector que realizó la visita",
  "ciudad": "string — ciudad o municipio de la instalación",
  "estado": "string — estado de la República Mexicana"
}

IMPORTANTE:
- folio_interno: busca exactamente el campo "NumeroActaInspeccion" — es el folio del expediente IISAC, formato UIIE-NNN-YYYY
- razon_social: es la empresa o persona dueña de la instalación solar (el cliente final), NO quien solicitó la verificación
- inspector: nombre del inspector que realizó la inspección física

Responde ÚNICAMENTE con el JSON válido, sin texto adicional ni markdown.`

/**
 * POST /api/cre/certificados/descargar-leer
 * Body: { uuid: string, tipo?: 'certificado' | 'acuse' }
 *
 * 1. Descarga el PDF desde la bóveda CRE usando el UUID
 * 2. Lo lee con IA (extrae folio_interno, razon_social, inspector, etc.)
 * 3. Busca el expediente por folio_interno para vincularlo automáticamente
 * 4. Guarda copia en Supabase Storage (bucket certificados-cne)
 * 5. Devuelve: { data, expediente_id, expediente_folio, url_storage }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const uuid  = body.uuid?.trim()
  const tipo  = body.tipo ?? 'certificado'

  if (!uuid) return NextResponse.json({ error: 'Falta el UUID' }, { status: 400 })
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
    return NextResponse.json({ error: 'El UUID no tiene el formato correcto' }, { status: 400 })
  }

  const bovedaUrl = `${CRE_BOVEDA}/${uuid}?nuevoNombre=${uuid}.pdf`

  // ── 1. Descargar PDF desde la bóveda ────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    const res = await fetch(bovedaUrl, { signal: AbortSignal.timeout(30_000) })
    if (!res.ok) throw new Error(`La bóveda CRE respondió con HTTP ${res.status}`)
    pdfBuffer = Buffer.from(await res.arrayBuffer())
    if (pdfBuffer.length < 100) throw new Error('El archivo descargado está vacío o no es un PDF válido')
  } catch (err: any) {
    return NextResponse.json(
      { error: `No se pudo descargar el PDF: ${err.message}` },
      { status: 502 },
    )
  }

  const base64 = pdfBuffer.toString('base64')
  const svc    = await createServiceClient()

  // ── 2. Guardar copia en Supabase Storage ─────────────────────────────────────
  const storagePath = `${tipo}/${uuid}.pdf`
  let url_storage: string | null = null

  try {
    await svc.storage.createBucket(BUCKET, { public: false }).catch(() => {})

    const { error: upErr } = await svc.storage
      .from(BUCKET)
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (!upErr) {
      // 7 días — la URL se regenera bajo demanda con el storage_path
      const { data: signed } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7)
      url_storage = signed?.signedUrl ?? null
    }
  } catch (err) {
    console.error('[descargar-leer] storage error:', err)
  }

  // ── 3. Leer con IA ────────────────────────────────────────────────────────────
  let aiData: Record<string, any> = {}
  let costoUSD = 0
  const MODELO = 'claude-opus-4-5'

  if (tipo === 'certificado') {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model:      MODELO,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any,
            { type: 'text', text: AI_PROMPT },
          ],
        }],
      })
      const content = message.content[0]
      if (content.type === 'text') {
        const raw = content.text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
        aiData = JSON.parse(raw)
      }
      // Registrar costo
      costoUSD = await registrarCostoIA({
        supabase:     svc,
        usuarioId:    user.id,
        expedienteId: null,    // Se asigna abajo si encontramos el expediente
        endpoint:     'cre/certificados/descargar-leer',
        modelo:       MODELO,
        usage:        message.usage,
      })
    } catch (err: any) {
      console.error('[descargar-leer] AI error:', err)
    }
  }

  // ── 4. Buscar expediente por folio_interno ────────────────────────────────────
  let expediente_id:    string | null = null
  let expediente_folio: string | null = null

  if (aiData.folio_interno) {
    const { data: exp } = await svc
      .from('expedientes')
      .select('id, numero_folio')
      .eq('numero_folio', aiData.folio_interno.trim())
      .maybeSingle()

    if (exp) {
      expediente_id    = exp.id
      expediente_folio = exp.numero_folio
    }
  }

  return NextResponse.json({
    success:          true,
    data:             aiData,
    uuid,
    url_boveda:       bovedaUrl,
    url_storage,
    expediente_id,
    expediente_folio,
    costo_usd: costoUSD,
  })
}
