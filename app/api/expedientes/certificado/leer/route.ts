import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'

const AI_PROMPT = `Eres un extractor de datos de certificados de la CNE (Comisión Nacional de Energía) de México.
Analiza este PDF de certificado de cumplimiento de interconexión y extrae los siguientes datos en JSON:

{
  "numero_certificado": "string — número de certificado, formato UIIE-CC-NNNNN-YYYY (ej. UIIE-CC-02311-2026)",
  "fecha_emision": "string — fecha en formato YYYY-MM-DD (ej. 2026-01-09)",
  "folio_interno": "string — campo 'NumeroActaInspeccion' o 'Número Acta de Inspección', formato UIIE-NNN-YYYY (ej. UIIE-513-2026)",
  "razon_social": "string — campo 'RazonSocialEmpresa' o 'Razón Social' — nombre del propietario/cliente final de la instalación",
  "inspector": "string — nombre completo del inspector que realizó la visita",
  "ciudad": "string — ciudad o municipio de la instalación",
  "estado": "string — estado de la República Mexicana",
  "url_verificacion": "string | null — URL de verificación si aparece en el documento (cne.gob.mx o api.cne.gob.mx)"
}

IMPORTANTE:
- folio_interno: busca exactamente el campo "NumeroActaInspeccion" — es el folio del expediente IISAC, formato UIIE-NNN-YYYY
- razon_social: es la empresa o persona dueña de la instalación solar (el cliente final), NO quien solicitó la verificación
- inspector: nombre del inspector que realizó la inspección física

Responde ÚNICAMENTE con el JSON válido, sin texto adicional ni markdown.`

/**
 * POST /api/expedientes/certificado/leer
 * Multipart: { file: PDF del certificado CNE }
 * Devuelve: datos extraídos por IA + expediente_id si se encontró por folio_interno
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!u || !rolesPermitidos.includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Falta el archivo PDF' }, { status: 400 })
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'El archivo debe ser un PDF' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64      = Buffer.from(arrayBuffer).toString('base64')

  let anthropic
  try { anthropic = getAnthropicClient() }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }

  const MODELO = CLAUDE_MODELS.CERTIFICADOS
  try {
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
    if (content.type !== 'text') throw new Error('Respuesta inesperada de la IA')

    const raw  = content.text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const data = JSON.parse(raw)

    // Buscar expediente por folio_interno
    let expediente_id:    string | null = null
    let expediente_folio: string | null = null
    const svc = await createServiceClient()

    if (data.folio_interno) {
      const { data: exp } = await svc
        .from('expedientes')
        .select('id, numero_folio')
        .eq('numero_folio', data.folio_interno.trim())
        .maybeSingle()

      if (exp) {
        expediente_id    = exp.id
        expediente_folio = exp.numero_folio
      }
    }

    // Registrar costo (asociado al expediente si lo encontramos)
    const costoUSD = await registrarCostoIA({
      supabase:     svc,
      usuarioId:    user.id,
      expedienteId: expediente_id,
      endpoint:     'expedientes/certificado/leer',
      modelo:       MODELO,
      usage:        message.usage,
    })

    return NextResponse.json({ success: true, data, expediente_id, expediente_folio, costo_usd: costoUSD })
  } catch (err: any) {
    console.error('[certificado/leer]', err)
    return NextResponse.json({ error: err.message ?? 'Error al analizar el PDF' }, { status: 500 })
  }
}
