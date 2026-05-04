// Solo lista — no descarga. Para estimar tamaño antes de respaldar.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function listAll(bucket) {
  const out = []
  const stack = ['']
  while (stack.length) {
    const cur = stack.pop()
    let offset = 0
    while (true) {
      const { data } = await sb.storage.from(bucket).list(cur, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
      if (!data || data.length === 0) break
      for (const item of data) {
        const p = cur ? `${cur}/${item.name}` : item.name
        if (item.id == null) stack.push(p)
        else out.push({ path: p, size: item.metadata?.size ?? 0 })
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  return out
}

let total = 0
for (const b of ['documentos', 'certificados-cne']) {
  const files = await listAll(b)
  const bytes = files.reduce((s, f) => s + (f.size ?? 0), 0)
  total += bytes
  console.log(`${b.padEnd(20)} ${String(files.length).padStart(5)} archivos  ${(bytes/1024/1024).toFixed(1).padStart(8)} MB`)
}
console.log(`${'TOTAL'.padEnd(20)} ${' '.repeat(5)}             ${(total/1024/1024).toFixed(1).padStart(8)} MB`)
