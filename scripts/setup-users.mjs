/**
 * Setup de usuarios — UIIE/CRE/021 (Unidad de Inspección 21)
 *
 * 1. Cambia emails de inspectores existentes (mantiene UUID y password)
 * 2. Promueve joaquin@ciae.com.mx → inspector_responsable
 * 3. Crea joaquin@uiie.com.mx (nuevo inspector activo, password temporal)
 * 4. Agrega 2 inspectores del directorio CNE sin acceso (activo=false):
 *    - Edgar Eduardo Luna García (Inspector Responsable Sustituto)
 *    - Pedro Gerónimo León Valles (Inspector)
 * 5. Desactiva cuentas huérfanas que no están en la lista
 *
 * Uso: node scripts/setup-users.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Plan ────────────────────────────────────────────────────────────────────

const RENAMES = [
  { from: 'aldo.ramirez@ciae.mx',         to: 'aldo@uiie.com.mx',        nombre: 'Aldo',            apellidos: 'Ramírez Montoya' },
  { from: 'jesus.rodriguez@ciae.mx',      to: 'jesus.deita@uiie.com.mx', nombre: 'Jesús Antonio',   apellidos: 'Rodríguez de Ita' },
  { from: 'luis.martinez@ciae.mx',        to: 'luisf@uiie.com.mx',       nombre: 'Luis Felipe',     apellidos: 'Martínez Cerda' },
  { from: 'eduardo.montelongo@ciae.mx',   to: 'montelongo@uiie.com.mx',  nombre: 'Eduardo',         apellidos: 'Montelongo Moral' },
  { from: 'hugo.diaz@ciae.mx',            to: 'hugo@uiie.com.mx',        nombre: 'Hugo',            apellidos: 'Díaz García' },
  { from: 'erick.aguirre@ciae.mx',        to: 'erick@uiie.com.mx',       nombre: 'Erick Andrés',    apellidos: 'Aguirre Prieto' },
  { from: 'efraim.castellanos@ciae.mx',   to: 'efraim@uiie.com.mx',      nombre: 'Efraím',          apellidos: 'Castellanos Frayre' },
]

const PROMOTE_TO_RESPONSABLE = 'joaquin@ciae.com.mx'

const NEW_USERS_ACTIVE = [
  { email: 'joaquin@uiie.com.mx', nombre: 'Joaquín', apellidos: 'Corella Puente', rol: 'inspector' },
]

// Estos no tienen acceso (activo = false) pero existen en el directorio
const NEW_USERS_DIRECTORY_ONLY = [
  { email: 'edgar@uiie.com.mx', nombre: 'Edgar Eduardo', apellidos: 'Luna García',   rol: 'inspector' },
  { email: 'pedro@uiie.com.mx', nombre: 'Pedro Gerónimo', apellidos: 'León Valles',  rol: 'inspector' },
]

const DEACTIVATE = [
  'inspector@iisac.mx',
  'joaquin.corella@ciae.mx',
  'responsable@iisac.mx',
  'admin@iisac.mx',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tempPassword() {
  // Genera contraseña random segura
  return 'TMP-' + crypto.randomBytes(8).toString('hex').toUpperCase()
}

async function findUserByEmail(email) {
  // Buscar en tabla usuarios primero (más rápido)
  const { data } = await sb.from('usuarios').select('id, email, rol').ilike('email', email).maybeSingle()
  if (data) return data
  // Fallback: listar auth.users
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const u = list?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  return u ? { id: u.id, email: u.email, rol: null } : null
}

// ─── Ejecutar ────────────────────────────────────────────────────────────────

const tempPasswords = []  // las pasamos al usuario al final
const errors = []

console.log('\n═══ 1. Cambiar emails de inspectores existentes ═══')
for (const r of RENAMES) {
  const u = await findUserByEmail(r.from)
  if (!u) {
    console.log(`  ⚠ ${r.from} no encontrado — skip`)
    continue
  }
  // Update auth email
  const { error: errAuth } = await sb.auth.admin.updateUserById(u.id, { email: r.to, email_confirm: true })
  if (errAuth) { errors.push(`auth ${r.from} → ${r.to}: ${errAuth.message}`); console.log(`  ❌ ${r.from} auth: ${errAuth.message}`); continue }
  // Update profile
  const { error: errDb } = await sb.from('usuarios').update({
    email: r.to, nombre: r.nombre, apellidos: r.apellidos, activo: true,
  }).eq('id', u.id)
  if (errDb) { errors.push(`db ${r.from} → ${r.to}: ${errDb.message}`); console.log(`  ❌ ${r.from} db: ${errDb.message}`); continue }
  console.log(`  ✓ ${r.from} → ${r.to}`)
}

console.log('\n═══ 2. Promover a inspector_responsable ═══')
{
  const u = await findUserByEmail(PROMOTE_TO_RESPONSABLE)
  if (u) {
    const { error } = await sb.from('usuarios').update({
      rol: 'inspector_responsable',
      nombre: 'Joaquín',
      apellidos: 'Corella Puente',
    }).eq('id', u.id)
    if (error) { errors.push(`promote ${PROMOTE_TO_RESPONSABLE}: ${error.message}`); console.log(`  ❌ ${error.message}`) }
    else console.log(`  ✓ ${PROMOTE_TO_RESPONSABLE} → inspector_responsable`)
  } else {
    console.log(`  ⚠ ${PROMOTE_TO_RESPONSABLE} no encontrado — skip`)
  }
}

// Helper: crear (o actualizar si ya existe por trigger) un usuario completo
async function upsertUser({ email, password, nombre, apellidos, rol, activo, debeCambiarPassword }) {
  const exists = await findUserByEmail(email)
  let userId = exists?.id ?? null

  if (!userId) {
    // Crear en auth — un trigger puede auto-crear la fila en usuarios
    const { data: created, error: errAuth } = await sb.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nombre, apellidos, rol },
    })
    if (errAuth || !created?.user) {
      return { error: errAuth?.message ?? 'no user returned' }
    }
    userId = created.user.id
  }

  // Asegurar que la fila exista en usuarios — primero intenta INSERT, si choca el pkey hace UPDATE
  const payload = {
    id: userId, email, nombre, apellidos, rol, activo,
    ...(debeCambiarPassword ? { debe_cambiar_password: true } : {}),
  }
  const { error: errIns } = await sb.from('usuarios').insert(payload)
  if (errIns) {
    // Probable: trigger ya creó la fila → UPDATE
    if (errIns.message.includes('duplicate') || errIns.code === '23505') {
      const { error: errUpd } = await sb.from('usuarios').update({
        email, nombre, apellidos, rol, activo,
        ...(debeCambiarPassword ? { debe_cambiar_password: true } : {}),
      }).eq('id', userId)
      if (errUpd) return { error: `update: ${errUpd.message}` }
    } else {
      return { error: `insert: ${errIns.message}` }
    }
  }
  return { ok: true, userId }
}

console.log('\n═══ 3. Crear usuarios nuevos con acceso ═══')
for (const u of NEW_USERS_ACTIVE) {
  const password = tempPassword()
  const r = await upsertUser({
    ...u, password, activo: true, debeCambiarPassword: true,
  })
  if (r.error) {
    errors.push(`crear ${u.email}: ${r.error}`)
    console.log(`  ❌ ${u.email}: ${r.error}`)
  } else {
    tempPasswords.push({ email: u.email, password, rol: u.rol })
    console.log(`  ✓ ${u.email} creado/actualizado · password temporal generada`)
  }
}

console.log('\n═══ 4. Crear inspectores del directorio CNE (sin acceso) ═══')
for (const u of NEW_USERS_DIRECTORY_ONLY) {
  const r = await upsertUser({
    ...u, password: crypto.randomBytes(32).toString('hex'),
    activo: false, debeCambiarPassword: false,
  })
  if (r.error) {
    errors.push(`crear ${u.email}: ${r.error}`)
    console.log(`  ❌ ${u.email}: ${r.error}`)
  } else {
    console.log(`  ✓ ${u.email} agregado como directorio (sin acceso)`)
  }
}

console.log('\n═══ 5. Desactivar usuarios huérfanos ═══')
for (const email of DEACTIVATE) {
  const u = await findUserByEmail(email)
  if (!u) { console.log(`  ⚠ ${email} no existe`); continue }
  const { error } = await sb.from('usuarios').update({ activo: false }).eq('id', u.id)
  if (error) { errors.push(`deactivate ${email}: ${error.message}`); console.log(`  ❌ ${email}: ${error.message}`); continue }
  console.log(`  ✓ ${email} desactivado (activo=false)`)
}

// ─── Resumen ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(70))
console.log('RESUMEN FINAL\n')

if (tempPasswords.length > 0) {
  console.log('🔑 Contraseñas temporales nuevas (compártelas por canal seguro):\n')
  for (const tp of tempPasswords) {
    console.log(`   ${tp.email.padEnd(28)}  →  ${tp.password}   [${tp.rol}]`)
  }
  console.log()
}

if (errors.length > 0) {
  console.log('⚠️  Errores encontrados:\n')
  for (const e of errors) console.log(`   - ${e}`)
} else {
  console.log('✅ Sin errores')
}

// Listado final de usuarios activos
console.log('\n📋 Estado final de la tabla usuarios:')
const { data: final } = await sb.from('usuarios')
  .select('email, nombre, apellidos, rol, activo')
  .order('activo', { ascending: false })
  .order('rol')
  .order('email')
for (const u of final ?? []) {
  const s = u.activo ? '✓' : '✗'
  console.log(`  ${s}  ${(u.email ?? '').padEnd(34)} ${(u.rol ?? '').padEnd(22)} ${u.nombre} ${u.apellidos ?? ''}`)
}
