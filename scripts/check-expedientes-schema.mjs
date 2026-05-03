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

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Insert dummy y leer columnas, después rollback (en realidad solo leemos schema desde information_schema via RPC no disponible — usamos otra estrategia)
// Más fácil: inspect via Management API
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN

async function execSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/qmpkkicknpvqrnvygvab/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL ${res.status}: ${text}`)
  return JSON.parse(text)
}

const cols = await execSQL(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='expedientes'
  ORDER BY ordinal_position
`)

console.log(`expedientes (${cols.length} columnas):`)
for (const c of cols) {
  const def = c.column_default ? ` default ${c.column_default}` : ''
  console.log(`  ${c.column_name.padEnd(38)} ${c.data_type.padEnd(28)} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}${def}`)
}

console.log('\n\nsolicitudes_folio:')
const cols2 = await execSQL(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='solicitudes_folio'
  ORDER BY ordinal_position
`)
for (const c of cols2) {
  console.log(`  ${c.column_name.padEnd(38)} ${c.data_type.padEnd(28)} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`)
}
