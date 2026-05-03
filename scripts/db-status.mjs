/**
 * Reporte completo del estado de la BD.
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

const TABLES = [
  'usuarios', 'clientes',
  // Datos generados
  'solicitudes_folio', 'expedientes', 'documentos_expediente',
  'expediente_checklist', 'expediente_testigos', 'envios_revision',
  'inspecciones_agenda', 'certificados_cre', 'dictamenes',
  'conciliaciones', 'conciliacion_expedientes',
  'notificaciones', 'ai_costos',
  // Catálogos / config
  'folios_lista_control', 'tabuladores', 'plantillas_documento',
]

console.log('═══ Conteo por tabla ═══\n')
for (const t of TABLES) {
  try {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
    if (error) console.log(`  ${String(count ?? '—').padStart(6)}  ${t}  (error: ${error.message})`)
    else      console.log(`  ${String(count ?? 0).padStart(6)}  ${t}`)
  } catch (e) {
    console.log(`  ${'?'.padStart(6)}  ${t}  (excep: ${e.message})`)
  }
}

// Folios desglose
console.log('\n═══ Folios ═══')
const { count: foliosLibres }   = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', false)
const { count: foliosOcupados } = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', true)
console.log(`  ${String(foliosLibres ?? 0).padStart(6)}  libres`)
console.log(`  ${String(foliosOcupados ?? 0).padStart(6)}  asignados`)

// Storage
console.log('\n═══ Storage buckets ═══')
for (const bucket of ['documentos', 'certificados-cne']) {
  let total = 0
  const stack = ['']
  while (stack.length) {
    const cur = stack.pop()
    let offset = 0
    while (true) {
      const { data } = await sb.storage.from(bucket).list(cur, { limit: 1000, offset })
      if (!data || data.length === 0) break
      for (const item of data) {
        const path = cur ? `${cur}/${item.name}` : item.name
        if (item.id == null) stack.push(path)
        else total++
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  console.log(`  ${String(total).padStart(6)}  ${bucket}`)
}

// Tabuladores y plantillas snapshot
console.log('\n═══ Catálogos preservados ═══')
const { data: tabs } = await sb.from('tabuladores').select('id, nombre, activo').order('id')
if (tabs) {
  console.log(`  Tabuladores (${tabs.length}):`)
  for (const t of tabs) console.log(`    ${t.activo ? '✓' : '✗'} #${t.id}  ${t.nombre}`)
}

const { data: plantillas } = await sb.from('plantillas_documento').select('id, nombre, tipo').order('id').limit(20)
if (plantillas) {
  console.log(`\n  Plantillas (${plantillas.length}):`)
  for (const p of plantillas) console.log(`    #${p.id}  [${p.tipo}]  ${p.nombre}`)
}
