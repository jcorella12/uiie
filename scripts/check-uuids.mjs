import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const data = [
  ['UIIE-025-2026', 'EFRAIM CASTELLANOS FRAYRE', 'ENRIQUE HERNANDEZ PACHECO', '4964587f-986f-4c14-865e-a1b897f53af4'],
  ['UIIE-205-2026', 'JESUS DE ITA', 'ARCOS SERCAL INMOBILIARIA S. DE R.L. DE C.V.', 'c72769eb-e8a7-468d-bba1-3ca55d7949f5'],
  ['UIIE-163-2026', 'JESUS DE ITA', 'SERVICIO VALOR SA DE CV', 'a6c413db-5e40-49b7-a38f-19fbc2a3b28e'],
  ['UIIE-210-2026', 'JOAQUIN CORELLA', 'ARQUIDIOCESIS DE HERMOSILLO AR', 'a978a764-2865-44d7-b26f-4081ed54f1ff'],
  ['UIIE-206-2026', 'JOAQUIN CORELLA', 'HIRMA ALICIA ROSAS MARTINEZ', '5d8f1607-8ed6-459c-8a45-c2f909225f0c'],
  ['UIIE-207-2026', 'JOAQUIN CORELLA', 'MUNICIPIO DE NOGALES SONORA', '15abf3ba-316f-46b8-b2f8-df77674a83ed'],
  ['UIIE-208-2026', 'JOAQUIN CORELLA', 'GUILLERMO OMAR GIM BURRUEL', 'ec95125d-df6b-4dff-97ef-6c99cd05b969'],
  ['UIIE-209-2026', 'JOAQUIN CORELLA', 'CARLOS RAFAEL BEJARANO CELAYA', 'd2ce2ba2-1421-410c-a495-0b5dd2d4d402'],
  ['UIIE-310-2026', 'JOAQUIN CORELLA', 'COMERCIALIZADORA FIVICRUMA SA DE CV', '26e80a13-9118-470a-9c73-3bfabcc927f8'],
  ['UIIE-233-2026', 'JOAQUIN CORELLA', '7 - ELEVEN DE MEXICO S.A. DE C.V.', '784c7484-5353-45d9-9b40-4aacee6b71e4'],
  ['UIIE-316-2026', 'EFRAIM CASTELLANOS FRAYRE', 'AGROPECUARIA MARLET SA DE CV', '22b534b0-ef72-490a-bbf1-d4672114bac8'],
  ['UIIE-320-2026', 'EFRAIM CASTELLANOS FRAYRE', 'AGROPECUARIA MARLET SA DE CV', '3f2663a7-5788-4c0f-91ef-8582ff3d039e'],
  ['UIIE-331-2026', 'ERICK ANDRES AGUIRRE PRIETO', 'NUEVA WALMART DE MEXICO S DE RL DE CV', 'fc111faa-a965-48ef-9903-52a01f52f4ce'],
  ['UIIE-377-2026', 'JESUS DE ITA', 'UABJO RECTORIA', 'af8b9e98-0d2f-475a-91a4-9223666fc530'],
  ['UIIE-268-2026', 'LUIS FELIPE', 'JUAN ALEJANDRO QUIROGA BARRERA', '9ef61aae-36e5-4c6a-ac5a-6ebcb76d6fa8'],
]

const folios = data.map(d => d[0])
const uuids = data.map(d => d[3])

// ¿Match con expedientes.id?
const { data: e1 } = await sb.from('expedientes').select('id, numero_folio, numero_certificado').in('id', uuids)
console.log(`Match contra expedientes.id: ${e1?.length ?? 0}`)

// ¿Match con certificados_cre.id?
const { data: c1 } = await sb.from('certificados_cre').select('id, numero_certificado').in('id', uuids)
console.log(`Match contra certificados_cre.id: ${c1?.length ?? 0}`)

// Estado actual de esos folios
const { data: e2 } = await sb.from('expedientes').select('id, numero_folio, numero_certificado, nombre_cliente_final').in('numero_folio', folios)
console.log(`\nEstado actual de los ${folios.length} folios mencionados:`)
const map = new Map((e2 ?? []).map(e => [e.numero_folio, e]))
for (const [folio, , solicitante, uuid] of data) {
  const e = map.get(folio)
  if (!e) { console.log(`  ${folio}: NO existe expediente`); continue }

  // Verificar si tiene cert+acuse en storage y archivos
  const { data: cert } = await sb.from('certificados_cre')
    .select('storage_path_cert, storage_path_acuse, url_cre, url_acuse')
    .eq('expediente_id', e.id).maybeSingle()

  const hasCert = !!cert?.storage_path_cert
  const hasAcuse = !!cert?.storage_path_acuse
  console.log(`  ${folio}: cert=${e.numero_certificado ?? '—'}  storage[cert=${hasCert?'✓':'✗'} acuse=${hasAcuse?'✓':'✗'}]  uuid=${uuid.slice(0,8)}…`)

  // Mismatch en cliente final (usuario dice X, BD dice Y)
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()
  if (norm(e.nombre_cliente_final ?? '').slice(0, 20) !== norm(solicitante).slice(0, 20)) {
    console.log(`     ⚠ cliente_final mismatch: BD="${e.nombre_cliente_final}" vs lista="${solicitante}"`)
  }
}
