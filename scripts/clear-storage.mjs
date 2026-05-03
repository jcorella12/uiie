// Borra TODOS los archivos de los buckets documentos y certificados-cne.
// Uso: node scripts/clear-storage.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan credenciales en .env.local')
  process.exit(1)
}

const sb = createClient(url, key)
const BUCKETS = ['documentos', 'certificados-cne']

async function listAllPaths(bucket, prefix = '') {
  const all = []
  const stack = [prefix]
  while (stack.length) {
    const cur = stack.pop()
    let offset = 0
    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(cur, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) {
        console.error(`  ⚠ list error en ${bucket}/${cur}: ${error.message}`)
        break
      }
      if (!data || data.length === 0) break
      for (const item of data) {
        const fullPath = cur ? `${cur}/${item.name}` : item.name
        // Carpetas virtuales no tienen `id`
        if (item.id == null) stack.push(fullPath)
        else all.push(fullPath)
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  return all
}

async function clearBucket(bucket) {
  console.log(`\n📦 Bucket "${bucket}":`)
  const paths = await listAllPaths(bucket)
  if (paths.length === 0) {
    console.log('  ✓ Ya está vacío')
    return { borrados: 0 }
  }
  console.log(`  Encontrados ${paths.length} archivos. Borrando…`)

  let borrados = 0
  for (let i = 0; i < paths.length; i += 500) {
    const chunk = paths.slice(i, i + 500)
    const { data, error } = await sb.storage.from(bucket).remove(chunk)
    if (error) {
      console.error(`  ⚠ Error borrando lote ${i}-${i + chunk.length}: ${error.message}`)
    } else {
      borrados += data?.length ?? chunk.length
      process.stdout.write(`  Progreso: ${borrados}/${paths.length}\r`)
    }
  }
  console.log(`\n  ✓ ${borrados} archivos borrados`)
  return { borrados }
}

let total = 0
for (const b of BUCKETS) {
  const { borrados } = await clearBucket(b)
  total += borrados
}
console.log(`\n✅ Listo — total: ${total} archivos borrados de ${BUCKETS.length} buckets.`)
