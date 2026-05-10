import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'
import { SKILL_UIIE_PROMPT } from '@/lib/ai/skill-uiie'

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

  // Cargar expediente con datos del cliente + inspector
  const { data: exp } = await db
    .from('expedientes')
    .select(`
      *,
      cliente:clientes(nombre, rfc, ciudad, estado),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, potencia_kw),
      inspector:usuarios!inspector_id(nombre, apellidos),
      inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)
    `)
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
  const inspectorPrincipal = (exp.inspector as any)
  const inspectorEjecutor  = (exp.inspector_ejecutor as any)
  const inspectorNombre    = inspectorPrincipal
    ? `${inspectorPrincipal.nombre} ${inspectorPrincipal.apellidos ?? ''}`.trim()
    : 'No especificado'
  const ejecutorNombre     = inspectorEjecutor
    ? `${inspectorEjecutor.nombre} ${inspectorEjecutor.apellidos ?? ''}`.trim()
    : null

  const contexto = `
EXPEDIENTE: ${exp.numero_folio ?? exp.id}
Cliente / Razón social: ${(exp.cliente as any)?.nombre ?? exp.propietario_nombre ?? exp.nombre_cliente_final ?? 'No especificado'}
RFC: ${(exp.cliente as any)?.rfc ?? '—'}
Sistema: ${exp.kwp ?? '?'} kWp, ${exp.num_paneles ?? '?'} paneles
Inversor: ${(exp.inversor as any) ? `${(exp.inversor as any).marca} ${(exp.inversor as any).modelo}` : 'No especificado'}
Dirección del proyecto: ${exp.direccion_proyecto ?? ''}, ${exp.colonia ?? ''}, CP ${exp.codigo_postal ?? ''}, ${exp.municipio ?? exp.ciudad ?? ''}, ${exp.estado_mx ?? ''}
Número de medidor: ${exp.numero_medidor ?? 'No capturado'}
Inspector responsable del expediente: ${inspectorNombre}
${ejecutorNombre ? `Inspector que ejecutó la visita (delegado): ${ejecutorNombre}` : ''}
Fecha programada de inspección: ${exp.fecha_inicio ?? 'No especificada'}
Status actual: ${exp.status}

NOTA — el Inspector Responsable de la UVIE es Joaquín Corella Puente. Si el inspector ejecutor NO es Joaquín, debe firmar con "p.a." (por ausencia) en la cotización y en el campo del Inspector Responsable del Acta página 2.

Documentos subidos al expediente (${docs.length} total):
${docs.map((d: any, i: number) => `  ${i + 1}. [${d.tipo}] "${d.nombre}" — subido: ${new Date(d.created_at).toLocaleDateString('es-MX')}`).join('\n')}
`

  // Tomar hasta 12 documentos PDF/imagen para análisis profundo (antes 6).
  // Priorizamos los tipos clave del SKILL: OR, Dictamen, Acta, DACG,
  // Cotización, Plan, Recibo CFE, Comprobante, Foto medidor, Evidencia.
  const PRIORIDAD_DOCS: Record<string, number> = {
    resolutivo: 1, dictamen: 2, acta: 3, lista_verificacion: 4,
    paquete_actas_listas: 4,
    cotizacion: 5, plan_inspeccion: 6, recibo_cfe: 7,
    comprobante_pago: 8, ficha_pago: 8, foto_medidor: 9,
    evidencia_visita: 10, contrato: 11, plano: 12, memoria_tecnica: 13,
  }
  const docsAnalizables = docs
    .filter((d: any) => d.storage_path && (d.mime_type === 'application/pdf' || d.mime_type?.startsWith('image/')))
    .sort((a: any, b: any) => (PRIORIDAD_DOCS[a.tipo] ?? 99) - (PRIORIDAD_DOCS[b.tipo] ?? 99))
    .slice(0, 12)

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

  // Instrucción final + reminder del SKILL
  contentParts.push({
    type: 'text',
    text: '\n\nAhora aplica el SKILL definido al inicio del system prompt y responde solo con el JSON especificado.',
  })

  // Llamar a Claude — el SKILL completo va en system prompt para
  // que el modelo lo tenga como rol fijo durante todo el análisis.
  let resultado: any = null
  let costoUSD = 0
  const MODELO = CLAUDE_MODELS.ANALISIS_DOC
  try {
    const msg = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 4096,                 // antes 2048 — output puede ser grande con muchos hallazgos
      system: SKILL_UIIE_PROMPT,        // el SKILL como system prompt
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
