/**
 * Sube los 2 PDFs de homologación Huawei al bucket "documentos"
 * y actualiza los paths en la tabla inversor_homologaciones.
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

const HUAWEI = [
  {
    local:  '/Users/joaquincorella/Downloads/F00.06.UE 225 2026.pdf',
    path:   'homologaciones/inversores/huawei/oficio-CNE-F00.06.UE-225-2026.pdf',
    nombre: 'Oficio F00.06.UE-225-2026 (CNE).pdf',
    field:  'oficio_cne',
  },
  {
    local:  '/Users/joaquincorella/Downloads/Clarificación RES1422017 V3.pdf',
    path:   'homologaciones/inversores/huawei/clarificacion-RES142-2017-Huawei.pdf',
    nombre: 'Clarificacion RES142-2017 Huawei.pdf',
    field:  'carta_marca',
  },
]

const updates = {}
for (const h of HUAWEI) {
  const buf = readFileSync(h.local)
  const { error } = await sb.storage.from('documentos').upload(h.path, buf, {
    contentType: 'application/pdf', upsert: true,
  })
  if (error) { console.log(`❌ ${h.nombre}: ${error.message}`); continue }
  console.log(`✓ subido: ${h.path}`)
  updates[`${h.field}_path`] = h.path
  updates[`${h.field}_nombre`] = h.nombre
}

const { error: errUpd } = await sb.from('inversor_homologaciones')
  .update(updates)
  .eq('marca', 'Huawei')
if (errUpd) console.log(`❌ update: ${errUpd.message}`)
else        console.log(`✓ inversor_homologaciones (Huawei) actualizado`)

const { data: row } = await sb.from('inversor_homologaciones').select('*').eq('marca', 'Huawei').single()
console.log('\nEstado final:')
console.log(`  marca:           ${row.marca}`)
console.log(`  oficio CNE:      ${row.oficio_cne_numero} (${row.oficio_cne_fecha})`)
console.log(`  oficio path:     ${row.oficio_cne_path}`)
console.log(`  carta path:      ${row.carta_marca_path}`)
console.log(`  vigente:         ${row.vigente}`)
