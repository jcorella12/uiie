/**
 * Importa el Forms "SOLICITUD DE FOLIOS PARA INSPECTORES (Respuestas)".
 *
 * Para cada folio del Forms:
 *  - Si ya existe expediente (Q1) → actualiza solicitudes_folio con datos del
 *    Forms (integrador EPC, precio cotización, oficio CFE, marca temporal real).
 *  - Si no existe expediente (Q2+ pendiente) → crea/actualiza solicitudes_folio
 *    con status='folio_asignado' y marca folio como asignado.
 *
 * No sobreescribe datos esenciales del expediente — sólo refina los datos que
 * el Forms tiene mejor que la importación trimestral.
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

function parseTimestamp(s) {
  if (!s) return null
  // "1/6/2026 12:01:21" → ISO con TZ MX
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, mm, dd, yyyy, hh, mi, ss] = m
  // Asume México (UTC-6)
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T${hh.padStart(2,'0')}:${mi}:${ss}-06:00`
}

function parseFechaCorta(s) {
  if (!s) return null
  // "12/16/25" o "1/8/26" → YYYY-MM-DD
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  let [, mm, dd, yy] = m
  if (yy.length === 2) yy = '20' + yy
  return `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

function parseKwp(s) {
  if (s === null || s === undefined) return null
  // "5 KW", "581.56", "17.355"
  const m = String(s).match(/[\d.]+/)
  if (!m) return null
  return Number(m[0])
}

function parseCiudadEstado(s) {
  if (!s) return { ciudad: null, estado: null }
  const parts = String(s).split(',').map(x => x.trim())
  if (parts.length >= 2) return { ciudad: parts[0], estado: parts.slice(1).join(', ') }
  return { ciudad: parts[0], estado: null }
}

function detectTipoPersona(nombre) {
  const n = norm(nombre)
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

// ─── Cargar usuarios ─────────────────────────────────────────────────────────
const { data: usuarios } = await sb.from('usuarios').select('id, email, nombre, apellidos, rol')
const byName = new Map()
for (const u of usuarios) {
  const fullName = norm(`${u.nombre} ${u.apellidos}`)
  if (!byName.has(fullName)) byName.set(fullName, [])
  byName.get(fullName).push(u)
}
function findInspectorByName(name) {
  const arr = byName.get(norm(name))
  if (!arr) return null
  return arr.find(u => u.rol === 'inspector') ?? arr[0]
}

const responsable = usuarios.find(u => u.email === 'joaquin@ciae.com.mx')

// ─── Cargar folios y existentes ──────────────────────────────────────────────
const { data: foliosDB } = await sb.from('folios_lista_control').select('id, numero_folio, asignado')
const folioMap = new Map(foliosDB.map(f => [f.numero_folio, f]))

const { data: expedientes } = await sb.from('expedientes').select('id, numero_folio, inspector_id')
const expByFolio = new Map(expedientes.map(e => [e.numero_folio, e]))

const { data: solicitudes } = await sb.from('solicitudes_folio')
  .select('id, folio_asignado_id, inspector_id, cliente_epc_nombre, status, created_at')
const solByFolioId = new Map(solicitudes.map(s => [s.folio_asignado_id, s]))

// ─── Leer Forms ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile('/Users/joaquincorella/Downloads/SOLICITUD DE FOLIOS PARA INSPECTORES (Respuestas).xlsx')
const ws = wb.Sheets['Respuestas de formulario 1']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, blankrows: false })

const COL = {
  folio: 0, marca_temp: 1, inspector: 2, integrador: 3, solicitante: 4,
  kwp: 5, precio: 6, ciudad_estado: 7, fecha_estimada: 8, oficio_cfe: 10,
}

// Dedupe: folio 116 está duplicado — quedarnos con el más reciente (último)
const byFolio = new Map()
for (let i = 1; i < rows.length; i++) {
  const r = rows[i]
  if (!r?.[COL.folio]) continue
  const folioNum = String(r[COL.folio]).trim().padStart(3, '0')
  byFolio.set(folioNum, r)  // sobreescribe → último gana
}

console.log(`═══ Procesando ${byFolio.size} folios del Forms ═══\n`)

const stats = { actualizados: 0, creados: 0, foliosNoEnc: 0, inspectorNoEnc: 0, errors: 0, exp_resolutivo: 0 }
const errors = []

for (const [folioNum, r] of byFolio) {
  const numero_folio = `UIIE-${folioNum}-2026`
  const folio = folioMap.get(numero_folio)
  if (!folio) {
    stats.foliosNoEnc++
    if (stats.foliosNoEnc <= 5) errors.push(`Folio ${numero_folio} no existe en folios_lista_control`)
    continue
  }

  const inspector = findInspectorByName(r[COL.inspector])
  if (!inspector) {
    stats.inspectorNoEnc++
    errors.push(`Inspector "${r[COL.inspector]}" no encontrado (folio ${numero_folio})`)
    continue
  }

  const { ciudad, estado } = parseCiudadEstado(r[COL.ciudad_estado])
  const kwp = parseKwp(r[COL.kwp])
  const precio = Number(String(r[COL.precio] ?? '').replace(/[^\d.]/g, '')) || 0
  const fechaEst = parseFechaCorta(r[COL.fecha_estimada])
  const marcaTemp = parseTimestamp(r[COL.marca_temp])
  const integrador = String(r[COL.integrador] ?? '').trim() || null
  const solicitante = String(r[COL.solicitante] ?? '').trim() || null
  const oficio = String(r[COL.oficio_cfe] ?? '').trim() || null

  try {
    const exp = expByFolio.get(numero_folio)
    const sol = solByFolioId.get(folio.id)

    // Caso A: Solicitud existe → actualizar con datos del Forms
    if (sol) {
      const updates = {
        cliente_epc_nombre: integrador,
        precio_propuesto: precio || sol.precio_propuesto,
        precio_base: precio || sol.precio_propuesto,
        ciudad: ciudad || 'N/D',
        estado_mx: estado,
        fecha_estimada: fechaEst,
        kwp: kwp ?? undefined,
        cliente_nombre: solicitante,
        propietario_nombre: solicitante,
        created_at: marcaTemp,
      }
      // Limpiar undefined
      for (const k of Object.keys(updates)) if (updates[k] === undefined) delete updates[k]

      const { error } = await sb.from('solicitudes_folio').update(updates).eq('id', sol.id)
      if (error) throw new Error(`update solicitud: ${error.message}`)
      stats.actualizados++
    }
    // Caso B: No existe solicitud → crearla (folio Q2+ pendiente)
    else {
      const tipoPersona = detectTipoPersona(solicitante)
      const { error } = await sb.from('solicitudes_folio').insert({
        inspector_id: inspector.id,
        cliente_id: null,
        cliente_nombre: solicitante,
        tipo_persona: tipoPersona,
        ciudad: ciudad || 'N/D',
        estado_mx: estado,
        kwp: kwp ?? 1,
        fecha_estimada: fechaEst ?? new Date().toISOString().slice(0,10),
        cliente_epc_nombre: integrador,
        precio_propuesto: precio,
        precio_base: precio,
        porcentaje_precio: 100,
        requiere_autorizacion: false,
        status: 'folio_asignado',
        folio_asignado_id: folio.id,
        revisado_por: responsable?.id ?? null,
        fecha_revision: marcaTemp,
        propietario_nombre: solicitante,
        inspector_ejecutor_id: inspector.id,
        created_at: marcaTemp,
        updated_at: marcaTemp,
      })
      if (error) throw new Error(`insert solicitud: ${error.message}`)

      // Marcar folio asignado
      if (!folio.asignado) {
        await sb.from('folios_lista_control').update({
          asignado: true,
          asignado_a: inspector.id,
          fecha_asignacion: marcaTemp,
        }).eq('id', folio.id)
      }
      stats.creados++
    }

    // Si hay expediente, actualizar resolutivo_folio con el oficio CFE link
    if (exp && oficio) {
      await sb.from('expedientes').update({ resolutivo_folio: oficio }).eq('id', exp.id)
      stats.exp_resolutivo++
    }

    if ((stats.actualizados + stats.creados) % 50 === 0) {
      console.log(`  ${stats.actualizados + stats.creados} procesados…`)
    }
  } catch (e) {
    stats.errors++
    if (errors.length < 20) errors.push(`${numero_folio}: ${e.message}`)
  }
}

console.log(`\n═══ Resumen ═══`)
console.log(`  Actualizados:      ${stats.actualizados}`)
console.log(`  Creados (nuevos):  ${stats.creados}`)
console.log(`  Exp con oficio:    ${stats.exp_resolutivo}`)
console.log(`  Folios no encont:  ${stats.foliosNoEnc}`)
console.log(`  Inspector no enc:  ${stats.inspectorNoEnc}`)
console.log(`  Errores:           ${stats.errors}`)

if (errors.length > 0) {
  console.log(`\n  Detalles (hasta 15):`)
  for (const e of errors.slice(0, 15)) console.log(`    ${e}`)
}

const { count: nSol } = await sb.from('solicitudes_folio').select('*', { count: 'exact', head: true })
const { count: nFolAs } = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', true)
const { count: nExpRes } = await sb.from('expedientes').select('*', { count: 'exact', head: true }).not('resolutivo_folio', 'is', null)
const { count: nSolEPC } = await sb.from('solicitudes_folio').select('*', { count: 'exact', head: true }).not('cliente_epc_nombre', 'is', null)

console.log(`\n  En BD:`)
console.log(`    solicitudes_folio:        ${nSol}`)
console.log(`      con cliente_epc_nombre: ${nSolEPC}`)
console.log(`    folios asignados:         ${nFolAs}`)
console.log(`    expedientes con oficio:   ${nExpRes}`)
