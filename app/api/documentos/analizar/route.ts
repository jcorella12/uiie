import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  const db = esAdmin ? await createServiceClient() : supabase

  const { documento_id } = await req.json()

  // Fetch document record — admin can access any expediente's documents
  const { data: doc } = await db
    .from('documentos_expediente')
    .select('*, expediente:expedientes(inspector_id)')
    .eq('id', documento_id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  // Non-admin can only analyze their own expedientes' documents
  if (!esAdmin && doc.expediente?.inspector_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Get signed URL for the file from Supabase Storage
  const { data: signedUrlData } = await db.storage
    .from('documentos')
    .createSignedUrl(doc.storage_path, 60)

  if (!signedUrlData?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo acceder al archivo' }, { status: 500 })
  }

  // Fetch the file content
  const fileResponse = await fetch(signedUrlData.signedUrl)
  const fileBuffer = await fileResponse.arrayBuffer()
  const base64 = Buffer.from(fileBuffer).toString('base64')

  // Call Anthropic API
  let anthropic
  try { anthropic = getAnthropicClient() }
  catch (e: any) {
    return NextResponse.json(
      { error: `${e.message}. Verifica .env.local y reinicia el servidor.` },
      { status: 500 }
    )
  }

  // ── Prompts específicos por tipo de documento ────────────────
  let prompt: string

  // Mapeo: tipos subidos por cliente → tipo canónico para el prompt
  const tipoIA = (
    { oficio_resolutivo: 'resolutivo', diagrama: 'plano', memoria_calculo: 'memoria_tecnica', dictamen_uvie: 'dictamen' } as Record<string, string>
  )[doc.tipo] ?? doc.tipo

  if (tipoIA === 'resolutivo') {
    prompt = `Eres un experto en normatividad de interconexión de sistemas fotovoltaicos en México.
Analiza este "Oficio Resolutivo" de CFE para un sistema de generación distribuida/fotovoltaico.

PASO 1 — Extrae estos datos del encabezado:
- División CFE (ej: NOROESTE, NORTE, GOLFO, etc.)
- Zona CFE / Ciudad (ej: ZONA OBREGON, ZONA HERMOSILLO, etc.)
- Fecha del oficio

PASO 2 — Busca el número o folio explícito del oficio:
- Puede aparecer como "No. de Oficio:", "Folio:", "Referencia:", o en el membrete superior
- Si NO existe ningún número de oficio explícito en el documento, genera uno con este formato:
  OR-{ABREV_CIUDAD}-{YYYYMMDD}
  donde ABREV_CIUDAD es la abreviatura de 2-3 letras de la ciudad de la zona:
  OBREGON→OB, HERMOSILLO→HMO, CULIACAN→CUL, MAZATLAN→MAZ, NAVOJOA→NAV,
  GUAYMAS→GYM, LOS MOCHIS→MOC, TIJUANA→TIJ, MEXICALI→MXL, NOGALES→NOG,
  CHIHUAHUA→CHH, JUAREZ→JUA, TORREON→TRC, MONTERREY→MTY, GUADALAJARA→GDL,
  CIUDAD DE MEXICO→CDMX, PUEBLA→PUE, VERACRUZ→VER, MERIDA→MID
  Si la ciudad no está en la lista, usa las primeras 2-3 letras del nombre.
  Ejemplo: zona OBREGON + fecha 31/03/2026 → folio generado: OR-OB-20260331
- En "folio_generado" indica true si lo generaste tú, false si venía en el documento.

PASO 3 — Extrae el resto de campos técnicos.

Responde ÚNICAMENTE con este JSON válido, sin texto adicional:

{
  "folio": "número de oficio encontrado en el documento O folio generado OR-XX-YYYYMMDD",
  "folio_generado": true | false,
  "zona_cfe": "zona/ciudad CFE tal como aparece (ej: 'ZONA OBREGON', 'ZONA HERMOSILLO')",
  "division_cfe": "división CFE (ej: 'NOROESTE', 'NORTE', 'GOLFO')",
  "fecha": "fecha de emisión en formato YYYY-MM-DD o null",
  "kwp": potencia aprobada en kWp como número decimal o null,
  "tiene_cobro": true si hay cobro de derechos/infraestructura, false si no hay cobro mencionado,
  "monto": monto en pesos MXN como número si tiene_cobro es true, null si no,
  "referencia": "número de referencia o clave de pago o null",
  "nombre_cliente_final": "nombre completo o razón social del solicitante/beneficiario que aparece en el oficio (la persona o empresa a quien se le otorga el permiso de interconexión), o null",
  "resumen": "descripción breve en 1-2 oraciones"
}`
  } else if (tipoIA === 'dictamen') {
    prompt = `Eres un experto en verificación de instalaciones eléctricas en México.
Analiza este "Dictamen de Verificación de Instalaciones Eléctricas" (UVIE / SEDIVER).

INSTRUCCIONES PARA ENCONTRAR EL FOLIO:
- Busca en el encabezado del documento el campo etiquetado exactamente como:
  "Dictamen de Verificación Folio No.:" o "DVNP"
- El formato típico es: DVNP[alfanumérico]-[año]-UVISE [número]-[letra]/[secuencia]
  Ejemplo real: DVNP12S2-2025-UVISE 644-A/000097
- ATENCIÓN: el folio puede contener letras mayúsculas mezcladas con números.
  Por ejemplo "S" puede parecer "9", "B" puede parecer "8", "O" puede parecer "0".
  Lee cada carácter con cuidado antes de decidir si es letra o número.
- Si no encuentras ese campo, busca "No. Folio del CIME" al pie del documento.
- Copia el folio EXACTAMENTE como aparece en el documento, incluyendo guiones, barras y letras.

INSTRUCCIONES PARA LA UVISE:
- El número de UVISE aparece generalmente en el campo "UVISE:" o "Número de UVISE:" o en el folio mismo (ej: "UVISE 644-A").
- El nombre del titular o unidad aparece en el bloque de firma ("EL TITULAR O GERENTE DE LA UNIDAD DE VERIFICACIÓN").

INSTRUCCIONES PARA EL NOMBRE DEL CLIENTE FINAL (MUY IMPORTANTE):
- El dictamen tiene DOS partes con nombres distintos — debes distinguirlas:
  1. "Solicitante de la verificación": quien CONTRATÓ la verificación (puede ser CIAE, una empresa EPC o instaladora). NO es el cliente final.
  2. "Nombre, Denominación o Razón Social" del propietario/usuario de la instalación: esta es la persona o empresa DUEÑA de la instalación donde se hizo la inspección. ESTE es el cliente final.
- Busca el campo etiquetado exactamente como "Nombre, Denominación o Razón Social" en la sección de datos de la instalación o datos del propietario.
- Si ves dos nombres, toma SIEMPRE el que corresponde al propietario/usuario de la instalación, NO al solicitante del servicio.
- Ejemplos de cliente final correcto: "Walmart de México S.A.P.I. de C.V.", "7-Eleven de México S.A. de C.V.", "José Carlos Serrato Castell", "COPPEL S.A. de C.V."
- Ejemplos de lo que NO debes tomar: "CIAE", "Centro de Inspección y Acreditación Eléctrica", nombres de UVISEs o empresas verificadoras.

INSTRUCCIONES PARA LA DIRECCIÓN DEL PROYECTO:
- El dictamen contiene la dirección de la instalación inspeccionada. Búscala en el cuerpo del documento.
- Puede aparecer como "Domicilio:", "Dirección:", "Ubicación:", o en la sección de datos del propietario/instalación.
- Extrae la dirección desglosada en sus partes: calle y número, colonia, municipio, ciudad, código postal y estado.

INSTRUCCIONES PARA LA SECCIÓN "NOTAS" (datos técnicos del sistema, MUY IMPORTANTE):
- Casi todos los dictámenes tienen un párrafo "NOTAS:" donde se describe explícitamente el sistema solar.
- Ejemplo real: "NOTAS: El alcance de la inspección es correspondiente a la instalación del sistema solar fotovoltaico, con capacidad máxima en AC de 400kW y capacidad DC de 519.2kW con No de servicio suministrador 562190302308. Incluye 4 Inversores SOLAR EDGE SE100KUS y 880 módulos fotovoltaicos Marca Canadian Solar, modelo CS6W-590T 590W. La Subestación está fuera del alcance de la verificación."
- De ese texto extrae: cantidad de inversores ("4"), marca y modelo del inversor ("SOLAR EDGE SE100KUS"), número de paneles ("880"), marca del panel ("Canadian Solar"), modelo del panel ("CS6W-590T"), potencia por panel en Wp ("590"), potencia AC y DC en kW.
- También puedes encontrar "Capacidad de la Subestación" en kVA en otra sección — extráela también.

INSTRUCCIONES PARA EL CAMPO "CAPACIDAD DE LA SUBESTACIÓN":
- En la sección "DATOS DE ALMACENAMIENTO" o similar aparece "Capacidad de la Subestación: XXX (kVA)".
- Este es el dato definitivo de la capacidad del transformador del sitio.

Extrae la siguiente información en formato JSON:

{
  "folio_dvnp": "folio completo copiado exactamente (ej: DVNP1292-2025-UVISE 644-A/000097) o null",
  "nombre_uvie": "nombre o número de la UVISE que emite el dictamen (ej: UVISE 644-A, o nombre completo) o null",
  "fecha_emision": "fecha de emisión en formato YYYY-MM-DD o null",
  "fecha_vigencia": "fecha de vencimiento/vigencia en formato YYYY-MM-DD o null",
  "resultado": "aprobado" si NOM-001-SEDE-2012 aplica con SI, "condicionado" si hay observaciones, "rechazado" si no cumple, o null,
  "observaciones": ["condicionantes u observaciones importantes que aparezcan, lista vacía si no hay"],
  "nombre_cliente_final": "valor del campo 'Nombre, Denominación o Razón Social' correspondiente al PROPIETARIO o USUARIO de la instalación inspeccionada (NO el solicitante del servicio de verificación), o null",
  "direccion_proyecto": "calle y número de la instalación o null",
  "colonia": "colonia de la instalación o null",
  "municipio": "municipio de la instalación o null",
  "ciudad": "ciudad de la instalación o null",
  "codigo_postal": "código postal (5 dígitos) o null",
  "estado_mx": "nombre del estado (ej: Sonora, Sinaloa) o null",
  "kwp": potencia DC del sistema en kWp leída de la sección NOTAS (ej. 519.2) o null,
  "potencia_ac_kw": potencia AC máxima del sistema en kW (ej. 400) o null,
  "num_inversores": cantidad de inversores como entero leída de NOTAS (ej. 4) o null,
  "marca_inversor": "marca y modelo del inversor copiado de NOTAS (ej. 'SolarEdge SE100KUS') o null",
  "num_paneles": número total de paneles fotovoltaicos como entero (ej. 880) o null,
  "marca_panel": "marca del panel/módulo (ej. 'Canadian Solar') o null",
  "modelo_panel": "modelo del panel/módulo (ej. 'CS6W-590T') o null",
  "potencia_panel_wp": potencia por panel en Wp (ej. 590) o null,
  "capacidad_subestacion_kva": capacidad del transformador del sitio en kVA o null,
  "resumen": "descripción breve del dictamen en 1-2 oraciones"
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin bloques de código markdown.`
  } else if (tipoIA === 'plano') {
    prompt = `Eres un experto en diseño de sistemas fotovoltaicos en México.
Analiza este diagrama unifilar / plano eléctrico de instalación fotovoltaica.

Extrae los datos técnicos del sistema. Busca en el diagrama los valores de:
- Potencia total del sistema en kWp (busca "kWp", "kW pico", o suma de potencias de strings)
- Número de módulos / paneles fotovoltaicos (busca "módulos", "paneles", conteo visual)
- Potencia por panel en Wp (busca "Wp", "W", valor unitario de cada panel)
- Marca y modelo del inversor (en el símbolo del inversor o en la leyenda)
- Número de inversores instalados
- Tipo de conexión a la red: busca indicadores de "generación distribuida", "net metering", "autoconsumo", "sistema aislado", o si hay flecha hacia red CFE
- Tipo de central: si hay transformador de MT/AT marca "MT", si va directo a BT marca "BT"
- Número de medidor CFE (si aparece en el diagrama)
- Tensión del sistema en VDC (lado corriente directa)

SUBESTACIÓN ELÉCTRICA (si aplica):
- Capacidad del transformador en kVA (busca "kVA", "KVA", número en el símbolo del transformador)

PROTECCIONES ELÉCTRICAS (responde true si el elemento aparece claramente dibujado en el diagrama):
- I1/I2: interruptores fotovoltaicos del lado de generación (busca símbolos I1, I2, interruptor DC)
- Interruptor exclusivo: interruptor de interconexión dedicado a la central fotovoltaica en el tablero general
- CCFP: Caja de Control y Fuerza Principal o centro de carga para la central fotovoltaica
- Protección de respaldo contra isla: relay antiislanding o protección 81U/81O/27/59 indicada

Responde ÚNICAMENTE con este JSON válido, sin texto adicional:

{
  "kwp": potencia total del sistema en kWp como número decimal o null,
  "num_paneles": número total de paneles como entero o null,
  "potencia_panel_wp": potencia por panel en Wp como número entero o null,
  "marca_inversor": "marca y modelo del inversor tal como aparece, o null",
  "num_inversores": número de inversores como entero o null,
  "tipo_conexion": "generacion_distribuida" | "net_metering" | "autoconsumo" | "isla" | "interconectado" | null,
  "tipo_central": "MT" | "BT" | null,
  "numero_medidor": "número de medidor CFE o null",
  "tension_vdc": "tensión del sistema DC en V o null",
  "capacidad_subestacion_kva": capacidad del transformador en kVA como número o null,
  "tiene_i1_i2": true si los interruptores I1/I2 aparecen en el diagrama, false si no,
  "tiene_interruptor_exclusivo": true si hay interruptor exclusivo de interconexión, false si no,
  "tiene_ccfp": true si aparece CCFP o centro de carga dedicado, false si no,
  "tiene_proteccion_respaldo": true si hay protección antiislanding indicada, false si no,
  "resumen": "descripción técnica del sistema en 1-2 oraciones"
}`

  } else if (tipoIA === 'memoria_tecnica') {
    prompt = `Eres un experto en ingeniería de sistemas fotovoltaicos en México.
Analiza esta memoria de cálculo / memoria técnica de un sistema fotovoltaico.

Extrae los datos técnicos del sistema. Busca los siguientes valores en el documento:
- Potencia total del sistema en kWp
- Número de módulos fotovoltaicos (paneles)
- Potencia unitaria por panel en Wp
- Marca y modelo del inversor
- Número de inversores
- Tipo de conexión a la red (generación distribuida, net metering, autoconsumo, isla, interconectado)
- Tipo de central: Media Tensión (MT) o Baja Tensión (BT)
- Número de medidor CFE (si aparece)
- Corriente de cortocircuito Isc en Amperios (si aparece)
- Tensión de circuito abierto Voc del sistema en V (si aparece)

SUBESTACIÓN ELÉCTRICA (si aplica):
- Capacidad del transformador en kVA

Responde ÚNICAMENTE con este JSON válido, sin texto adicional:

{
  "kwp": potencia total del sistema en kWp como número decimal o null,
  "num_paneles": número total de paneles como entero o null,
  "potencia_panel_wp": potencia por panel en Wp como número entero o null,
  "marca_inversor": "marca y modelo del inversor tal como aparece, o null",
  "num_inversores": número de inversores como entero o null,
  "tipo_conexion": "generacion_distribuida" | "net_metering" | "autoconsumo" | "isla" | "interconectado" | null,
  "tipo_central": "MT" | "BT" | null,
  "numero_medidor": "número de medidor CFE o null",
  "isc_a": corriente de cortocircuito en A como número o null,
  "voc_v": tensión de circuito abierto en V como número o null,
  "capacidad_subestacion_kva": capacidad del transformador en kVA como número o null,
  "resumen": "descripción técnica del sistema en 1-2 oraciones"
}`

  } else {
    const tipoDescripcion: Record<string, string> = {
      contrato: 'contrato de servicio de inspección eléctrica',
      acta: 'acta de inspección',
      fotografia: 'fotografía de instalación fotovoltaica',
      otro: 'documento técnico',
    }
    prompt = `Eres un experto en sistemas fotovoltaicos y normatividad eléctrica mexicana (NOM-001-SEDE-2012, NOM-EM-001-SEDE-2012).
Analiza este ${tipoDescripcion[doc.tipo] ?? 'documento'} y extrae la siguiente información en formato JSON:

{
  "resumen": "descripción breve del documento en 1-2 oraciones",
  "datos_tecnicos": {
    "potencia_kwp": number | null,
    "num_paneles": number | null,
    "modelo_inversor": string | null,
    "tension_sistema": string | null,
    "norma_cumplida": string | null,
    "resultado_inspeccion": "aprobado" | "rechazado" | "condicionado" | null
  },
  "observaciones": ["lista de observaciones técnicas importantes"],
  "alertas": ["lista de posibles incumplimientos o puntos críticos"],
  "cumple_norma": true | false | null
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.`
  }

  let analysis: any = null
  let costoUSD = 0
  const MODELO = CLAUDE_MODELS.ANALISIS_DOC
  try {
    // Infer mime_type from storage_path extension as fallback for documents
    // uploaded via the client portal before mime_type was saved (legacy records).
    const ext = doc.storage_path?.split('.').pop()?.toLowerCase() ?? ''
    const EXT_MIME: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
    }
    const effectiveMime = doc.mime_type || EXT_MIME[ext] || null

    const isPdf   = effectiveMime === 'application/pdf'
    const isImage = !!effectiveMime?.startsWith('image/')

    let message
    if (isPdf || isImage) {
      message = await anthropic.messages.create({
        model: MODELO,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: isPdf ? 'document' : 'image',
              source: { type: 'base64', media_type: effectiveMime as any, data: base64 },
            } as any,
            { type: 'text', text: prompt },
          ],
        }],
      })
    } else {
      message = await anthropic.messages.create({
        model: MODELO,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Documento: "${doc.nombre}" (tipo: ${doc.tipo}, tamaño: ${Math.round((doc.tamano_bytes ?? 0) / 1024)}KB). No es posible leer el contenido directamente. Devuelve un JSON con resumen indicando que el análisis automático no está disponible para este tipo de archivo, y datos_tecnicos vacíos.`,
        }],
      })
    }

    const content = message.content[0]
    if (content.type === 'text') {
      // Strip markdown code fences if Claude wraps the JSON in ```json ... ```
      const raw = content.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      analysis = JSON.parse(raw)
    }

    // Registrar costo (usar service client para asegurar el INSERT)
    const dbAdmin = await createServiceClient()
    costoUSD = await registrarCostoIA({
      supabase:     dbAdmin,
      usuarioId:    user.id,
      expedienteId: doc.expediente_id,
      endpoint:     'documentos/analizar',
      modelo:       MODELO,
      usage:        message.usage,
      detalle:      { tipo_documento: doc.tipo },
    })
  } catch (err: any) {
    console.error('[analizar] error:', err?.message)
    analysis = { error: 'No se pudo analizar el documento', resumen: 'Error en análisis IA: ' + (err?.message ?? '') }
  }

  // Save analysis to DB
  await db
    .from('documentos_expediente')
    .update({ analisis_ia: analysis, analizado_en: new Date().toISOString() })
    .eq('id', documento_id)

  return NextResponse.json({ analysis, costo_usd: costoUSD })
}
