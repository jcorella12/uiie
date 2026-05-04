/**
 * Respaldo de la BD Supabase a JSON local (formato fácil de inspeccionar).
 *
 * Para una restauración punto-a-punto usa el dashboard de Supabase
 * (Settings → Database → Backups → Download). Este script es complementario:
 * te deja inspeccionar registros y hacer restauraciones quirúrgicas si necesitas.
 *
 * Uso: node scripts/backup-db.mjs [<carpeta-destino>]
 *      node scripts/backup-db.mjs                 # default: ./backups/<timestamp>
 *      node scripts/backup-db.mjs /path/al/disco
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
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

// Tablas a respaldar (todas las que tienen datos reales)
const TABLES = [
  'usuarios',
  'clientes',
  'inversores',
  'testigos',
  'solicitudes_folio',
  'expedientes',
  'expediente_testigos',
  'expediente_checklist',
  'documentos_expediente',
  'envios_revision',
  'inspecciones_agenda',
  'certificados_cre',
  'dictamenes',
  'conciliaciones',
  'conciliacion_expedientes',
  'notificaciones',
  'ai_costos',
  'folios_lista_control',
  'tabuladores',
  'plantillas_documento',
  'inversor_homologaciones',
  'dias_bloqueados',
]

// Carpeta destino
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const destBase = process.argv[2] ?? join(__dirname, '..', 'backups')
const dest = join(destBase, ts)
mkdirSync(dest, { recursive: true })

console.log(`Respaldando a: ${dest}\n`)

const meta = { timestamp: new Date().toISOString(), tables: {} }
let totalRows = 0

for (const t of TABLES) {
  try {
    let allRows = []
    const PAGE = 1000
    let offset = 0
    while (true) {
      const { data, error } = await sb.from(t)
        .select('*')
        .range(offset, offset + PAGE - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      allRows.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }
    writeFileSync(join(dest, `${t}.json`), JSON.stringify(allRows, null, 2))
    meta.tables[t] = allRows.length
    totalRows += allRows.length
    console.log(`  ✓ ${t.padEnd(28)} ${String(allRows.length).padStart(6)} filas`)
  } catch (e) {
    console.log(`  ❌ ${t.padEnd(28)} ${e.message}`)
    meta.tables[t] = `error: ${e.message}`
  }
}

writeFileSync(join(dest, '_meta.json'), JSON.stringify(meta, null, 2))

console.log(`\nTotal: ${totalRows} filas en ${TABLES.length} tablas`)
console.log(`✅ Respaldo en: ${dest}`)
