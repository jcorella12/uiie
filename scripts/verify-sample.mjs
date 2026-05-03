// Muestra un expediente importado para verificar mapeo correcto.
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

const { data: e } = await sb.from('expedientes')
  .select('numero_folio, nombre_cliente_final, propietario_nombre, kwp, ciudad, municipio, estado_mx, direccion_proyecto, fecha_inicio, fecha_cierre, hora_cierre_acta, tipo_instalacion, tipo_tecnologia, tension_interconexion_v, numero_permiso_cre_cne, atiende_visita_nombre, atiende_visita_telefono, atiende_visita_correo, observaciones, status, inspector_id, inspector_ejecutor_id')
  .eq('numero_folio', 'UIIE-001-2026')
  .single()
console.log('UIIE-001-2026:')
console.log(JSON.stringify(e, null, 2))

const { data: agenda } = await sb.from('inspecciones_agenda')
  .select('fecha_hora, duracion_min, status, direccion')
  .eq('expediente_id', (await sb.from('expedientes').select('id').eq('numero_folio', 'UIIE-001-2026').single()).data?.id)
  .single()
console.log('\nAgenda:', agenda)

const { data: sol } = await sb.from('solicitudes_folio')
  .select('cliente_nombre, tipo_persona, ciudad, kwp, precio_propuesto, status, fecha_estimada')
  .eq('folio_asignado_id', (await sb.from('folios_lista_control').select('id').eq('numero_folio', 'UIIE-001-2026').single()).data?.id)
  .single()
console.log('\nSolicitud:', sol)
