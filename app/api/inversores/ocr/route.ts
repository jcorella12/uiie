import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'

const PROMPT = `Eres un sistema de extracción de datos técnicos para inversores fotovoltaicos (solares).
Analiza este documento (puede ser una ficha técnica o un certificado de UL/Intertek/TÜV/etc.) y extrae los datos.

IMPORTANTE: Si el documento cubre MÚLTIPLES modelos con distintas potencias, devuelve un ARRAY con un objeto por modelo.
Si solo hay un modelo, devuelve un objeto simple (no array).

Formato de cada objeto:
{
  "marca": "nombre del fabricante / marca (ej: SMA, Fronius, Huawei, Growatt)",
  "modelo": "identificador del modelo exacto (ej: MIN 5000TL-X)",
  "potencia_kw": number (potencia nominal de salida en kW — si el nombre del modelo tiene el número, úsalo: MIN 5000TL-X = 5.0),
  "fase": "monofasico" | "trifasico" | "bifasico",
  "tipo": "string" | "microinversor" | "hibrido",
  "certificacion": "ul1741" | "ieee1547" | "homologado_cne" | "ninguna",
  "eficiencia": number | null,
  "tension_ac": number | null,
  "corriente_max": number | null,
  "tipo_doc": "ficha_tecnica" | "certificado"
}

Reglas:
- Si no puedes determinar un campo numérico con certeza, usa null.
- Para potencia_kw: extráela del nombre del modelo si no aparece explícita (2500 → 2.5, 5000 → 5.0, 6000 → 6.0).
- Para "fase": monofasico si es 1-fase/1-phase/TL (string/single), trifasico si es 3-fase/3-phase/TL3.
- Para "tipo": string si es inversor string normal, microinversor, hibrido si tiene batería.
- Para "certificacion": ul1741 si ves UL 1741, ieee1547 si ves IEEE 1547, ninguna si no aparece. Para Huawei usa "homologado_cne" (oficio CNE F00.06.UE/225/2026 los homologa a UL 1741 en México).
- Para "tipo_doc": certificado si es Authorization to Mark / UL listing / certificación. ficha_tecnica si es datasheet.

Responde ÚNICAMENTE con el JSON válido (objeto o array), sin texto adicional ni markdown.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Datos de formulario inválidos' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const isPDF = file.type === 'application/pdf'
  const isImg = file.type.startsWith('image/')
  if (!isPDF && !isImg) {
    return NextResponse.json({ error: 'Solo se aceptan PDF o imágenes' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  let anthropic
  try { anthropic = getAnthropicClient() }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }

  let rawExtracted: Record<string, unknown> | Record<string, unknown>[] = {}
  let costoUSD = 0
  const MODELO = CLAUDE_MODELS.OCR
  try {
    const content: any[] = []

    if (isPDF) {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      })
    } else {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: file.type, data: base64 },
      })
    }
    content.push({ type: 'text', text: PROMPT })

    const msg = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    })

    const raw   = (msg.content[0] as any).text?.trim() ?? ''
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    try {
      rawExtracted = JSON.parse(clean)
    } catch {
      console.error('[inversor-ocr] JSON parse failed. Raw response:', raw)
      return NextResponse.json({
        error: `La IA no devolvió JSON válido. Respuesta: ${raw.slice(0, 200)}`,
      }, { status: 500 })
    }

    // Registrar costo
    const dbAdmin = await createServiceClient()
    costoUSD = await registrarCostoIA({
      supabase:     dbAdmin,
      usuarioId:    user.id,
      expedienteId: null,           // OCR de inversor es de catálogo, no de expediente
      endpoint:     'inversores/ocr',
      modelo:       MODELO,
      usage:        msg.usage,
    })

  } catch (e: any) {
    const msg = e?.message ?? String(e)
    console.error('[inversor-ocr] Error:', msg)
    return NextResponse.json({
      error: `Error al analizar: ${msg}`,
    }, { status: 500 })
  }

  // Normalize to array
  const extractedList: Record<string, unknown>[] = Array.isArray(rawExtracted)
    ? rawExtracted
    : [rawExtracted]

  // Override automático: si el inversor es de una marca con homologación CNE
  // vigente (ej. Huawei), forzamos certificacion='homologado_cne' aunque la
  // ficha técnica diga UL/IEEE — el documento oficial CNE manda.
  const dbCheck = await createServiceClient()
  const { data: marcasHomologadas } = await dbCheck
    .from('inversor_homologaciones')
    .select('marca')
    .eq('vigente', true)
  const marcasSet = new Set(
    (marcasHomologadas ?? []).map(m => String(m.marca).toLowerCase().trim())
  )
  for (const ext of extractedList) {
    const marca = String(ext.marca ?? '').toLowerCase().trim()
    if (marcasSet.has(marca)) {
      ext.certificacion = 'homologado_cne'
    }
  }

  // Check for existing inversores for each model
  const db = await createServiceClient()

  const results = await Promise.all(extractedList.map(async (extracted) => {
    let existingMatch: { id: string; marca: string; modelo: string } | null = null
    if (extracted.marca && extracted.modelo) {
      const { data: matches } = await db
        .from('inversores')
        .select('id, marca, modelo')
        .ilike('marca',  String(extracted.marca).trim())
        .ilike('modelo', String(extracted.modelo).trim())
        .limit(1)
      if (matches?.length) existingMatch = matches[0]
    }
    return { extracted, existingMatch }
  }))

  // Single model → return legacy shape for backwards compat
  if (results.length === 1) {
    return NextResponse.json({
      extracted:     results[0].extracted,
      existingMatch: results[0].existingMatch,
      fileName:      file.name,
      costo_usd:     costoUSD,
    })
  }

  // Multiple models → return array
  return NextResponse.json({
    multiple:  true,
    models:    results,
    fileName:  file.name,
    costo_usd: costoUSD,
  })
}
