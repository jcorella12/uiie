import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
async function execSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/qmpkkicknpvqrnvygvab/database/query`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return JSON.parse(await res.text())
}
for (const t of ['documentos_expediente', 'certificados_cre']) {
  const cols = await execSQL(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' ORDER BY ordinal_position`)
  console.log(`\n${t}:`)
  for (const c of cols) console.log(`  ${c.column_name.padEnd(34)} ${c.data_type.padEnd(28)} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`)
}
