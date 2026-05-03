/**
 * Crea expediente UIIE-268-2026 (no estaba en trimestral pero el cert existe en Drive)
 * y le sube cert + acuse.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, statSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const NUMERO_FOLIO = 'UIIE-268-2026'
const OPE_DIR = '/Users/joaquincorella/Library/CloudStorage/GoogleDrive-corella12@gmail.com/Mi unidad/1. CIAE/4. UIIE/CORRESPONDENCIA UIIE/INSPECTORES CORRESPONDENCIA/LFP/Inspecciones 2026/EMITIDAS/Inspección 268 - MONTERREY, NUEVO LEON - LUIS FELIPE MARTINEZ/12. OPE'

// 1. Listar archivos de OPE
const files = readdirSync(OPE_DIR).filter(f => f !== 'Icon' && !f.startsWith('.'))
console.log('Archivos en OPE:', files)

// 2. Identificar cert + acuse
const acuse = files.find(f => /OPE\s*-\s*Acuse/i.test(f))
const acuseMatch = acuse?.match(/OPE\s*-\s*Acuse\s+(UIIE-CC-\d+-\d{4})\.pdf/i)
const numero_certificado = acuseMatch?.[1] ?? null
const cert = files.find(f => /^[0-9a-f]{8}-/i.test(f) || /^UIIE\s+\d+-\d{4}\.pdf$/i.test(f))

console.log({ acuse, cert, numero_certificado })

if (!cert || !acuse) {
  console.log('Faltan archivos, abortando')
  process.exit(1)
}

// 3. Cargar solicitud y folio
const { data: folio } = await sb.from('folios_lista_control').select('id, numero_folio').eq('numero_folio', NUMERO_FOLIO).single()
const { data: sol } = await sb.from('solicitudes_folio')
  .select('id, inspector_id, inspector_ejecutor_id, kwp, ciudad, estado_mx, cliente_nombre, cliente_epc_nombre, propietario_nombre, fecha_estimada')
  .eq('folio_asignado_id', folio.id).single()

console.log('Solicitud:', sol)

// 4. Crear expediente
const certMtime = statSync(join(OPE_DIR, cert)).mtime
const fechaInicio = sol.fecha_estimada
const fechaCierre = certMtime.toISOString().slice(0, 10)

const { data: exp, error: errExp } = await sb.from('expedientes').insert({
  folio_id: folio.id,
  numero_folio: NUMERO_FOLIO,
  inspector_id: sol.inspector_id,
  inspector_ejecutor_id: sol.inspector_ejecutor_id,
  cliente_id: null,
  kwp: sol.kwp,
  ciudad: sol.ciudad,
  municipio: sol.ciudad,
  estado_mx: sol.estado_mx,
  status: 'cerrado',
  fecha_inicio: fechaInicio,
  fecha_cierre: fechaCierre,
  hora_cierre_acta: '12:00:00',
  tipo_conexion: 'generacion_distribuida',
  tipo_central: 'MT',
  tipo_instalacion: 'Central de Generación Distribuida',
  tipo_tecnologia: 'Fotovoltaica',
  numero_permiso_cre_cne: 'N/A',
  nombre_cliente_final: sol.cliente_nombre,
  propietario_nombre: sol.propietario_nombre,
  numero_certificado,
  fecha_emision_certificado: fechaCierre,
  checklist_pct: 100,
}).select('id').single()
if (errExp) throw errExp
console.log(`✓ Expediente creado: ${exp.id}`)

// 5. Subir cert y acuse
const BUCKET = 'certificados-cne'
const certBuf = readFileSync(join(OPE_DIR, cert))
const acuseBuf = readFileSync(join(OPE_DIR, acuse))

const path_cert = `cert/${exp.id}/${numero_certificado}.pdf`
const path_acuse = `acuse/${exp.id}/${numero_certificado}.pdf`

await sb.storage.from(BUCKET).upload(path_cert, certBuf, { contentType: 'application/pdf', upsert: true })
await sb.storage.from(BUCKET).upload(path_acuse, acuseBuf, { contentType: 'application/pdf', upsert: true })

const expSec = 60 * 60 * 24 * 365 * 10
const { data: u1 } = await sb.storage.from(BUCKET).createSignedUrl(path_cert, expSec)
const { data: u2 } = await sb.storage.from(BUCKET).createSignedUrl(path_acuse, expSec)

await sb.from('certificados_cre').insert({
  numero_certificado,
  titulo: `Certificado ${numero_certificado}`,
  url_cre: u1.signedUrl,
  url_acuse: u2.signedUrl,
  fecha_emision: fechaCierre,
  expediente_id: exp.id,
  storage_path_cert: path_cert,
  storage_path_acuse: path_acuse,
  created_by: sol.inspector_id,
})

await sb.from('documentos_expediente').insert([
  {
    expediente_id: exp.id, tipo: 'certificado_cre', nombre: cert,
    storage_path: path_cert, mime_type: 'application/pdf',
    tamano_bytes: certBuf.length, verificado: true,
    subido_por: sol.inspector_id, subido_por_cliente: false,
  },
  {
    expediente_id: exp.id, tipo: 'acuse_cre', nombre: acuse,
    storage_path: path_acuse, mime_type: 'application/pdf',
    tamano_bytes: acuseBuf.length, verificado: true,
    subido_por: sol.inspector_id, subido_por_cliente: false,
  },
])

// 6. Actualizar solicitud (folio_asignado → ya tiene expediente cerrado)
await sb.from('solicitudes_folio').update({
  status: 'folio_asignado',  // se mantiene; el expediente lleva 'cerrado'
}).eq('id', sol.id)

// 7. Crear agenda
await sb.from('inspecciones_agenda').insert({
  expediente_id: exp.id,
  inspector_id: sol.inspector_id,
  inspector_ejecutor_id: sol.inspector_ejecutor_id,
  fecha_hora: `${fechaInicio}T15:00:00+00:00`,
  duracion_min: 180,
  status: 'realizada',
})

console.log(`\n✅ UIIE-268-2026 creado completo con cert ${numero_certificado}`)
