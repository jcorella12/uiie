/**
 * Recorre las carpetas de Inspecciones 2026-2027 y mapea cada folio
 * a sus archivos de certificado/acuse. Búsqueda recursiva en toda la carpeta
 * (no solo "12. OPE").
 */
import { readdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

const BASE = '/Users/joaquincorella/Library/CloudStorage/GoogleDrive-corella12@gmail.com/Mi unidad/1. CIAE/4. UIIE/Inspecciones 2026 - 2027'

function listAllFiles(dir, depth = 0) {
  const out = []
  if (depth > 6) return out  // safety
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name === 'Icon' || e.name.startsWith('.')) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...listAllFiles(full, depth + 1))
    else if (e.isFile()) out.push(full)
  }
  return out
}

const folders = readdirSync(BASE, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'Icon' && !e.name.startsWith('.'))
  .map(e => e.name)

console.log(`Encontradas ${folders.length} carpetas\n`)

const folderFolioRe = /^Inspecci[oó]n\s*(\d{2,4})/i
const acuseRe = /OPE\s*-\s*Acuse\s+(UIIE-CC-\d+-\d{4})\.pdf$/i
const certCleanRe = /^UIIE\s+(\d+-\d{4})\.pdf$/i
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i

const stats = { conCert: 0, conAcuse: 0, soloUUID: 0, sinNada: 0, malFormato: 0 }
const matches = []

for (const folder of folders) {
  const m = folder.match(folderFolioRe)
  if (!m) {
    stats.malFormato++
    console.log(`  ⚠ formato raro: "${folder}"`)
    continue
  }
  const folioNum = m[1].padStart(3, '0')
  const folioCandidates = [`UIIE-${folioNum}-2026`, `UIIE-${folioNum}-2025`]

  const allFiles = listAllFiles(join(BASE, folder))

  // Filtrar a archivos relevantes (cert/acuse) — preferir los que están en "12. OPE/"
  let acuseFile = null
  let certCleanFile = null
  let certUuidFile = null

  for (const f of allFiles) {
    const base = f.split('/').pop()
    if (acuseRe.test(base)) {
      // Preferir el que esté en una ruta con "12. OPE"
      if (!acuseFile || f.includes('12. OPE') || f.includes('12.OPE')) acuseFile = f
    } else if (certCleanRe.test(base)) {
      if (!certCleanFile || f.includes('12. OPE') || f.includes('12.OPE')) certCleanFile = f
    } else if (uuidRe.test(base)) {
      if (!certUuidFile || f.includes('12. OPE') || f.includes('12.OPE')) certUuidFile = f
    }
  }

  if (!acuseFile && !certCleanFile && !certUuidFile) {
    stats.sinNada++
    console.log(`  📂 ${folder}: sin cert ni acuse`)
    continue
  }

  const acuseMatch = acuseFile?.split('/').pop().match(acuseRe)
  const numero_certificado = acuseMatch ? acuseMatch[1] : null

  const certFile = certCleanFile ?? certUuidFile

  if (certFile && acuseFile) stats.conCert++
  if (acuseFile) stats.conAcuse++
  if (!certFile && acuseFile) stats.soloUUID++

  let fechaCert = null
  const refFile = certFile ?? acuseFile
  if (refFile) {
    try { fechaCert = statSync(refFile).mtime.toISOString().slice(0, 10) } catch {}
  }

  matches.push({
    folder,
    folio_candidates: folioCandidates,
    numero_certificado,
    cert_file_path: certFile,
    acuse_file_path: acuseFile,
    fecha_emision: fechaCert,
  })
}

console.log('\n═══ Resumen ═══')
console.log(`  Con cert+acuse:  ${stats.conCert}`)
console.log(`  Con acuse:       ${stats.conAcuse}`)
console.log(`  Solo UUID/cert:  ${stats.soloUUID}`)
console.log(`  Sin archivos:    ${stats.sinNada}`)
console.log(`  Formato raro:    ${stats.malFormato}`)
console.log(`  Mapeados:        ${matches.length}`)

writeFileSync('/tmp/cert-matches.json', JSON.stringify(matches, null, 2))
console.log(`\nGuardado en /tmp/cert-matches.json (${matches.length} matches)`)
