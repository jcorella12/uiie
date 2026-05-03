import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Folios disponibles
const { data: folios } = await sb.from('folios_lista_control')
  .select('numero_folio')
  .order('numero_folio')
  .limit(20)
console.log('Primeros 20 folios:')
for (const f of folios ?? []) console.log(`  ${f.numero_folio}`)

const { data: ultFolios } = await sb.from('folios_lista_control')
  .select('numero_folio')
  .order('numero_folio', { ascending: false })
  .limit(5)
console.log('\nÚltimos 5 folios:')
for (const f of ultFolios ?? []) console.log(`  ${f.numero_folio}`)

// Excel: extraer todos los folios únicos
const wb = XLSX.readFile('/Users/joaquincorella/Downloads/ReporteTrimestral_Q1_2026 (1).xlsx')
const ws = wb.Sheets['Informe']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, blankrows: false })

const folios2025 = []
const folios2026 = []
const otros = []
for (let i = 6; i < rows.length; i++) {  // datos empiezan en fila 7 (índice 6)
  const row = rows[i]
  if (!row?.[1]) continue  // sin No.
  const folio = row[20]  // columna U "Número de Acta"
  if (!folio) continue
  if (folio.endsWith('2026')) folios2026.push(folio)
  else if (folio.endsWith('2025')) folios2025.push(folio)
  else otros.push(folio)
}
console.log(`\nExcel folios:`)
console.log(`  2026: ${folios2026.length} (primeros 5: ${folios2026.slice(0, 5).join(', ')})`)
console.log(`  2025: ${folios2025.length} (primeros 5: ${folios2025.slice(0, 5).join(', ')})`)
console.log(`  otros: ${otros.length}${otros.length ? ': ' + otros.slice(0, 5).join(', ') : ''}`)

// Match contra DB
const todosFolios = [...folios2026, ...folios2025, ...otros]
const { data: enDB } = await sb.from('folios_lista_control')
  .select('numero_folio')
  .in('numero_folio', todosFolios)
const enDBSet = new Set((enDB ?? []).map(f => f.numero_folio))
const noEstan = todosFolios.filter(f => !enDBSet.has(f))
console.log(`\nFolios en DB: ${enDB?.length ?? 0} / ${todosFolios.length}`)
console.log(`Folios faltantes en DB: ${noEstan.length}`)
if (noEstan.length > 0) console.log(`  ej: ${noEstan.slice(0, 5).join(', ')}`)

// Inspectores únicos
const inspectores = new Set()
for (let i = 6; i < rows.length; i++) {
  const row = rows[i]
  if (!row?.[1]) continue
  if (row[23]) inspectores.add(row[23].trim().replace(/\s+/g, ' '))
}
console.log(`\nInspectores únicos en Excel:`)
for (const i of [...inspectores].sort()) console.log(`  "${i}"`)

// Usuarios actuales
const { data: usuarios } = await sb.from('usuarios')
  .select('id, email, nombre, apellidos, rol')
  .in('rol', ['inspector', 'inspector_responsable'])
console.log('\nUsuarios inspector/responsable:')
for (const u of usuarios ?? []) {
  const fullName = `${u.nombre} ${u.apellidos}`.replace(/\s+/g, ' ').trim()
  console.log(`  ${u.email.padEnd(30)} → "${fullName.toUpperCase()}"`)
}
