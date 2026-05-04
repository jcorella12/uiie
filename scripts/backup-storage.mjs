/**
 * Respaldo completo de los buckets de Supabase Storage a una carpeta local.
 *
 * Por default respalda los 2 buckets activos: `documentos` y `certificados-cne`.
 * Preserva la estructura de paths exactamente como está en el bucket.
 *
 * Idempotente: si ya descargaste antes y vuelves a correr, SALTA los archivos
 * que ya existen en disco con el mismo tamaño. Útil para reanudar si se
 * interrumpe.
 *
 * Uso:
 *   node scripts/backup-storage.mjs                          # default: ./backups/storage-<ts>
 *   node scripts/backup-storage.mjs /path/al/disco-externo
 *   node scripts/backup-storage.mjs --bucket documentos      # solo un bucket
 *   node scripts/backup-storage.mjs --resume <ruta>          # reanudar uno previo
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, createWriteStream } from 'fs'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { dirname, join, resolve as pathResolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let onlyBucket = null
let destPath = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bucket' && args[i+1]) { onlyBucket = args[++i]; continue }
  if (args[i] === '--resume' && args[i+1]) { destPath = pathResolve(args[++i]); continue }
  if (!destPath) destPath = pathResolve(args[i])
}
const ALL_BUCKETS = ['documentos', 'certificados-cne']
const BUCKETS = onlyBucket ? [onlyBucket] : ALL_BUCKETS

if (!destPath) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  destPath = pathResolve(__dirname, '..', 'backups', `storage-${ts}`)
}
mkdirSync(destPath, { recursive: true })
console.log(`Respaldando a: ${destPath}\n`)

// ─── Listing recursivo ──────────────────────────────────────────────────────
async function listAll(bucket) {
  const out = []
  const stack = ['']
  while (stack.length) {
    const cur = stack.pop()
    let offset = 0
    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(cur, {
        limit: 1000, offset, sortBy: { column: 'name', order: 'asc' },
      })
      if (error) {
        console.warn(`  ⚠ list error en ${bucket}/${cur}: ${error.message}`)
        break
      }
      if (!data || data.length === 0) break
      for (const item of data) {
        const fullPath = cur ? `${cur}/${item.name}` : item.name
        if (item.id == null) {
          stack.push(fullPath)        // carpeta virtual
        } else {
          out.push({ path: fullPath, size: item.metadata?.size ?? null })
        }
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  return out
}

// ─── Bajar un archivo ────────────────────────────────────────────────────────
async function downloadOne(bucket, remotePath, localFull, expectedSize) {
  // Skip si ya existe con el tamaño correcto (resume)
  if (existsSync(localFull)) {
    const s = statSync(localFull)
    if (expectedSize == null || s.size === expectedSize) return 'skipped'
  }
  mkdirSync(dirname(localFull), { recursive: true })
  const { data, error } = await sb.storage.from(bucket).download(remotePath)
  if (error) throw new Error(error.message)
  if (!data) throw new Error('empty download')
  // data es un Blob — convertir a Buffer
  const buf = Buffer.from(await data.arrayBuffer())
  writeFileSync(localFull, buf)
  return 'downloaded'
}

// ─── Main ────────────────────────────────────────────────────────────────────
const totalStats = { ok: 0, skipped: 0, errors: 0, bytes: 0 }
const meta = { timestamp: new Date().toISOString(), buckets: {} }

for (const bucket of BUCKETS) {
  console.log(`\n📦 Bucket "${bucket}"`)
  const files = await listAll(bucket)
  console.log(`   Listados: ${files.length} archivos`)

  const bDir = join(destPath, bucket)
  mkdirSync(bDir, { recursive: true })

  let ok = 0, skipped = 0, errors = 0, bytes = 0
  let i = 0
  for (const f of files) {
    i++
    const localFull = join(bDir, f.path)
    try {
      const result = await downloadOne(bucket, f.path, localFull, f.size)
      if (result === 'skipped') skipped++
      else { ok++; bytes += f.size ?? 0 }
    } catch (e) {
      errors++
      console.warn(`   ⚠ ${f.path}: ${e.message}`)
    }
    if (i % 25 === 0 || i === files.length) {
      const mb = (bytes / 1024 / 1024).toFixed(1)
      process.stdout.write(`   ${i}/${files.length} (✓${ok} ⊝${skipped} ❌${errors}) — ${mb} MB\r`)
    }
  }
  console.log() // newline after progress
  meta.buckets[bucket] = { total: files.length, ok, skipped, errors, bytes }
  totalStats.ok += ok
  totalStats.skipped += skipped
  totalStats.errors += errors
  totalStats.bytes += bytes
}

writeFileSync(join(destPath, '_meta.json'), JSON.stringify(meta, null, 2))

const totalMB = (totalStats.bytes / 1024 / 1024).toFixed(1)
console.log(`\n═══ Resumen ═══`)
console.log(`  Descargados:  ${totalStats.ok}`)
console.log(`  Saltados:     ${totalStats.skipped}  (ya existían con mismo tamaño)`)
console.log(`  Errores:      ${totalStats.errors}`)
console.log(`  Tamaño total: ${totalMB} MB`)
console.log(`\n✅ Respaldo en: ${destPath}`)
