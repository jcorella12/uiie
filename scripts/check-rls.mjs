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
  const r = await fetch(`https://api.supabase.com/v1/projects/qmpkkicknpvqrnvygvab/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return JSON.parse(await r.text())
}

const t = process.argv[2] ?? 'testigos'
const r = await execSQL(`
  SELECT policyname, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname='public' AND tablename='${t}'
  ORDER BY policyname
`)
console.log(`Policies en ${t}:`)
for (const p of r) {
  console.log(`\n  ${p.policyname} (${p.cmd})`)
  if (p.qual)       console.log(`    USING:      ${p.qual}`)
  if (p.with_check) console.log(`    WITH CHECK: ${p.with_check}`)
}
