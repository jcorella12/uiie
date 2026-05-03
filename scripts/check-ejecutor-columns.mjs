import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

async function execSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/qmpkkicknpvqrnvygvab/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return JSON.parse(await res.text())
}

const cols = await execSQL(`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema='public'
    AND column_name='inspector_ejecutor_id'
  ORDER BY table_name
`)
console.log('Tablas con inspector_ejecutor_id:')
for (const c of cols) console.log(`  ${c.table_name}`)
