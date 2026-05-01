import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { registrarCostoIA } from '@/lib/ai/cost'

// ─── Prompt OCR Medidor / Resolutivo CFE ─────────────────────────────────────
const MEDIDOR_PROMPT = `Eres un sistema OCR especializado en documentos CFE (Comisión Federal de Electricidad) de México.

Analiza esta imagen o documento y extrae el número de medidor/servicio/cliente CFE.

Busca específicamente:
- "Número de Servicio" o "No. de Servicio" (típicamente 12 dígitos)
- "Número de Medidor" o "No. de Medidor" (alfanumérico en la placa del medidor)
- "RPU" (Registro de Punto de Uso)
- Cualquier número en la placa física del medidor

Responde ÚNICAMENTE con JSON válido:
{
  "numero_medidor": "el número encontrado o null si no se puede leer",
  "tipo": "servicio | medidor | rpu | placa | otro",
  "confianza": "alta | media | baja"
}

Sin texto adicional ni markdown.`

// ─── POST /api/ocr/medidor ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file         = formData.get('file') as File | null
  const expedienteId = formData.get('expediente_id') as string

  if (!file || !expedienteId) {
    return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 })
  }

  const isImage = file.type.startsWith('image/')
  const isPdf   = file.type === 'application/pdf'
  if (!isImage && !isPdf) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes o PDF.' }, { status: 400 })
  }

  // ── 1. Upload a Storage ────────────────────────────────────────────────────
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `ocr/medidor/${expedienteId}/medidor-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  await supabase.storage
    .from('documentos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })

  // ── 2. OCR con Claude ─────────────────────────────────────────────────────
  const base64 = buffer.toString('base64')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let resultado: { numero_medidor: string | null; tipo?: string; confianza?: string } = { numero_medidor: null }
  let costoUSD = 0
  const MODELO = 'claude-opus-4-5'

  try {
    const contentBlock = isImage
      ? { type: 'image' as const, source: { type: 'base64' as const, media_type: file.type as any, data: base64 } }
      : { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }

    const message = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [contentBlock as any, { type: 'text', text: MEDIDOR_PROMPT }],
      }],
    })
    const text = message.content[0]
    if (text.type === 'text') {
      resultado = JSON.parse(text.text.replace(/```json|```/g, '').trim())
    }

    // Registrar costo
    const dbAdmin = await createServiceClient()
    costoUSD = await registrarCostoIA({
      supabase:     dbAdmin,
      usuarioId:    user.id,
      expedienteId: expedienteId,
      endpoint:     'ocr/medidor',
      modelo:       MODELO,
      usage:        message.usage,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el número de medidor.' }, { status: 422 })
  }

  // ── 3. Guardar en expediente si el número fue encontrado ──────────────────
  if (resultado.numero_medidor) {
    await supabase
      .from('expedientes')
      .update({ numero_medidor: resultado.numero_medidor })
      .eq('id', expedienteId)
  }

  return NextResponse.json({ ...resultado, costo_usd: costoUSD })
}
