// Identifica clientes que probablemente son de prueba.
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

// 1. Clientes que tienen created_by no nulo (= creados desde la app, no importados)
const { data: conCreador } = await sb.from('clientes')
  .select('id, nombre, rfc, email, created_at, created_by')
  .not('created_by', 'is', null)
  .order('created_at', { ascending: false })

console.log(`\n═══ Clientes con created_by (creados desde la app) ═══`)
console.log(`Total: ${conCreador?.length ?? 0}\n`)

// 2. Cruza con la tabla usuarios para mostrar el email
const ids = [...new Set((conCreador ?? []).map(c => c.created_by).filter(Boolean))]
const { data: users } = ids.length
  ? await sb.from('usuarios').select('id, email').in('id', ids)
  : { data: [] }
const mapU = new Map((users ?? []).map(u => [u.id, u.email]))

for (const c of conCreador ?? []) {
  console.log(`  ${c.id}`)
  console.log(`    nombre: ${c.nombre}`)
  console.log(`    rfc:    ${c.rfc ?? '—'}`)
  console.log(`    email:  ${c.email ?? '—'}`)
  console.log(`    creado: ${c.created_at}`)
  console.log(`    por:    ${mapU.get(c.created_by) ?? c.created_by + ' (auth user, sin perfil)'}`)
  console.log()
}

// 3. Total general
const { count: total } = await sb.from('clientes').select('*', { count: 'exact', head: true })
console.log(`Total clientes en BD: ${total}`)
console.log(`  con created_by:  ${conCreador?.length ?? 0}`)
console.log(`  sin created_by:  ${(total ?? 0) - (conCreador?.length ?? 0)}`)
