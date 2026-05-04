import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'

const PROMPT_REVISION = `Eres un revisor experto de expedientes de inspección de sistemas fotovoltaicos para la CRE (Comisión Reguladora de Energía) en México.

Analiza los documentos de este expediente y genera un reporte de revisión estructurado.

Verifica los siguientes puntos:
1. COMPLETITUD: ¿Están presentes los documentos requeridos (contrato, plano, memoria técnica, acta de inspección, fotografías)?
2. CONSISTENCIA DE FECHAS: ¿Las fechas en los diferentes documentos son coherentes entre sí?
3. FIRMAS: ¿Los documentos clave (contrato, acta) tienen las firmas requeridas?
4. TESTIGOS E IDENTIFICACIONES: ¿Aparecen testigos en el acta? ¿Tienen identificaciones adjuntas?
5. DATOS TÉCNICOS: ¿Los valores de kWp, número de paneles, modelo de inversor son consistentes en todos los documentos?
6. NOMBRE DEL PROPIETARIO: ¿El nombre del cliente/propietario es consistente en todos los documentos?
7. DIRECCIÓN: ¿La dirección del proyecto es consistente?

Responde ÚNICAMENTE con este JSON válido:
{
  "resultado": "aprobado" | "con_observaciones" | "rechazado",
  "resumen": "párrafo breve explicando el resultado general",
  "documentos_encontrados": ["lista de tipos de documentos detectados"],
  "documentos_faltantes": ["lista de documentos que no se encontraron o no están completos"],
  "alertas": [
    {
      "nivel": "error" | "advertencia" | "info",
      "categoria": "fecha" | "firma" | "identificacion" | "dato_tecnico" | "completitud" | "coherencia",
      "descripcion": "descripción clara del problema o punto a verificar",
      "accion_requerida": "qué debe hacer el inspector para resolverlo"
    }
  ],
  "puntos_ok": ["lista de puntos que SÍ cumplen correctamente"],
  "recomendacion_final": "texto breve con instrucción directa para el equipo revisor"
}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  if (!esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { expediente_id } = await req.json()
  if (!expediente_id) return NextResponse.json({ error: 'expediente_id requerido' }, { status: 400 })

  let anthropic
  try { anthropic = getAnthropicClient() }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }

  const db = await createServiceClient()

  // Cargar expediente con datos del cliente
  const { data: exp } = await db
    .from('expedientes')
    .select('*, cliente:clientes(nombre), inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, potencia_kw)')
    .eq('id', expediente_id)
    .single()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  // Cargar todos los documentos
  const { data: docs } = await db
    .from('documentos_expediente')
    .select('*')
    .eq('expediente_id', expediente_id)
    .order('created_at', { ascending: true })

  if (!docs?.length) {
    return NextResponse.json({ error: 'No hay documentos en este expediente' }, { status: 400 })
  }

  // Contexto del expediente (sin documentos)
  const contexto = `
EXPEDIENTE: ${exp.numero_folio ?? exp.id}
Cliente/Propietario: ${(exp.cliente as any)?.nombre ?? exp.propietario_nombre ?? 'No especificado'}
Sistema: ${exp.kwp ?? '?'} kWp, ${exp.num_paneles ?? '?'} paneles
Inversor: ${(exp.inversor as any) ? `${(exp.inversor as any).marca} ${(exp.inversor as any).modelo}` : 'No especificado'}
Dirección: ${exp.direccion_proyecto ?? ''}, ${exp.ciudad ?? ''}, ${exp.estado_mx ?? ''}
Número de medidor: ${exp.numero_medidor ?? 'No capturado'}
Documentos en el expediente (${docs.length} total):
${docs.map((d: any, i: number) => `  ${i + 1}. [${d.tipo}] "${d.nombre}" — subido: ${new Date(d.created_at).toLocaleDateString('es-MX')}`).join('\n')}
`

  // Tomar los primeros 6 documentos que sean PDF o imagen para análisis profundo
  const docsAnalizables = docs
    .filter((d: any) => d.storage_path && (d.mime_type === 'application/pdf' || d.mime_type?.startsWith('image/')))
    .slice(0, 6)

  // Construir contenido para Claude
  const contentParts: any[] = []

  // Agregar contexto textual primero
  contentParts.push({
    type: 'text',
    text: `CONTEXTO DEL EXPEDIENTE:\n${contexto}\n\nA continuación se adjuntan los documentos para revisión:`,
  })

  // Descargar y adjuntar documentos
  let docsAdjuntados = 0
  for (const doc of docsAnalizables) {
    try {
      const { data: signed } = await db.storage
        .from('documentos')
        .createSignedUrl(doc.storage_path, 120)

      if (!signed?.signedUrl) continue

      const resp = await fetch(signed.signedUrl)
      if (!resp.ok) continue

      const buf = await resp.arrayBuffer()
      const base64 = Buffer.from(buf).toString('base64')

      contentParts.push({
        type: 'text',
        text: `\n--- DOCUMENTO ${docsAdjuntados + 1}: [${doc.tipo.toUpperCase()}] "${doc.nombre}" ---`,
      })

      if (doc.mime_type === 'application/pdf') {
        contentParts.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        })
      } else {
        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: doc.mime_type, data: base64 },
        })
      }
      docsAdjuntados++
    } catch (e) {
      console.warn(`[revision-ia] No se pudo adjuntar doc ${doc.id}:`, e)
    }
  }

  // Si hay análisis previos (analisis_ia) en docs no adjuntados, incluirlos como texto
  const docsConAnalisis = docs.filter(
    (d: any) => d.analisis_ia && !docsAnalizables.find((a: any) => a.id === d.id)
  )
  if (docsConAnalisis.length > 0) {
    contentParts.push({
      type: 'text',
      text: '\n--- ANÁLISIS PREVIOS DE OTROS DOCUMENTOS ---\n' +
        docsConAnalisis.map((d: any) =>
          `[${d.tipo}] "${d.nombre}":\n${JSON.stringify(d.analisis_ia, null, 2)}`
        ).join('\n\n'),
    })
  }

  contentParts.push({ type: 'text', text: `\n\n${PROMPT_REVISION}` })

  // Llamar a Claude
  let resultado: any = null
  let costoUSD = 0
  const MODELO = CLAUDE_MODELS.ANALISIS_DOC
  try {
    const msg = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 2048,
      messages: [{ role: 'user', content: contentParts }],
    })

    const raw = (msg.content[0] as any).text?.trim() ?? ''
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    resultado = JSON.parse(clean)

    // Registrar costo
    costoUSD = await registrarCostoIA({
      supabase:     db,
      usuarioId:    user.id,
      expedienteId: expediente_id,
      endpoint:     'expedientes/revision-ia',
      modelo:       MODELO,
      usage:        msg.usage,
      detalle:      { docs_analizados: docsAdjuntados },
    })
  } catch (e: any) {
    console.error('[revision-ia] Error:', e?.message)
    return NextResponse.json({ error: `Error en análisis IA: ${e?.message}` }, { status: 500 })
  }

  // Guardar en el envío más reciente (sin decisión aún)
  const { data: envioActivo } = await db
    .from('envios_revision')
    .select('id')
    .eq('expediente_id', expediente_id)
    .is('decision', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (envioActivo) {
    await db
      .from('envios_revision')
      .update({ revision_ia: resultado, revision_ia_en: new Date().toISOString() })
      .eq('id', envioActivo.id)
  }

  return NextResponse.json({ ok: true, resultado, docsAnalizados: docsAdjuntados, costo_usd: costoUSD })
}
