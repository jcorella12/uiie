/**
 * Restaura solicitudes_folio.fecha_estimada usando expedientes.fecha_inicio
 * (la fecha del reporte trimestral, oficial). Solo para Q1 — los nuevos folios
 * Q2+ sin expediente conservan la fecha del Forms.
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

// Para cada expediente con fecha_inicio, asegurar que la solicitud tenga la misma fecha_estimada
const { data: exps } = await sb.from('expedientes')
  .select('id, folio_id, fecha_inicio')
  .not('fecha_inicio', 'is', null)

console.log(`Expedientes con fecha_inicio: ${exps.length}\n`)

let updated = 0, sinSol = 0, sinCambio = 0, errors = 0
for (const e of exps) {
  const { data: sol, error } = await sb.from('solicitudes_folio')
    .select('id, fecha_estimada')
    .eq('folio_asignado_id', e.folio_id)
    .maybeSingle()
  if (error) { console.log('  ❌', error.message); errors++; continue }
  if (!sol) { sinSol++; continue }
  if (sol.fecha_estimada === e.fecha_inicio) { sinCambio++; continue }

  const { error: errUpd } = await sb.from('solicitudes_folio')
    .update({ fecha_estimada: e.fecha_inicio })
    .eq('id', sol.id)
  if (errUpd) { errors++; continue }
  updated++
  if (updated % 50 === 0) console.log(`  ${updated} corregidas…`)
}

console.log(`\n═══ Resumen ═══`)
console.log(`  Actualizadas:    ${updated}`)
console.log(`  Sin cambio:      ${sinCambio}`)
console.log(`  Sin solicitud:   ${sinSol}`)
console.log(`  Errores:         ${errors}`)
