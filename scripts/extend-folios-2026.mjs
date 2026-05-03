/**
 * Extiende folios de 2026 hasta 1500 totales.
 * También limpia el folio basura del año "202" (sec 99999).
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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Limpiar folio basura
console.log('═══ Limpiando folio basura (sec 99999) ═══')
const { data: basura } = await sb.from('folios_lista_control')
  .select('id, numero_folio, asignado')
  .eq('numero_secuencial', 99999)
for (const f of basura ?? []) {
  if (f.asignado) {
    console.log(`  ⚠ ${f.numero_folio} está asignado, no se borra`)
    continue
  }
  await sb.from('folios_lista_control').delete().eq('id', f.id)
  console.log(`  ✓ borrado ${f.numero_folio}`)
}

// 2. Extender 2026 hasta 1500
console.log('\n═══ Extendiendo folios 2026 hasta 1500 ═══')
const { data: existentes } = await sb.from('folios_lista_control')
  .select('numero_secuencial')
  .ilike('numero_folio', '%-2026')
const existSet = new Set(existentes.map(f => f.numero_secuencial))

const aCrear = []
for (let n = 1; n <= 1500; n++) {
  if (existSet.has(n)) continue
  aCrear.push({
    numero_folio: `UIIE-${String(n).padStart(3, '0')}-2026`,
    numero_secuencial: n,
    asignado: false,
  })
}

console.log(`  Existentes: ${existSet.size}`)
console.log(`  A crear:    ${aCrear.length}`)

if (aCrear.length === 0) {
  console.log('  Nada que crear')
} else {
  // Insertar en chunks de 200
  let creados = 0
  for (let i = 0; i < aCrear.length; i += 200) {
    const chunk = aCrear.slice(i, i + 200)
    const { error } = await sb.from('folios_lista_control').insert(chunk)
    if (error) {
      console.log(`  ❌ chunk ${i}: ${error.message}`)
      break
    }
    creados += chunk.length
    process.stdout.write(`  ${creados}/${aCrear.length}\r`)
  }
  console.log(`\n  ✓ ${creados} folios creados`)
}

// 3. Verificar
const { count: total2026 }  = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).ilike('numero_folio', '%-2026')
const { count: libres2026 } = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).ilike('numero_folio', '%-2026').eq('asignado', false)
const { count: asign2026 }  = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true }).ilike('numero_folio', '%-2026').eq('asignado', true)

console.log(`\n═══ Estado final 2026 ═══`)
console.log(`  Total:      ${total2026}`)
console.log(`  Asignados:  ${asign2026}`)
console.log(`  Libres:     ${libres2026}`)

const { count: totalAll } = await sb.from('folios_lista_control').select('*', { count: 'exact', head: true })
console.log(`\n  Total tabla: ${totalAll}`)
