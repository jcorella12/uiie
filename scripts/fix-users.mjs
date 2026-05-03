/**
 * Repara:
 * 1. Re-crea edgar@uiie.com.mx y pedro@uiie.com.mx (directorio sin acceso)
 * 2. Limpia clientes.created_by para los 3 usuarios huérfanos viejos
 * 3. Borra los 3 usuarios huérfanos completamente
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  const { data } = await sb.from('usuarios').select('id').ilike('email', email).maybeSingle()
  if (data) return data.id
  // Fallback en auth
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const u = list?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  return u?.id ?? null
}

async function upsertDirectoryUser({ email, nombre, apellidos }) {
  let userId = await findUserByEmail(email)
  if (!userId) {
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      password: crypto.randomBytes(32).toString('hex'),
      email_confirm: true,
      user_metadata: { nombre, apellidos, rol: 'inspector', directorio_solo: true },
    })
    if (error || !created?.user) throw new Error(`auth: ${error?.message}`)
    userId = created.user.id
  }
  const payload = { id: userId, email, nombre, apellidos, rol: 'inspector', activo: false }
  const { error: errIns } = await sb.from('usuarios').insert(payload)
  if (errIns && errIns.code === '23505') {
    await sb.from('usuarios').update({ email, nombre, apellidos, rol: 'inspector', activo: false }).eq('id', userId)
  } else if (errIns) {
    throw new Error(`db: ${errIns.message}`)
  }
  return userId
}

console.log('═══ 1. Re-crear edgar y pedro (directorio sin acceso) ═══')
try {
  await upsertDirectoryUser({ email: 'edgar@uiie.com.mx', nombre: 'Edgar Eduardo', apellidos: 'Luna García' })
  console.log('  ✓ edgar@uiie.com.mx')
} catch (e) { console.log(`  ❌ edgar: ${e.message}`) }

try {
  await upsertDirectoryUser({ email: 'pedro@uiie.com.mx', nombre: 'Pedro Gerónimo', apellidos: 'León Valles' })
  console.log('  ✓ pedro@uiie.com.mx')
} catch (e) { console.log(`  ❌ pedro: ${e.message}`) }

console.log('\n═══ 2. Limpiar refs en clientes.created_by para huérfanos viejos ═══')
const HUERFANOS = ['inspector@iisac.mx', 'responsable@iisac.mx', 'admin@iisac.mx']
const idsAQuitar = []
for (const email of HUERFANOS) {
  const id = await findUserByEmail(email)
  if (!id) { console.log(`  ⚠ ${email} no existe`); continue }
  idsAQuitar.push({ email, id })
}

if (idsAQuitar.length > 0) {
  const ids = idsAQuitar.map(x => x.id)
  // Set created_by = null para clientes creados por estos usuarios
  const { count, error } = await sb.from('clientes')
    .update({ created_by: null })
    .in('created_by', ids)
    .select('*', { count: 'exact', head: true })
  if (error) console.log(`  ❌ limpiar clientes.created_by: ${error.message}`)
  else console.log(`  ✓ ${count ?? 0} clientes ya no referencian a estos usuarios`)
}

console.log('\n═══ 3. Borrar huérfanos viejos ═══')
for (const { email, id } of idsAQuitar) {
  const { error: errDb } = await sb.from('usuarios').delete().eq('id', id)
  if (errDb) {
    console.log(`  ❌ ${email}: ${errDb.message}`)
    // Listar todas las FK que puedan estar bloqueando
    continue
  }
  const { error: errAuth } = await sb.auth.admin.deleteUser(id)
  if (errAuth) console.log(`  ⚠ ${email}: perfil borrado pero auth: ${errAuth.message}`)
  else console.log(`  ✓ ${email} borrado completamente`)
}

// Verificación final
const { data: final } = await sb.from('usuarios')
  .select('email, nombre, apellidos, rol, activo')
  .order('activo', { ascending: false })
  .order('rol').order('email')

console.log('\n═══ Estado final ═══')
for (const u of final ?? []) {
  const s = u.activo ? '✓' : '✗'
  console.log(`  ${s}  ${(u.email ?? '').padEnd(32)} ${(u.rol ?? '').padEnd(22)} ${u.nombre ?? ''} ${u.apellidos ?? ''}`)
}
