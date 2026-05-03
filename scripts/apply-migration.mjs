// Aplica una migration SQL via Management API.
// Uso: node scripts/apply-migration.mjs <archivo.sql>
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const file = process.argv[2]
if (!file) { console.error('Uso: node scripts/apply-migration.mjs <archivo.sql>'); process.exit(1) }
const sql = readFileSync(file, 'utf8')

console.log(`Aplicando ${file} (${sql.length} chars)…\n`)

const res = await fetch(`https://api.supabase.com/v1/projects/qmpkkicknpvqrnvygvab/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) {
  console.error(`❌ ${res.status}:`, text)
  process.exit(1)
}
console.log('✓ Aplicado')
console.log(text.slice(0, 500))
