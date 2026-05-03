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

const { data } = await sb.from('folios_lista_control').select('numero_folio, asignado, numero_secuencial')
const byYear = {}
for (const f of data) {
  const y = f.numero_folio.split('-').pop()
  if (!byYear[y]) byYear[y] = { total: 0, asignados: 0, libres: 0, max: 0, min: Infinity }
  byYear[y].total++
  if (f.asignado) byYear[y].asignados++
  else byYear[y].libres++
  if (f.numero_secuencial > byYear[y].max) byYear[y].max = f.numero_secuencial
  if (f.numero_secuencial < byYear[y].min) byYear[y].min = f.numero_secuencial
}

for (const [y, s] of Object.entries(byYear).sort()) {
  console.log(`${y}: total=${s.total}, asignados=${s.asignados}, libres=${s.libres}, rango=${s.min}-${s.max}`)
}
