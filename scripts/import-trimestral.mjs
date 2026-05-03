/**
 * Importa el reporte trimestral Q1 2026 al sistema.
 *
 * Por cada fila del Excel crea:
 *   1. solicitudes_folio   (status=folio_asignado)
 *   2. UPDATE folios_lista_control (asignado=true)
 *   3. expedientes         (status=cerrado, con todos los datos del reporte)
 *   4. inspecciones_agenda (status=realizada, con fecha+hora_cierre)
 *
 * El "Solicitante" del reporte va en expedientes.nombre_cliente_final
 * El cliente real (cliente_id) lo selecciona después el inspector al abrir el expediente.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = s => stripAccents(String(s ?? '')).toUpperCase().replace(/\s+/g, ' ').trim()

function parseDate(s) {
  if (!s) return null
  // DD/MM/YYYY
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const d = m[1].padStart(2, '0'), mo = m[2].padStart(2, '0'), y = m[3]
    return `${y}-${mo}-${d}`
  }
  return null
}

function parseExcelTimeFraction(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (Number.isFinite(n) && n >= 0 && n <= 1) {
    // 0.5 = 12:00, 0.375 = 09:00, etc.
    const total = Math.round(n * 24 * 60)  // minutos
    const h = Math.floor(total / 60).toString().padStart(2, '0')
    const m = (total % 60).toString().padStart(2, '0')
    return `${h}:${m}:00`
  }
  // formato HH:MM o HH:MM:SS
  const m = String(v).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (m) return `${m[1].padStart(2,'0')}:${m[2]}:${m[3] ?? '00'}`
  return null
}

function detectTipoPersona(nombre) {
  const n = norm(nombre)
  // Moral si tiene cualquier sufijo común de razón social
  const moralPatterns = [
    /\bS\.?A\.?\b/, /\bDE C\.?V\.?\b/, /\bSAPI\b/, /\bSAB\b/,
    /\bS\.? DE R\.?L\.?\b/, /\bS\.?\s?C\.?\b/, /\bS\.?P\.?R\.?\b/,
    /\bDE R\.?L\.?\b/, /\bA\.?C\.?\b/, /\bAC\b/, /\bSOFOM\b/,
    /\bCOOP\b/, /\bGRUPO\b/, /\bINSTITUTO\b/, /\bCOLEGIO\b/,
    /\bUNIVERSIDAD\b/, /\bASOCIACION\b/, /\bFUNDACION\b/,
    /\bINDUSTRIA\b/, /\bCOMERCIAL\b/, /\bSERVICIOS\b/, /\bCORPORATIVO\b/,
  ]
  return moralPatterns.some(p => p.test(n)) ? 'moral' : 'fisica'
}

function combineDateTime(date, timeFractionOrStr) {
  if (!date) return null
  const time = parseExcelTimeFraction(timeFractionOrStr) ?? '12:00:00'
  // Asume zona local de México (UTC-6 sin DST)
  return `${date}T${time}-06:00`
}

// ─── Cargar usuarios ─────────────────────────────────────────────────────────
const { data: usuarios } = await sb.from('usuarios')
  .select('id, email, nombre, apellidos, rol, activo')

// Mapa por nombre normalizado → user (preferir activos e inspector_role)
const byName = new Map()
for (const u of usuarios) {
  const fullName = norm(`${u.nombre} ${u.apellidos}`)
  // Si hay duplicados (Joaquín tiene 2 cuentas), preferir la cuenta inspector (no responsable)
  // para inspector_ejecutor_id. Pero guardamos ambas por rol.
  if (!byName.has(fullName)) byName.set(fullName, [])
  byName.get(fullName).push(u)
}

function findInspectorByName(name, preferRol = 'inspector') {
  const key = norm(name)
  const arr = byName.get(key)
  if (!arr) return null
  // Preferir el rol pedido
  return arr.find(u => u.rol === preferRol) ?? arr[0]
}

// El responsable que autoriza siempre es joaquin@ciae.com.mx
const responsable = usuarios.find(u => u.email === 'joaquin@ciae.com.mx')
if (!responsable) throw new Error('Falta joaquin@ciae.com.mx')

// ─── Cargar folios ───────────────────────────────────────────────────────────
const { data: foliosDB } = await sb.from('folios_lista_control')
  .select('id, numero_folio, asignado')
const folioMap = new Map(foliosDB.map(f => [f.numero_folio, f]))

// Folios que ya tienen expediente (idempotencia: saltar reimportación)
const { data: expExist } = await sb.from('expedientes').select('numero_folio')
const yaImportados = new Set((expExist ?? []).map(e => e.numero_folio))
console.log(`Ya importados (skip): ${yaImportados.size}`)

// Limpiar solicitudes huérfanas (sin expediente correspondiente) para evitar conflicto
const { data: solExist } = await sb.from('solicitudes_folio')
  .select('id, folio_asignado_id, folios_lista_control:folio_asignado_id(numero_folio)')
  .not('folio_asignado_id', 'is', null)
const orfanas = (solExist ?? []).filter(s =>
  s.folios_lista_control && !yaImportados.has(s.folios_lista_control.numero_folio)
)
if (orfanas.length > 0) {
  console.log(`Limpiando ${orfanas.length} solicitudes huérfanas…`)
  for (const o of orfanas) {
    await sb.from('solicitudes_folio').delete().eq('id', o.id)
  }
}

// ─── Leer Excel ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile('/Users/joaquincorella/Downloads/ReporteTrimestral_Q1_2026 (1).xlsx')
const ws = wb.Sheets['Informe']
// raw:true para tener números (hora 0.5) en lugar de strings
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true, blankrows: false })

// Mapeo de columnas (índice 0-based)
const COL = {
  num: 1, num_certificado: 2, fecha_emision_cert: 3,
  solicitante: 4, contacto: 5, telefono: 6, email: 7,
  tipo_inst: 8, tipo_tec: 9, num_permiso: 10, tension: 11,
  cap_mw: 12, municipio: 13, entidad: 14, direccion: 15,
  oficio_resol: 16, fecha_solicitud: 17, monto: 18,
  fecha_inicio_insp: 19, num_acta: 20, fecha_acta: 21,
  hora_cierre: 22, inspector_realizo: 23, inspector_autorizo: 24,
  comentarios: 25,
}

// Convierte serial Excel → "DD/MM/YYYY" (cuando raw:true)
function excelDateToDDMMYYYY(serial) {
  if (typeof serial !== 'number') return parseDate(serial)
  // Excel serial (1900-based, with 1900 leap year bug)
  const utcDays = Math.floor(serial - 25569)
  const utcSeconds = utcDays * 86400
  const d = new Date(utcSeconds * 1000)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yy = d.getUTCFullYear()
  return `${yy}-${mm}-${dd}`
}

// ─── Procesar filas ──────────────────────────────────────────────────────────
const stats = { total: 0, ok: 0, errors: [], inspectoresNoEnc: new Set(), foliosNoEnc: new Set() }

console.log('═══ Importando reporte trimestral Q1 2026 ═══\n')

const startIdx = 6  // datos empiezan en fila 7 (índice 6)
for (let i = startIdx; i < rows.length; i++) {
  const r = rows[i]
  if (!r || !r[COL.num] || !r[COL.num_acta]) continue
  stats.total++

  const numActa = String(r[COL.num_acta]).trim()
  if (yaImportados.has(numActa)) { stats.skipped = (stats.skipped ?? 0) + 1; continue }
  const folio = folioMap.get(numActa)
  if (!folio) {
    stats.errors.push(`Fila ${i+1}: folio ${numActa} no existe en BD`)
    stats.foliosNoEnc.add(numActa)
    continue
  }

  // Inspectors
  const ejecutor = findInspectorByName(r[COL.inspector_realizo], 'inspector')
  if (!ejecutor) {
    stats.errors.push(`Fila ${i+1}: inspector "${r[COL.inspector_realizo]}" no encontrado`)
    stats.inspectoresNoEnc.add(String(r[COL.inspector_realizo] ?? ''))
    continue
  }

  // Datos parseados
  const fechaInicio = excelDateToDDMMYYYY(r[COL.fecha_inicio_insp])
  const fechaActa = excelDateToDDMMYYYY(r[COL.fecha_acta])
  const fechaSolicitud = excelDateToDDMMYYYY(r[COL.fecha_solicitud])
  const horaCierre = parseExcelTimeFraction(r[COL.hora_cierre])
  const capacidadMW = Number(r[COL.cap_mw]) || 0
  const kwp = capacidadMW * 1000
  const monto = Number(r[COL.monto]) || 0
  const tipoPersona = detectTipoPersona(r[COL.solicitante])

  const solicitanteNombre = String(r[COL.solicitante] ?? '').trim()
  const contactoNombre = String(r[COL.contacto] ?? '').trim() || null
  const telefono = r[COL.telefono] ? String(r[COL.telefono]).trim() : null
  const emailContacto = r[COL.email] ? String(r[COL.email]).trim() : null
  const municipio = String(r[COL.municipio] ?? '').trim() || null
  const entidad = String(r[COL.entidad] ?? '').trim() || null
  const direccion = String(r[COL.direccion] ?? '').trim() || null
  const tipoInst = String(r[COL.tipo_inst] ?? '').trim() || null
  const tipoTec = String(r[COL.tipo_tec] ?? '').trim() || null
  const numPermiso = String(r[COL.num_permiso] ?? '').trim() || null
  const tension = r[COL.tension] !== null && r[COL.tension] !== '' ? Number(r[COL.tension]) || null : null
  const oficioResol = String(r[COL.oficio_resol] ?? '').trim() || null
  const numCert = String(r[COL.num_certificado] ?? '').trim() || null
  const fechaEmisionCert = excelDateToDDMMYYYY(r[COL.fecha_emision_cert])
  const comentarios = String(r[COL.comentarios] ?? '').trim() || null

  try {
    // 1. Crear solicitud
    const { data: sol, error: errSol } = await sb.from('solicitudes_folio').insert({
      inspector_id: ejecutor.id,
      cliente_id: null,
      cliente_nombre: solicitanteNombre,
      tipo_persona: tipoPersona,
      ciudad: municipio || 'N/D',
      estado_mx: entidad,
      kwp: kwp,
      fecha_estimada: fechaInicio || fechaActa,
      precio_propuesto: monto,
      precio_base: monto,
      porcentaje_precio: 100,
      requiere_autorizacion: false,
      status: 'folio_asignado',
      folio_asignado_id: folio.id,
      revisado_por: responsable.id,
      fecha_revision: combineDateTime(fechaSolicitud || fechaInicio, '09:00'),
      propietario_nombre: solicitanteNombre,
      inspector_ejecutor_id: ejecutor.id,
      created_at: combineDateTime(fechaSolicitud || fechaInicio, '08:00'),
      updated_at: combineDateTime(fechaActa, horaCierre ?? '12:00'),
    }).select('id').single()

    if (errSol) throw new Error(`solicitud: ${errSol.message}`)

    // 2. Marcar folio asignado
    await sb.from('folios_lista_control').update({
      asignado: true,
      asignado_a: ejecutor.id,
      fecha_asignacion: combineDateTime(fechaSolicitud || fechaInicio, '09:00'),
    }).eq('id', folio.id)

    // 3. Crear expediente
    const { data: exp, error: errExp } = await sb.from('expedientes').insert({
      folio_id: folio.id,
      numero_folio: numActa,
      inspector_id: ejecutor.id,
      inspector_ejecutor_id: ejecutor.id,
      cliente_id: null,
      kwp: kwp,
      direccion_proyecto: direccion,
      ciudad: municipio,
      municipio: municipio,
      estado_mx: entidad,
      status: 'cerrado',
      fecha_inicio: fechaInicio,
      fecha_cierre: fechaActa,
      hora_inicio_inspeccion: null,  // no está en este Excel — se llenará al editar
      hora_cierre_acta: horaCierre,
      observaciones: comentarios,
      tipo_conexion: 'generacion_distribuida',
      tipo_central: 'MT',
      // Campos del reporte trimestral
      nombre_cliente_final: solicitanteNombre,
      propietario_nombre: solicitanteNombre,
      tipo_instalacion: tipoInst,
      tipo_tecnologia: tipoTec,
      tension_interconexion_v: tension,
      numero_permiso_cre_cne: numPermiso,
      atiende_visita_nombre: contactoNombre,
      atiende_visita_telefono: telefono,
      atiende_visita_correo: emailContacto,
      // Resolutivo (algunos rows tienen oficio CENACE/CFE)
      resolutivo_folio: oficioResol,
      // Certificado (para llenar mañana)
      numero_certificado: numCert,
      fecha_emision_certificado: fechaEmisionCert,
      checklist_pct: 100,
      created_at: combineDateTime(fechaInicio, '09:00'),
      updated_at: combineDateTime(fechaActa, horaCierre ?? '12:00'),
    }).select('id').single()

    if (errExp) throw new Error(`expediente: ${errExp.message}`)

    // 4. Crear entrada en agenda
    const fechaHoraInicio = combineDateTime(fechaInicio || fechaActa, '09:00')
    // Duración: si tenemos hora_cierre, calcular. Si no, default 180 min.
    let duracionMin = 180
    if (horaCierre) {
      const [hh, mm] = horaCierre.split(':').map(Number)
      duracionMin = (hh * 60 + mm) - 9 * 60
      if (duracionMin <= 0) duracionMin = 180
    }
    const { error: errAg } = await sb.from('inspecciones_agenda').insert({
      expediente_id: exp.id,
      inspector_id: ejecutor.id,
      inspector_ejecutor_id: ejecutor.id,
      fecha_hora: fechaHoraInicio,
      duracion_min: duracionMin,
      direccion: direccion,
      status: 'realizada',
      created_at: combineDateTime(fechaSolicitud || fechaInicio, '09:00'),
      updated_at: combineDateTime(fechaActa, horaCierre ?? '12:00'),
    })
    if (errAg) throw new Error(`agenda: ${errAg.message}`)

    stats.ok++
    if (stats.ok % 25 === 0) console.log(`  ${stats.ok}/${stats.total}…`)
  } catch (e) {
    stats.errors.push(`Fila ${i+1} (${numActa}): ${e.message}`)
  }
}

// ─── Resumen ────────────────────────────────────────────────────────────────
console.log(`\n═══ Resumen ═══`)
console.log(`  Procesadas:   ${stats.total}`)
console.log(`  Saltadas:     ${stats.skipped ?? 0} (ya existían)`)
console.log(`  Importadas:   ${stats.ok}`)
console.log(`  Errores:      ${stats.errors.length}`)
if (stats.inspectoresNoEnc.size > 0) {
  console.log(`\n  Inspectores no encontrados:`)
  for (const i of stats.inspectoresNoEnc) console.log(`    "${i}"`)
}
if (stats.foliosNoEnc.size > 0) {
  console.log(`\n  Folios no encontrados (primeros 10):`)
  for (const f of [...stats.foliosNoEnc].slice(0, 10)) console.log(`    ${f}`)
}
if (stats.errors.length > 0 && stats.errors.length <= 20) {
  console.log(`\n  Errores:`)
  for (const e of stats.errors) console.log(`    ${e}`)
} else if (stats.errors.length > 20) {
  console.log(`\n  Primeros 10 errores:`)
  for (const e of stats.errors.slice(0, 10)) console.log(`    ${e}`)
}

// Verificación final
const { count: nExp } = await sb.from('expedientes').select('*', { count: 'exact', head: true })
const { count: nSol } = await sb.from('solicitudes_folio').select('*', { count: 'exact', head: true })
const { count: nAg } = await sb.from('inspecciones_agenda').select('*', { count: 'exact', head: true })
const { count: nFolAsig } = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', true)
console.log(`\n  En BD ahora:`)
console.log(`    Expedientes:       ${nExp}`)
console.log(`    Solicitudes:       ${nSol}`)
console.log(`    Agenda:            ${nAg}`)
console.log(`    Folios asignados:  ${nFolAsig}`)

console.log('\n✅ Listo')
