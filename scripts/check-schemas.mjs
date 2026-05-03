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

for (const t of ['inspecciones_agenda', 'folios_lista_control', 'tabuladores']) {
  const cols = await execSQL(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='${t}'
    ORDER BY ordinal_position
  `)
  console.log(`\n${t} (${cols.length} columnas):`)
  for (const c of cols) {
    console.log(`  ${c.column_name.padEnd(38)} ${c.data_type.padEnd(28)} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`)
  }
}

// Enum de status de expedientes
const statuses = await execSQL(`
  SELECT t.typname, e.enumlabel
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname IN ('expediente_status','solicitud_status','tipo_persona','agenda_status')
  ORDER BY t.typname, e.enumsortorder
`)
console.log('\nEnums:')
let cur = null
for (const s of statuses) {
  if (cur !== s.typname) { cur = s.typname; console.log(`  ${cur}:`) }
  console.log(`    ${s.enumlabel}`)
}
