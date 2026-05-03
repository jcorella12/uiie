/**
 * Borra los 2 usuarios con rol=cliente huérfanos (sus clientes ya no existen).
 */
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

const { data: clienteUsers } = await sb.from('usuarios')
  .select('id, email, nombre')
  .eq('rol', 'cliente')

console.log(`Encontrados ${clienteUsers?.length ?? 0} usuarios con rol=cliente:\n`)

for (const u of clienteUsers ?? []) {
  console.log(`  ${u.email} (${u.nombre ?? '—'})`)
  const { error: errDb } = await sb.from('usuarios').delete().eq('id', u.id)
  if (errDb) {
    console.log(`    ❌ perfil: ${errDb.message}`)
    continue
  }
  const { error: errAuth } = await sb.auth.admin.deleteUser(u.id)
  if (errAuth) console.log(`    ⚠ perfil borrado, auth: ${errAuth.message}`)
  else        console.log(`    ✓ borrado completamente`)
}

// Verificación
const { data: final } = await sb.from('usuarios')
  .select('email, nombre, apellidos, rol, activo')
  .order('activo', { ascending: false })
  .order('rol').order('email')

console.log('\n═══ Estado final de usuarios ═══')
for (const u of final ?? []) {
  const s = u.activo ? '✓' : '✗'
  console.log(`  ${s}  ${(u.email ?? '').padEnd(32)} ${(u.rol ?? '').padEnd(22)} ${u.nombre ?? ''} ${u.apellidos ?? ''}`)
}
