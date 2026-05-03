/**
 * Limpieza completa para empezar de cero:
 * 1. Borra todos los datos generados (expedientes, solicitudes, etc.)
 * 2. Resetea folios a libres
 * 3. Borra los usuarios inactivos (auth + perfil)
 *
 * Uso: node scripts/clean-test-data.mjs
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Helper: ejecutar SQL crudo via Management API (la JS SDK no permite SQL libre)
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
  try { return JSON.parse(text) } catch { return text }
}

// ─── 1. Datos generados ──────────────────────────────────────────────────────
console.log('═══ 1. Borrando datos generados ═══')

// Lista en orden de FK
const TABLES = [
  'notificaciones', 'ai_costos', 'envios_revision', 'expediente_checklist',
  'expediente_testigos', 'documentos_expediente', 'conciliacion_expedientes',
  'conciliaciones', 'inspecciones_agenda', 'certificados_cre', 'dictamenes',
  'expedientes', 'solicitudes_folio',
]

for (const t of TABLES) {
  try {
    const before = await execSQL(`SELECT COUNT(*)::int AS n FROM ${t};`)
    const n = before[0]?.n ?? 0
    if (n === 0) {
      console.log(`  ✓ ${t}: ya vacía`)
      continue
    }
    await execSQL(`DELETE FROM ${t};`)
    const after = await execSQL(`SELECT COUNT(*)::int AS n FROM ${t};`)
    const remaining = after[0]?.n ?? 0
    if (remaining === 0) console.log(`  ✓ ${t}: ${n} → 0`)
    else                 console.log(`  ⚠ ${t}: ${n} → ${remaining} (¿quedaron filas?)`)
  } catch (e) {
    console.log(`  ❌ ${t}: ${e.message}`)
  }
}

// Reset folios
console.log('\n═══ 2. Reseteando folios ═══')
try {
  await execSQL(`UPDATE folios_lista_control SET asignado=false, asignado_a=NULL, fecha_asignacion=NULL WHERE asignado=true;`)
  const r = await execSQL(`SELECT COUNT(*)::int AS libres FROM folios_lista_control WHERE asignado=false;`)
  console.log(`  ✓ Folios libres: ${r[0]?.libres}`)
} catch (e) {
  console.log(`  ❌ ${e.message}`)
}

// ─── 3. Borrar usuarios inactivos ───────────────────────────────────────────
console.log('\n═══ 3. Borrando usuarios inactivos ═══')

const { data: inactivos } = await sb
  .from('usuarios')
  .select('id, email')
  .eq('activo', false)

for (const u of inactivos ?? []) {
  // 1. Borrar de la tabla usuarios
  const { error: errDb } = await sb.from('usuarios').delete().eq('id', u.id)
  if (errDb) {
    console.log(`  ❌ ${u.email} (perfil): ${errDb.message}`)
    continue
  }
  // 2. Borrar de auth — los del directorio (edgar, pedro) los conservamos en auth
  //    pero tú dijiste solo borrar los INactivos así que ambos van fuera
  const { error: errAuth } = await sb.auth.admin.deleteUser(u.id)
  if (errAuth) {
    console.log(`  ⚠ ${u.email}: perfil borrado pero auth: ${errAuth.message}`)
  } else {
    console.log(`  ✓ ${u.email} borrado completamente (auth + perfil)`)
  }
}

// ─── 4. Verificación final ──────────────────────────────────────────────────
console.log('\n═══ 4. Verificación final ═══')
const counts = await execSQL(`
  SELECT 'expedientes' AS tabla, COUNT(*)::int AS n FROM expedientes
  UNION ALL SELECT 'solicitudes', COUNT(*)::int FROM solicitudes_folio
  UNION ALL SELECT 'inspecciones', COUNT(*)::int FROM inspecciones_agenda
  UNION ALL SELECT 'documentos', COUNT(*)::int FROM documentos_expediente
  UNION ALL SELECT 'certificados', COUNT(*)::int FROM certificados_cre
  UNION ALL SELECT 'notificaciones', COUNT(*)::int FROM notificaciones
  UNION ALL SELECT 'usuarios activos', COUNT(*)::int FROM usuarios WHERE activo=true
  UNION ALL SELECT 'usuarios inactivos', COUNT(*)::int FROM usuarios WHERE activo=false
  UNION ALL SELECT 'folios libres', COUNT(*)::int FROM folios_lista_control WHERE asignado=false
  UNION ALL SELECT 'folios asignados', COUNT(*)::int FROM folios_lista_control WHERE asignado=true;
`)
console.log()
for (const row of counts) {
  const n = String(row.n).padStart(5)
  console.log(`   ${n}  ${row.tabla}`)
}

console.log('\n✅ Limpieza completa.')
