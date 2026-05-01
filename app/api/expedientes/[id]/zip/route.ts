import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

/**
 * GET /api/expedientes/[id]/zip
 *
 * Descarga TODOS los archivos del expediente como ZIP. Disponible solo cuando
 * el expediente está cerrado/aprobado y tiene certificado emitido.
 *
 * Estructura del ZIP:
 *   {numero_certificado}/
 *     Resolutivo/
 *     Ficha_Pago/
 *     Plano/
 *     Memoria_Tecnica/
 *     Dictamen_UVIE/
 *     Acta/
 *     Lista_Verificacion/
 *     Contrato/
 *     Fotografias/
 *     Evidencia_Visita/
 *     Certificado_CNE/
 *     Acuse_CNE/
 *     INE_Participantes/
 *     Otros/
 *     resumen.txt
 */

// ─── Mapeo: tipo de documento → nombre de carpeta ────────────────────────────
const FOLDER_BY_TIPO: Record<string, string> = {
  resolutivo:        'Resolutivo',
  oficio_resolutivo: 'Resolutivo',
  ficha_pago:        'Ficha_Pago',
  plano:             'Plano',
  diagrama:          'Plano',
  memoria_tecnica:   'Memoria_Tecnica',
  memoria_calculo:   'Memoria_Tecnica',
  dictamen:          'Dictamen_UVIE',
  dictamen_uvie:     'Dictamen_UVIE',
  acta:              'Acta',
  lista_verificacion:'Lista_Verificacion',
  contrato:          'Contrato',
  fotografia:        'Fotografias',
  evidencia_visita:  'Evidencia_Visita',
  certificado_cre:   'Certificado_CNE',
  acuse_cre:         'Acuse_CNE',
  otro:              'Otros',
}

function carpetaParaTipo(tipo: string): string {
  return FOLDER_BY_TIPO[tipo] ?? 'Otros'
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
      cliente:clientes(nombre, firmante_nombre, firmante_correo),
      inspector:usuarios!inspector_id(nombre, apellidos, email),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, potencia_kw),
      certificados_cre(id, numero_certificado, url_cre, url_acuse, fecha_emision)
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

  // Crear estructura de carpetas predefinidas (vacías por defecto, se llenan abajo)
  const carpetasFijas = [
    'Resolutivo', 'Ficha_Pago', 'Plano', 'Memoria_Tecnica', 'Dictamen_UVIE',
    'Acta', 'Lista_Verificacion', 'Contrato', 'Fotografias', 'Evidencia_Visita',
    'Certificado_CNE', 'Acuse_CNE', 'INE_Participantes', 'Otros',
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

  // ── Agregar INEs de testigos ──────────────────────────────────────────────
  const inesProcesadas = new Set<string>()
  for (const insp of inspecciones ?? []) {
    const t = insp.testigo as any
    if (!t) continue
    const nombreCompleto = `${t.nombre ?? ''} ${t.apellidos ?? ''}`.trim()
    if (!nombreCompleto || inesProcesadas.has(nombreCompleto)) continue
    inesProcesadas.add(nombreCompleto)

    for (const [lado, path] of [['frente', t.ine_url_frente], ['reverso', t.ine_url_reverso]] as const) {
      if (!path) continue
      try {
        const { data: file } = await db.storage.from('documentos').download(path)
        if (!file) continue
        const buffer = await file.arrayBuffer()
        const ext = path.split('.').pop() ?? 'jpg'
        const filename = `${safeName(nombreCompleto)}_${lado}.${ext}`
        root.folder('INE_Participantes')!.file(filename, buffer)
      } catch (e: any) {
        console.warn(`[zip] No se pudo agregar INE ${path}:`, e?.message)
      }
    }
  }

  // ── Agregar certificado y acuse desde URLs externas (CNE) ─────────────────
  if (certificado?.url_cre) {
    try {
      const res = await fetch(certificado.url_cre)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        root.folder('Certificado_CNE')!.file(`Certificado_${safeName(certificado.numero_certificado ?? nombreZip)}.pdf`, buf)
      }
    } catch (e: any) {
      console.warn('[zip] No se pudo descargar certificado CNE:', e?.message)
    }
  }
  if (certificado?.url_acuse) {
    try {
      const res = await fetch(certificado.url_acuse)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        root.folder('Acuse_CNE')!.file(`Acuse_${safeName(certificado.numero_certificado ?? nombreZip)}.pdf`, buf)
      }
    } catch (e: any) {
      console.warn('[zip] No se pudo descargar acuse CNE:', e?.message)
    }
  }

  // ── Resumen.txt con metadata del expediente ───────────────────────────────
  const cliente = exp.cliente as any
  const inspector = exp.inspector as any
  const inversor = exp.inversor as any
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
