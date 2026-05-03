/**
 * Sube cert + acuse al bucket certificados-cne, crea fila en certificados_cre,
 * inserta en documentos_expediente y actualiza expedientes.numero_certificado.
 *
 * Lee /tmp/cert-matches.json producido por survey-certificates.mjs.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const inputFile = process.argv[2] ?? '/tmp/cert-matches.json'
console.log(`Leyendo de: ${inputFile}`)
const matches = JSON.parse(readFileSync(inputFile, 'utf8'))
const BUCKET = 'certificados-cne'

// Cargar todos los expedientes para hacer lookup rápido
const { data: expedientes } = await sb.from('expedientes').select('id, numero_folio, inspector_id')
const expByFolio = new Map(expedientes.map(e => [e.numero_folio, e]))

// Cargar certificados ya insertados (idempotencia)
const { data: certsExist } = await sb.from('certificados_cre').select('numero_certificado, expediente_id')
const certsByNum = new Map(certsExist.map(c => [c.numero_certificado, c]))

console.log(`═══ Subiendo certificados ═══`)
console.log(`  Matches a procesar: ${matches.length}`)
console.log(`  Ya en BD:           ${certsExist.length}`)

const stats = { uploaded: 0, skipped: 0, errors: 0, sinExpediente: 0 }
const errors = []

for (let i = 0; i < matches.length; i++) {
  const m = matches[i]
  const progress = `[${i+1}/${matches.length}]`

  // Match al expediente
  let exp = null
  for (const folio of m.folio_candidates) {
    if (expByFolio.has(folio)) { exp = expByFolio.get(folio); break }
  }
  if (!exp) {
    stats.sinExpediente++
    errors.push(`${progress} ${m.folder}: sin expediente para ${m.folio_candidates.join('/')}`)
    continue
  }

  // Saltar si ya existe
  if (m.numero_certificado && certsByNum.has(m.numero_certificado)) {
    stats.skipped++
    continue
  }

  try {
    // Subir cert
    let storage_path_cert = null
    let storage_path_acuse = null

    if (m.cert_file_path) {
      const buf = readFileSync(m.cert_file_path)
      const path = `cert/${exp.id}/${m.numero_certificado ?? crypto.randomBytes(8).toString('hex')}.pdf`
      const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
        contentType: 'application/pdf', upsert: true,
      })
      if (error) throw new Error(`upload cert: ${error.message}`)
      storage_path_cert = path
    }

    if (m.acuse_file_path) {
      const buf = readFileSync(m.acuse_file_path)
      const path = `acuse/${exp.id}/${m.numero_certificado ?? crypto.randomBytes(8).toString('hex')}.pdf`
      const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
        contentType: 'application/pdf', upsert: true,
      })
      if (error) throw new Error(`upload acuse: ${error.message}`)
      storage_path_acuse = path
    }

    // Crear URLs firmadas (10 años)
    const expSegs = 60 * 60 * 24 * 365 * 10
    let url_cre = null, url_acuse = null
    if (storage_path_cert) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(storage_path_cert, expSegs)
      url_cre = data?.signedUrl ?? null
    }
    if (storage_path_acuse) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrl(storage_path_acuse, expSegs)
      url_acuse = data?.signedUrl ?? null
    }

    // Insertar certificados_cre
    if (m.numero_certificado) {
      const { error: errCre } = await sb.from('certificados_cre').insert({
        numero_certificado: m.numero_certificado,
        titulo: `Certificado ${m.numero_certificado}`,
        url_cre: url_cre ?? '',
        url_acuse,
        fecha_emision: m.fecha_emision,
        expediente_id: exp.id,
        storage_path_cert,
        storage_path_acuse,
        created_by: exp.inspector_id,
      })
      if (errCre && !errCre.message.includes('duplicate')) throw new Error(`certificados_cre: ${errCre.message}`)
    }

    // Insertar documentos_expediente para cert
    if (storage_path_cert) {
      const certName = m.cert_file_path ? basename(m.cert_file_path) : `${m.numero_certificado}.pdf`
      let tamano = null
      try { tamano = statSync(m.cert_file_path).size } catch {}
      await sb.from('documentos_expediente').insert({
        expediente_id: exp.id,
        tipo: 'certificado_cre',
        nombre: certName,
        storage_path: storage_path_cert,
        mime_type: 'application/pdf',
        tamano_bytes: tamano,
        verificado: true,
        subido_por: exp.inspector_id,
        subido_por_cliente: false,
      })
    }

    // Insertar documentos_expediente para acuse
    if (storage_path_acuse) {
      const acuseName = m.acuse_file_path ? basename(m.acuse_file_path) : `Acuse ${m.numero_certificado}.pdf`
      let tamano = null
      try { tamano = statSync(m.acuse_file_path).size } catch {}
      await sb.from('documentos_expediente').insert({
        expediente_id: exp.id,
        tipo: 'acuse_cre',
        nombre: acuseName,
        storage_path: storage_path_acuse,
        mime_type: 'application/pdf',
        tamano_bytes: tamano,
        verificado: true,
        subido_por: exp.inspector_id,
        subido_por_cliente: false,
      })
    }

    // Actualizar expediente con número y fecha de certificado
    await sb.from('expedientes').update({
      numero_certificado: m.numero_certificado,
      fecha_emision_certificado: m.fecha_emision,
    }).eq('id', exp.id)

    stats.uploaded++
    if (stats.uploaded % 10 === 0) console.log(`  ${stats.uploaded} subidos…`)
  } catch (e) {
    stats.errors++
    errors.push(`${progress} ${m.folder} (${m.folio_candidates[0]}): ${e.message}`)
  }
}

console.log(`\n═══ Resumen ═══`)
console.log(`  Subidos:             ${stats.uploaded}`)
console.log(`  Saltados (ya):       ${stats.skipped}`)
console.log(`  Sin expediente:      ${stats.sinExpediente}`)
console.log(`  Errores:             ${stats.errors}`)

if (errors.length > 0) {
  console.log(`\n  Errores (primeros 15):`)
  for (const e of errors.slice(0, 15)) console.log(`    ${e}`)
}

// Verificación
const { count: nCerts } = await sb.from('certificados_cre').select('*', { count: 'exact', head: true })
const { count: nDocs } = await sb.from('documentos_expediente').select('*', { count: 'exact', head: true })
const { count: nExpConCert } = await sb.from('expedientes')
  .select('*', { count: 'exact', head: true })
  .not('numero_certificado', 'is', null)

console.log(`\n  En BD:`)
console.log(`    certificados_cre:        ${nCerts}`)
console.log(`    documentos_expediente:   ${nDocs}`)
console.log(`    expedientes con cert:    ${nExpConCert}`)
