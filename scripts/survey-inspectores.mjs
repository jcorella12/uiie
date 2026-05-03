/**
 * Escanea carpetas de cada inspector buscando certificados/acuses 2026.
 * Solo 2026 (filtra el resto).
 */
import { readdirSync, statSync, writeFileSync } from 'fs'
import { join, basename } from 'path'

const BASE = '/Users/joaquincorella/Library/CloudStorage/GoogleDrive-corella12@gmail.com/Mi unidad/1. CIAE/4. UIIE/CORRESPONDENCIA UIIE/INSPECTORES CORRESPONDENCIA'

const acuseRe = /OPE\s*-\s*Acuse\s+(UIIE-CC-\d+-(\d{4}))\.pdf$/i
const certCleanRe = /^UIIE[\s-](\d+)-(\d{4})\.pdf$/i  // "UIIE 001-2026.pdf" o "UIIE-001-2026.pdf"
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i

// Carpetas que contienen el folio en el nombre
const folioFolderRe = /(?:Inspecci[oó]n[\s-]*|UIIE-)(\d{2,4})[-\s]?\D*?(\d{4})?/i

function listAllFiles(dir, depth = 0) {
  const out = []
  if (depth > 8) return out
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name === 'Icon' || e.name.startsWith('.') || e.name.endsWith('.zip') || e.name.endsWith('.rar')) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...listAllFiles(full, depth + 1))
    else if (e.isFile() && full.toLowerCase().endsWith('.pdf')) out.push(full)
  }
  return out
}

const inspectorDirs = readdirSync(BASE, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'Icon' && e.name !== '2025' && !e.name.startsWith('.'))
  .map(e => e.name)

console.log(`Carpetas de inspector: ${inspectorDirs.join(', ')}\n`)

// Mapa: folio (UIIE-NNN-2026) → { cert_file, acuse_file, numero_certificado, fecha_emision, source_folder }
const byFolio = new Map()

function tryParseFromContext(filePath) {
  // Buscar folio número en alguno de los path segments
  const parts = filePath.split('/')
  for (let i = parts.length - 2; i >= 0; i--) {
    const m = parts[i].match(folioFolderRe)
    if (m) {
      const num = m[1].padStart(3, '0')
      const year = m[2] ?? '2026'
      // Si "INSPECCION 010-DELICIAS" no captura 2026, asumimos 2026
      return { num, year }
    }
  }
  return null
}

const stats = { totalPdfs: 0, cert: 0, acuse: 0, uuid: 0, ignored: 0, no_folio: 0, no_2026: 0 }

for (const inspector of inspectorDirs) {
  const files = listAllFiles(join(BASE, inspector))
  stats.totalPdfs += files.length

  for (const f of files) {
    const name = basename(f)
    let folio = null
    let year = null
    let isAcuse = false
    let isCert = false
    let numero_certificado = null

    const acM = name.match(acuseRe)
    const certM = name.match(certCleanRe)
    const isUuid = uuidRe.test(name)

    if (acM) {
      isAcuse = true
      numero_certificado = acM[1]
      year = acM[2]
      // Buscar el folio en el path (carpeta padre)
      const ctx = tryParseFromContext(f)
      if (ctx) folio = ctx.num
    } else if (certM) {
      isCert = true
      folio = certM[1].padStart(3, '0')
      year = certM[2]
    } else if (isUuid) {
      // UUID file: necesitamos el folio del path
      const ctx = tryParseFromContext(f)
      if (ctx) {
        folio = ctx.num
        year = ctx.year
        isCert = true
      } else {
        stats.no_folio++
        continue
      }
    } else {
      stats.ignored++
      continue
    }

    if (year !== '2026') {
      stats.no_2026++
      continue
    }

    if (!folio) {
      stats.no_folio++
      continue
    }

    // Filtrar carpetas "11. INFORME" — esos son informes, no certs
    if (f.includes('11. INFORME') || f.includes('11.INFORME')) {
      // El UIIE 139-2026.pdf en "11. INFORME" es el informe, NO el cert
      // Solo lo aceptamos si está en "12. OPE"
      stats.ignored++
      continue
    }

    const folioKey = `UIIE-${folio}-${year}`
    if (!byFolio.has(folioKey)) {
      byFolio.set(folioKey, {
        folio_candidates: [folioKey],
        numero_certificado: null,
        cert_file_path: null,
        acuse_file_path: null,
        fecha_emision: null,
        source_folder: f.replace(BASE, ''),
      })
    }
    const entry = byFolio.get(folioKey)
    let mtime = null
    try { mtime = statSync(f).mtime.toISOString().slice(0, 10) } catch {}

    if (isAcuse) {
      // Preferir el que esté en "12. OPE"
      if (!entry.acuse_file_path || f.includes('12. OPE') || f.includes('12.OPE')) {
        entry.acuse_file_path = f
        entry.numero_certificado = numero_certificado
        if (!entry.fecha_emision || (mtime && mtime > entry.fecha_emision)) entry.fecha_emision = mtime
      }
      stats.acuse++
    } else if (isCert || isUuid) {
      if (!entry.cert_file_path || f.includes('12. OPE') || f.includes('12.OPE')) {
        entry.cert_file_path = f
        if (!entry.fecha_emision || (mtime && mtime > entry.fecha_emision)) entry.fecha_emision = mtime
      }
      if (isCert) stats.cert++
      else stats.uuid++
    }
  }
}

console.log(`\n═══ Resumen ═══`)
console.log(`  PDFs totales:        ${stats.totalPdfs}`)
console.log(`  Cert files:          ${stats.cert}`)
console.log(`  Acuse files:         ${stats.acuse}`)
console.log(`  UUID files:          ${stats.uuid}`)
console.log(`  Ignorados:           ${stats.ignored}`)
console.log(`  Sin folio:           ${stats.no_folio}`)
console.log(`  No-2026:             ${stats.no_2026}`)
console.log(`  Folios únicos 2026:  ${byFolio.size}`)

const matches = [...byFolio.values()]
const conAmbos = matches.filter(m => m.cert_file_path && m.acuse_file_path).length
const soloAcuse = matches.filter(m => !m.cert_file_path && m.acuse_file_path).length
const soloCert  = matches.filter(m => m.cert_file_path && !m.acuse_file_path).length
console.log(`\n  Con cert+acuse:      ${conAmbos}`)
console.log(`  Solo acuse:          ${soloAcuse}`)
console.log(`  Solo cert:           ${soloCert}`)

writeFileSync('/tmp/cert-matches-inspectores.json', JSON.stringify(matches, null, 2))
console.log(`\nGuardado en /tmp/cert-matches-inspectores.json (${matches.length} folios)`)
