/**
 * Limpieza final consolidada:
 *  1. Borra los 2 clientes de prueba (pse, ciae)
 *  2. Limpia clientes.created_by para los 3 huérfanos viejos
 *  3. Re-crea edgar y pedro como directorio sin acceso
 *  4. Borra completamente inspector@iisac.mx, responsable@iisac.mx, admin@iisac.mx
 *  5. Verifica estado final
 *
 * Uso: node scripts/cleanup-final.mjs
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

// Emails de huérfanos viejos a borrar completamente
const HUERFANOS = ['inspector@iisac.mx', 'responsable@iisac.mx', 'admin@iisac.mx']

async function findUserByEmail(email) {
  const { data } = await sb.from('usuarios').select('id').ilike('email', email).maybeSingle()
  if (data) return data.id
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

// ─── 1. Borrar todos los clientes con created_by (todos creados durante pruebas)
console.log('═══ 1. Borrando clientes de prueba (con created_by) ═══')
const { data: clientesPrueba } = await sb.from('clientes')
  .select('id, nombre')
  .not('created_by', 'is', null)

console.log(`  Encontrados: ${clientesPrueba?.length ?? 0}`)
for (const c of clientesPrueba ?? []) {
  const { error } = await sb.from('clientes').delete().eq('id', c.id)
  if (error) console.log(`  ❌ ${c.nombre}: ${error.message}`)
  else      console.log(`  ✓ ${c.nombre}`)
}

// ─── 2. Identificar huérfanos (ya no debería haber refs en clientes) ──────────
console.log('\n═══ 2. Verificando que no queden refs en clientes ═══')
const idsHuerfanos = []
for (const email of HUERFANOS) {
  const id = await findUserByEmail(email)
  if (!id) { console.log(`  ⚠ ${email} no existe`); continue }
  idsHuerfanos.push({ email, id })
}

if (idsHuerfanos.length > 0) {
  const ids = idsHuerfanos.map(x => x.id)
  const { count } = await sb.from('clientes')
    .select('*', { count: 'exact', head: true })
    .in('created_by', ids)
  console.log(`  Clientes que aún referencian a huérfanos: ${count ?? 0}`)
  // Por si queda alguno (no debería tras step 1), limpiarlo
  if ((count ?? 0) > 0) {
    await sb.from('clientes').update({ created_by: null }).in('created_by', ids)
    console.log('  ✓ Limpiado')
  }
}

// ─── 3. Re-crear edgar y pedro (directorio sin acceso) ────────────────────────
console.log('\n═══ 3. Re-crear edgar y pedro ═══')
try {
  await upsertDirectoryUser({ email: 'edgar@uiie.com.mx', nombre: 'Edgar Eduardo', apellidos: 'Luna García' })
  console.log('  ✓ edgar@uiie.com.mx')
} catch (e) { console.log(`  ❌ edgar: ${e.message}`) }

try {
  await upsertDirectoryUser({ email: 'pedro@uiie.com.mx', nombre: 'Pedro Gerónimo', apellidos: 'León Valles' })
  console.log('  ✓ pedro@uiie.com.mx')
} catch (e) { console.log(`  ❌ pedro: ${e.message}`) }

// ─── 4. Borrar huérfanos completamente ────────────────────────────────────────
console.log('\n═══ 4. Borrando huérfanos completamente ═══')
for (const { email, id } of idsHuerfanos) {
  const { error: errDb } = await sb.from('usuarios').delete().eq('id', id)
  if (errDb) {
    console.log(`  ❌ ${email} (perfil): ${errDb.message}`)
    continue
  }
  const { error: errAuth } = await sb.auth.admin.deleteUser(id)
  if (errAuth) console.log(`  ⚠ ${email}: perfil borrado, auth: ${errAuth.message}`)
  else        console.log(`  ✓ ${email} borrado completamente`)
}

// ─── 5. Verificación ──────────────────────────────────────────────────────────
console.log('\n═══ 5. Estado final ═══')
const { data: usuarios } = await sb.from('usuarios')
  .select('email, nombre, apellidos, rol, activo')
  .order('activo', { ascending: false })
  .order('rol').order('email')

console.log('\nUsuarios:')
for (const u of usuarios ?? []) {
  const s = u.activo ? '✓' : '✗'
  console.log(`  ${s}  ${(u.email ?? '').padEnd(32)} ${(u.rol ?? '').padEnd(22)} ${u.nombre ?? ''} ${u.apellidos ?? ''}`)
}

const { count: nClientes } = await sb.from('clientes').select('*', { count: 'exact', head: true })
const { count: nExpedientes } = await sb.from('expedientes').select('*', { count: 'exact', head: true })
const { count: nSolicitudes } = await sb.from('solicitudes_folio').select('*', { count: 'exact', head: true })

console.log(`\n  Clientes:    ${nClientes}`)
console.log(`  Expedientes: ${nExpedientes}`)
console.log(`  Solicitudes: ${nSolicitudes}`)
console.log('\n✅ Listo')
