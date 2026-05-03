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
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL ${res.status}: ${text}`)
  return JSON.parse(text)
}

// Todos los enums del schema public
const r = await execSQL(`
  SELECT t.typname, e.enumlabel
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder
`)
let cur = null
for (const row of r) {
  if (cur !== row.typname) { cur = row.typname; console.log(`\n${cur}:`) }
  console.log(`  ${row.enumlabel}`)
}

// Tipo del status de inspecciones_agenda
const r2 = await execSQL(`
  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod) AS type
  FROM pg_attribute a
  JOIN pg_class c ON a.attrelid = c.oid
  WHERE c.relname='inspecciones_agenda' AND a.attname='status'
`)
console.log('\ninspecciones_agenda.status type:', r2[0]?.type)
