import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

/**
 * GET /api/expedientes/[id]/zip
 *
 * Descarga TODOS los archivos del expediente como ZIP. Disponible solo cuando
 * el expediente está cerrado/aprobado y tiene certificado emitido.
 *
 * Estructura del ZIP (CRE-compliant — coincide con lo que el inspector entrega
 * físicamente). El certificado, el acuse y la INE del firmante se sacan
 * automáticamente de la BD; el resto son archivos únicos del expediente.
 *
 *   {numero_folio}/
 *     1. OFICIO RESOLUTIVO CFE/
 *     2. DICTAMEN DE VERIFICACIÓN/
 *     3. DU y MDC/
 *     4. CERTIFICADO INVERSOR/
 *     5. FOTOGRAFÍAS INSTALACIÓN/
 *     6. IDENTIFICACIONES/                  ← INE del firmante + testigos (BD)
 *     7. DOCUMENTOS/                        ← acta, lista, contrato, etc.
 *     8. COTIZACIÓN FACTURA/
 *     9. INFORME DE INSPECCIÓN/             ← documento aparte (aún no generado)
 *    10. OPE/                                ← Certificado + Acuse (BD)
 *     resumen.txt
 */

// ─── Mapeo: tipo de documento → nombre de carpeta ────────────────────────────
const FOLDER_OFICIO     = '1. OFICIO RESOLUTIVO CFE'
const FOLDER_DICTAMEN   = '2. DICTAMEN DE VERIFICACIÓN'
const FOLDER_DU_MDC     = '3. DU y MDC'
const FOLDER_CERT_INV   = '4. CERTIFICADO INVERSOR'
const FOLDER_FOTOS      = '5. FOTOGRAFÍAS INSTALACIÓN'
const FOLDER_IDS        = '6. IDENTIFICACIONES'
const FOLDER_DOCS       = '7. DOCUMENTOS'
const FOLDER_COTIZACION = '8. COTIZACIÓN FACTURA'
const FOLDER_INFORME    = '9. INFORME DE INSPECCIÓN'
const FOLDER_OPE        = '10. OPE'

const FOLDER_BY_TIPO: Record<string, string> = {
  // 1. Oficio Resolutivo CFE
  resolutivo:           FOLDER_OFICIO,
  oficio_resolutivo:    FOLDER_OFICIO,
  // 2. Dictamen de Verificación
  dictamen:             FOLDER_DICTAMEN,
  dictamen_uvie:        FOLDER_DICTAMEN,
  // 3. DU y MDC (diagrama unifilar y memoria de cálculo)
  plano:                FOLDER_DU_MDC,
  diagrama:             FOLDER_DU_MDC,
  memoria_tecnica:      FOLDER_DU_MDC,
  memoria_calculo:      FOLDER_DU_MDC,
  // 4. Certificado del inversor
  certificado_inversor: FOLDER_CERT_INV,
  // 5. Fotografías de instalación
  fotografia:           FOLDER_FOTOS,
  evidencia_visita:     FOLDER_FOTOS,
  // 6. Identificaciones (INEs)
  ine_participante:     FOLDER_IDS,
  // 7. Documentos (acta, lista, contrato, recibos, etc.)
  acta:                 FOLDER_DOCS,
  lista_verificacion:   FOLDER_DOCS,
  contrato:             FOLDER_DOCS,
  recibo_cfe:           FOLDER_DOCS,
  otro:                 FOLDER_DOCS,
  // 8. Cotización / factura
  ficha_pago:           FOLDER_COTIZACION,
  // 9. Informe de inspección — documento que aún no se genera (carpeta vacía
  //    por ahora; cuando exista un documento_tipo específico se agrega aquí)
  // 10. OPE (certificado CRE + acuse)
  certificado_cre:      FOLDER_OPE,
  acuse_cre:            FOLDER_OPE,
}

function carpetaParaTipo(tipo: string): string {
  return FOLDER_BY_TIPO[tipo] ?? FOLDER_DOCS
}

function safeName(s: string): string {
  return s.replace(/[/\\:*?"<>|]/g, '_').slice(0, 200)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!u || !rolesPermitidos.includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)

  // ── Cargar expediente con cliente, inversor, certificado, dictamen ────────
  const db = await createServiceClient()
  const { data: exp, error: errExp } = await db
    .from('expedientes')
    .select(`
      id, numero_folio, status, kwp, num_paneles, ciudad, estado_mx,
      direccion_proyecto, colonia, codigo_postal, municipio,
      nombre_cliente_final, fecha_inicio, fecha_cierre, inspector_id,
      resolutivo_folio, resolutivo_fecha, resolutivo_monto, resolutivo_referencia,
      dictamen_folio_dvnp, numero_medidor,
      cliente:clientes(nombre, firmante_nombre, firmante_correo, ine_url_frente, ine_url_reverso),
      inspector:usuarios!inspector_id(nombre, apellidos, email),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, potencia_kw),
      certificados_cre(id, numero_certificado, url_cre, url_acuse, fecha_emision, storage_path_cert, storage_path_acuse)
    `)
    .eq('id', params.id)
    .single()

  if (errExp || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // Verificar permiso del inspector (no-admin solo el suyo)
  if (!esAdmin && exp.inspector_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
  }

  // Solo permitir descarga cuando hay certificado emitido o el expediente está cerrado
  const certificado = (exp.certificados_cre as any)?.[0] ?? null
  if (!certificado && exp.status !== 'cerrado' && exp.status !== 'aprobado') {
    return NextResponse.json({
      error: 'El expediente debe estar aprobado o cerrado para descargar el respaldo'
    }, { status: 422 })
  }

  // ── Cargar documentos del expediente ──────────────────────────────────────
  const { data: documentos } = await db
    .from('documentos_expediente')
    .select('id, nombre, tipo, storage_path, mime_type, created_at')
    .eq('expediente_id', params.id)

  // ── Cargar inspecciones para INEs de testigos ────────────────────────────
  const { data: inspecciones } = await db
    .from('inspecciones')
    .select(`
      id, fecha_hora,
      testigo:testigos!testigo_id(nombre, apellidos, ine_url_frente, ine_url_reverso)
    `)
    .eq('expediente_id', params.id)

  // ── Construir el ZIP ──────────────────────────────────────────────────────
  // Nombre del ZIP: SIEMPRE usar el número de folio interno (UIIE-NNN-YYYY)
  // — así llevan control de auditoría. El número del certificado va dentro.
  const zip = new JSZip()
  const nombreZip = exp.numero_folio ?? certificado?.numero_certificado ?? exp.id
  const root = zip.folder(safeName(nombreZip))!

  // Crear estructura de carpetas en el orden CRE-compliant
  const carpetasFijas = [
    FOLDER_OFICIO, FOLDER_DICTAMEN, FOLDER_DU_MDC, FOLDER_CERT_INV, FOLDER_FOTOS,
    FOLDER_IDS, FOLDER_DOCS, FOLDER_COTIZACION, FOLDER_INFORME, FOLDER_OPE,
  ]
  for (const c of carpetasFijas) root.folder(c)

  // ── Agregar documentos del expediente ─────────────────────────────────────
  for (const doc of documentos ?? []) {
    if (!doc.storage_path) continue
    try {
      const { data: file } = await db.storage.from('documentos').download(doc.storage_path)
      if (!file) continue
      const buffer = await file.arrayBuffer()

      const carpeta = carpetaParaTipo(doc.tipo)
      const ext = doc.storage_path.split('.').pop() ?? ''
      const nombreSafe = safeName(doc.nombre).replace(/\.[^.]+$/, '')
      const filename = `${nombreSafe}${ext ? '.' + ext : ''}`
      root.folder(carpeta)!.file(filename, buffer)
    } catch (e: any) {
      console.warn(`[zip] No se pudo agregar doc ${doc.id}:`, e?.message)
    }
  }

  // ── Agregar INEs (firmante del cliente + testigos) ────────────────────────
  // Helper genérico: descarga un INE del bucket "documentos" y lo agrega a IDs
  const agregarINE = async (
    nombrePersona: string,
    lado: 'frente' | 'reverso',
    path: string,
  ) => {
    try {
      const { data: file } = await db.storage.from('documentos').download(path)
      if (!file) return
      const buffer = await file.arrayBuffer()
      const ext = path.split('.').pop()?.toLowerCase() ?? 'jpg'
      const filename = `${safeName(nombrePersona)}_${lado}.${ext}`
      root.folder(FOLDER_IDS)!.file(filename, buffer)
    } catch (e: any) {
      console.warn(`[zip] No se pudo agregar INE ${path}:`, e?.message)
    }
  }

  // INE del firmante del cliente (sale de la BD: clientes.ine_url_frente/reverso)
  const cliente = exp.cliente as any
  const inesProcesadas = new Set<string>()
  if (cliente) {
    const nombreFirmante = (cliente.firmante_nombre ?? cliente.nombre ?? '').trim()
    if (nombreFirmante && (cliente.ine_url_frente || cliente.ine_url_reverso)) {
      inesProcesadas.add(nombreFirmante)
      if (cliente.ine_url_frente)  await agregarINE(nombreFirmante, 'frente',  cliente.ine_url_frente)
      if (cliente.ine_url_reverso) await agregarINE(nombreFirmante, 'reverso', cliente.ine_url_reverso)
    }
  }

  // INEs de testigos
  for (const insp of inspecciones ?? []) {
    const t = insp.testigo as any
    if (!t) continue
    const nombreCompleto = `${t.nombre ?? ''} ${t.apellidos ?? ''}`.trim()
    if (!nombreCompleto || inesProcesadas.has(nombreCompleto)) continue
    inesProcesadas.add(nombreCompleto)
    if (t.ine_url_frente)  await agregarINE(nombreCompleto, 'frente',  t.ine_url_frente)
    if (t.ine_url_reverso) await agregarINE(nombreCompleto, 'reverso', t.ine_url_reverso)
  }

  // ── Agregar certificado CRE y acuse en carpeta 10. OPE ────────────────────
  // Estos archivos ya están en el bucket certificados-cne (importados desde Drive),
  // así que primero intentamos bajarlos del storage; si no, fallback a la URL externa.
  const agregarOPE = async (
    storagePath: string | null,
    urlExterna: string | null,
    prefijo: string,
  ) => {
    const numCert = certificado?.numero_certificado ?? nombreZip
    const filename = `${prefijo}_${safeName(numCert)}.pdf`
    if (storagePath) {
      try {
        const { data: file } = await db.storage.from('certificados-cne').download(storagePath)
        if (file) {
          const buf = await file.arrayBuffer()
          root.folder(FOLDER_OPE)!.file(filename, buf)
          return
        }
      } catch (e: any) {
        console.warn(`[zip] storage download ${storagePath} falló, intentando URL:`, e?.message)
      }
    }
    if (urlExterna) {
      try {
        const res = await fetch(urlExterna)
        if (res.ok) {
          const buf = await res.arrayBuffer()
          root.folder(FOLDER_OPE)!.file(filename, buf)
        }
      } catch (e: any) {
        console.warn(`[zip] No se pudo descargar ${prefijo}:`, e?.message)
      }
    }
  }
  if (certificado) {
    await agregarOPE(certificado.storage_path_cert ?? null,  certificado.url_cre   ?? null, 'Certificado')
    await agregarOPE(certificado.storage_path_acuse ?? null, certificado.url_acuse ?? null, 'Acuse')
  }

  // ── Homologación de marca de inversor (4. CERTIFICADO INVERSOR) ──────────
  // Si el inversor del expediente pertenece a una marca con homologación
  // (p.ej. Huawei: oficio CNE F00.06.UE/225/2026 + carta de clarificación),
  // los PDFs se agregan automáticamente al ZIP.
  const inversor = exp.inversor as any
  if (inversor?.marca) {
    const { data: homol } = await db
      .from('inversor_homologaciones')
      .select('marca, oficio_cne_path, oficio_cne_nombre, oficio_cne_numero, carta_marca_path, carta_marca_nombre, vigente')
      .ilike('marca', inversor.marca)
      .eq('vigente', true)
      .maybeSingle()

    if (homol) {
      const agregarHomol = async (path: string | null, displayName: string | null, fallback: string) => {
        if (!path) return
        try {
          const { data: file } = await db.storage.from('documentos').download(path)
          if (!file) return
          const buf = await file.arrayBuffer()
          const filename = safeName(displayName || fallback)
          root.folder(FOLDER_CERT_INV)!.file(filename, buf)
        } catch (e: any) {
          console.warn(`[zip] No se pudo agregar homologación ${path}:`, e?.message)
        }
      }
      await agregarHomol(homol.oficio_cne_path,  homol.oficio_cne_nombre,  `Oficio CNE ${homol.oficio_cne_numero}.pdf`)
      await agregarHomol(homol.carta_marca_path, homol.carta_marca_nombre, `Clarificacion ${homol.marca}.pdf`)
    }
  }

  // ── Resumen.txt con metadata del expediente ───────────────────────────────
  const inspector = exp.inspector as any
  const resumen = `RESPALDO DE EXPEDIENTE — ${exp.numero_folio}
Generado: ${new Date().toLocaleString('es-MX')}

═══════════════════════════════════════════════════════════════
DATOS DEL EXPEDIENTE
═══════════════════════════════════════════════════════════════

Folio interno:           ${exp.numero_folio ?? '—'}
Status:                  ${exp.status}
Fecha inicio:            ${exp.fecha_inicio ?? '—'}
Fecha cierre:            ${exp.fecha_cierre ?? '—'}

═══════════════════════════════════════════════════════════════
CLIENTE
═══════════════════════════════════════════════════════════════

Nombre / Razón Social:   ${cliente?.nombre ?? exp.nombre_cliente_final ?? '—'}
Firmante:                ${cliente?.firmante_nombre ?? '—'}
Correo:                  ${cliente?.firmante_correo ?? '—'}
Cliente final:           ${exp.nombre_cliente_final ?? '—'}

═══════════════════════════════════════════════════════════════
DIRECCIÓN
═══════════════════════════════════════════════════════════════

Dirección:               ${exp.direccion_proyecto ?? '—'}
Colonia:                 ${exp.colonia ?? '—'}
Municipio:               ${exp.municipio ?? '—'}
Ciudad:                  ${exp.ciudad ?? '—'}
CP:                      ${exp.codigo_postal ?? '—'}
Estado:                  ${exp.estado_mx ?? '—'}

═══════════════════════════════════════════════════════════════
INSTALACIÓN
═══════════════════════════════════════════════════════════════

Potencia:                ${exp.kwp ?? '—'} kWp
Núm. paneles:            ${exp.num_paneles ?? '—'}
Inversor:                ${inversor ? `${inversor.marca} ${inversor.modelo} (${inversor.potencia_kw} kW)` : '—'}
Núm. medidor CFE:        ${exp.numero_medidor ?? '—'}

═══════════════════════════════════════════════════════════════
RESOLUTIVO CFE
═══════════════════════════════════════════════════════════════

Folio:                   ${exp.resolutivo_folio ?? '—'}
Fecha:                   ${exp.resolutivo_fecha ?? '—'}
Monto cobrado:           ${exp.resolutivo_monto != null ? `$${exp.resolutivo_monto}` : '—'}
Referencia:              ${exp.resolutivo_referencia ?? '—'}

═══════════════════════════════════════════════════════════════
DICTAMEN UVIE
═══════════════════════════════════════════════════════════════

Folio DVNP:              ${exp.dictamen_folio_dvnp ?? '—'}

═══════════════════════════════════════════════════════════════
INSPECTOR
═══════════════════════════════════════════════════════════════

Nombre:                  ${inspector ? `${inspector.nombre} ${inspector.apellidos ?? ''}`.trim() : '—'}
Correo:                  ${inspector?.email ?? '—'}

═══════════════════════════════════════════════════════════════
CERTIFICADO CNE
═══════════════════════════════════════════════════════════════

Número:                  ${certificado?.numero_certificado ?? '—'}
Fecha emisión:           ${certificado?.fecha_emision ?? '—'}
URL bóveda:              ${certificado?.url_cre ?? '—'}
URL acuse:               ${certificado?.url_acuse ?? '—'}

═══════════════════════════════════════════════════════════════
ARCHIVOS INCLUIDOS
═══════════════════════════════════════════════════════════════

Total documentos:        ${(documentos ?? []).length}
INEs de participantes:   ${inesProcesadas.size}
`
  root.file('resumen.txt', resumen)

  // ── Generar ZIP ───────────────────────────────────────────────────────────
  const zipBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // Marcar el expediente como descargado (para futuro auto-borrado a los 20 días)
  await db.from('expedientes').update({
    respaldo_descargado_at: new Date().toISOString(),
  }).eq('id', params.id)
  // Nota: si la columna respaldo_descargado_at no existe, esta llamada falla silenciosa

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName(nombreZip)}.zip"`,
      'Content-Length': zipBuffer.byteLength.toString(),
    },
  })
}
