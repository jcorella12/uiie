import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// ─── Prompt para imágenes (un solo lado) ──────────────────────────────────────
const PROMPT_IMAGEN = `Eres un sistema OCR especializado en Credenciales para Votar (INE/IFE) mexicanas.
Analiza esta imagen y extrae los datos en formato JSON exacto:

{
  "nombre": "nombre completo tal como aparece en el campo NOMBRE del frente, o null",
  "curp": "CURP de 18 caracteres en mayúsculas del campo CURP, o null",
  "clave_elector": "clave de elector alfanumérica del campo CLAVE DE ELECTOR, o null",
  "vigencia": "año de vigencia (4 dígitos) del campo VIGENCIA, o null",
  "domicilio_calle": "solo calle y número del campo DOMICILIO (ej: 'AV DE ANZA 900'), o null",
  "domicilio_colonia": "solo nombre de colonia/fraccionamiento del campo DOMICILIO sin el prefijo COL/FRACC (ej: 'PITIC'), o null",
  "domicilio_cp": "código postal de 5 dígitos del campo DOMICILIO, o null",
  "domicilio_municipio": "municipio o ciudad del campo DOMICILIO (ej: 'HERMOSILLO'), o null",
  "domicilio_estado": "estado completo sin abreviatura del campo DOMICILIO (ej: 'SONORA'), o null",
  "numero_ine": "número de ~12 dígitos del MRZ en el REVERSO: primera línea del MRZ al fondo, después de '<<' (ej: '043907064679'), o null",
  "lado": "frente o reverso según lo que ves en la imagen"
}

NOTAS:
- El campo DOMICILIO en el FRENTE contiene todo en 2-3 líneas. Separa sus componentes: calle+número / colonia / CP+municipio / estado.
- El código postal en la INE aparece junto a la colonia (ej: 'COL PITIC 83150').
- El número INE está en el REVERSO en la primera línea del MRZ (3 líneas al fondo): patrón IDMEX...<< seguido del número.
- Si el lado mostrado no tiene un campo, devuelve null.

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.`

// ─── Prompt para PDFs (puede tener ambas caras) ───────────────────────────────
const PROMPT_PDF = `Eres un sistema OCR especializado en Credenciales para Votar (INE/IFE) mexicanas.
Este PDF puede contener una o dos imágenes de la credencial (frente y/o reverso).
Analiza TODAS las páginas y extrae todos los datos disponibles.

ESTRUCTURA:
- FRENTE: NOMBRE, DOMICILIO (calle+número / colonia / CP / municipio / estado), CLAVE DE ELECTOR, CURP, VIGENCIA.
  El campo DOMICILIO suele tener 2-3 líneas: "CALLE NUMERO / COL COLONIA CP / MUNICIPIO, SON."
- REVERSO: códigos de barras, firma, huella y al fondo 3 líneas MRZ.
  Primera línea del MRZ: IDMEX[doc_num]<<[numero_ine]. El número INE son los ~12 dígitos después de '<<'.

Responde ÚNICAMENTE con este JSON exacto, sin texto adicional ni markdown:

{
  "lado": "frente" | "reverso" | "ambas",
  "frente": {
    "nombre": "nombre completo o null",
    "curp": "CURP de 18 caracteres o null",
    "clave_elector": "clave alfanumérica o null",
    "vigencia": "año (4 dígitos) o null",
    "domicilio_calle": "calle y número (ej: 'AV DE ANZA 900') o null",
    "domicilio_colonia": "colonia sin prefijo COL/FRACC (ej: 'PITIC') o null",
    "domicilio_cp": "código postal 5 dígitos (ej: '83150') o null",
    "domicilio_municipio": "municipio/ciudad (ej: 'HERMOSILLO') o null",
    "domicilio_estado": "estado completo (ej: 'SONORA') o null"
  },
  "reverso": {
    "numero_ine": "~12 dígitos después de '<<' en línea 1 del MRZ (ej: '043907064679') o null",
    "vigencia": "año (4 dígitos) si aparece en reverso o null"
  }
}

Si solo hay un lado, llena ese lado y deja el otro con nulls.
Usa "ambas" si detectas las dos caras.`

// ─── POST /api/ocr/ine ────────────────────────────────────────────────────────
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

  const file       = formData.get('file') as File | null
  const entityType = (formData.get('entity_type') as string) || null
  const entityId   = (formData.get('entity_id') as string) || null
  const ladoInput  = (formData.get('lado') as string) || null   // puede ser null para PDFs

  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 })
  }

  const isPDF = file.type === 'application/pdf'
  const isImg = file.type.startsWith('image/')

  if (!isPDF && !isImg) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.' }, { status: 400 })
  }

  // Para imágenes se requiere el lado; para PDFs se auto-detecta
  if (isImg && !ladoInput) {
    return NextResponse.json({ error: 'Parámetro lado requerido para imágenes.' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)
  const base64      = buffer.toString('base64')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // ── OCR con Claude ───────────────────────────────────────────────────────────
  let ladoDetectado: string = ladoInput ?? 'frente'
  let ocrMerged: Record<string, string | null> = {}
  let ocrFrente: Record<string, string | null> | null = null
  let ocrReverso: Record<string, string | null> | null = null

  try {
    if (isPDF) {
      // ── PDF: enviar como documento, Claude auto-detecta caras ───────────────
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            { type: 'text', text: PROMPT_PDF },
          ],
        }],
      })
      const text = message.content[0]
      if (text.type === 'text') {
        const parsed = JSON.parse(text.text.replace(/```json|```/g, '').trim())
        ladoDetectado = parsed.lado ?? 'frente'

        if (parsed.frente) ocrFrente = parsed.frente
        if (parsed.reverso) ocrReverso = parsed.reverso

        // Merge: frente → nombre/curp/clave/domicilio separado, reverso → numero_ine
        ocrMerged = {
          nombre:              parsed.frente?.nombre              ?? null,
          curp:                parsed.frente?.curp                ?? null,
          clave_elector:       parsed.frente?.clave_elector       ?? null,
          vigencia:            parsed.frente?.vigencia ?? parsed.reverso?.vigencia ?? null,
          domicilio_calle:     parsed.frente?.domicilio_calle     ?? null,
          domicilio_colonia:   parsed.frente?.domicilio_colonia   ?? null,
          domicilio_cp:        parsed.frente?.domicilio_cp        ?? null,
          domicilio_municipio: parsed.frente?.domicilio_municipio ?? null,
          domicilio_estado:    parsed.frente?.domicilio_estado    ?? null,
          numero_ine:          parsed.reverso?.numero_ine         ?? null,
        }
      }
    } else {
      // ── Imagen: flujo original ─────────────────────────────────────────────
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: file.type as any, data: base64 },
            },
            { type: 'text', text: PROMPT_IMAGEN },
          ],
        }],
      })
      const text = message.content[0]
      if (text.type === 'text') {
        const parsed = JSON.parse(text.text.replace(/```json|```/g, '').trim())
        ladoDetectado = parsed.lado ?? ladoInput ?? 'frente'
        ocrMerged = {
          nombre:              parsed.nombre              ?? null,
          curp:                parsed.curp                ?? null,
          clave_elector:       parsed.clave_elector       ?? null,
          vigencia:            parsed.vigencia            ?? null,
          domicilio_calle:     parsed.domicilio_calle     ?? null,
          domicilio_colonia:   parsed.domicilio_colonia   ?? null,
          domicilio_cp:        parsed.domicilio_cp        ?? null,
          domicilio_municipio: parsed.domicilio_municipio ?? null,
          domicilio_estado:    parsed.domicilio_estado    ?? null,
          numero_ine:          parsed.numero_ine          ?? null,
        }
      }
    }
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar el archivo con IA. Intenta con mejor calidad.' }, { status: 422 })
  }

  // ── Upload a Storage (solo si hay entityId) ──────────────────────────────────
  let storagePaths: { frente?: string; reverso?: string } = {}

  if (entityId && entityType) {
    const ext = isPDF ? 'pdf' : (file.name.split('.').pop()?.toLowerCase() ?? 'jpg')

    if (ladoDetectado === 'ambas' && isPDF) {
      // Un PDF con ambas caras — guardamos una copia y referenciamos para frente y reverso
      const path = `ocr/${entityType}/${entityId}/ine-completo-${Date.now()}.pdf`
      await supabase.storage
        .from('documentos')
        .upload(path, buffer, { contentType: file.type, upsert: true })
      storagePaths = { frente: path, reverso: path }
    } else {
      const lado = ladoDetectado === 'reverso' ? 'reverso' : 'frente'
      const path = `ocr/${entityType}/${entityId}/${lado}-${Date.now()}.${ext}`
      await supabase.storage
        .from('documentos')
        .upload(path, buffer, { contentType: file.type, upsert: true })
      storagePaths = { [lado]: path }
    }

    // ── Guardar en DB ────────────────────────────────────────────────────────
    const table = entityType === 'cliente' ? 'clientes' : 'testigos'
    const updates: Record<string, string | null> = {}

    if (storagePaths.frente) updates.ine_url_frente = storagePaths.frente
    if (storagePaths.reverso) updates.ine_url_reverso = storagePaths.reverso
    if (ocrMerged.nombre)       updates.ocr_nombre        = ocrMerged.nombre
    if (ocrMerged.curp)         updates.ocr_curp          = ocrMerged.curp
    if (ocrMerged.clave_elector) updates.ocr_clave_elector = ocrMerged.clave_elector
    if (ocrMerged.vigencia)     updates.ocr_vigencia      = ocrMerged.vigencia
    if (ocrMerged.numero_ine)   updates.ocr_numero_ine    = ocrMerged.numero_ine
    // Guardar domicilio combinado
    const domParts = [
      ocrMerged.domicilio_calle,
      ocrMerged.domicilio_colonia ? `COL ${ocrMerged.domicilio_colonia}` : null,
      ocrMerged.domicilio_cp,
      ocrMerged.domicilio_municipio,
      ocrMerged.domicilio_estado,
    ].filter(Boolean)
    if (domParts.length) updates.ocr_domicilio = domParts.join(', ')

    const { error: updateError } = await supabase
      .from(table)
      .update(updates)
      .eq('id', entityId)

    if (updateError) {
      return NextResponse.json({ error: `OCR exitoso pero no se pudo guardar: ${updateError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({
    ocr: ocrMerged,
    ocr_frente: ocrFrente,
    ocr_reverso: ocrReverso,
    lado: ladoDetectado,
    storagePaths,
  })
}
