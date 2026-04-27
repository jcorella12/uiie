import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Campos permitidos para actualizar en expedientes (whitelist)
const CAMPOS_EXPEDIENTE = [
  'nombre_cliente_final',
  'direccion_proyecto',
  'colonia',
  'codigo_postal',
  'municipio',
  'ciudad',
  'estado_mx',
  'kwp',
  'num_paneles',
  'potencia_panel_wp',
  'inversor_id',
  'num_inversores',
  'tipo_conexion',
  'tipo_central',
  'numero_medidor',
  'resolutivo_folio',
  'resolutivo_fecha',
  'resolutivo_tiene_cobro',
  'resolutivo_monto',
  'resolutivo_referencia',
  'dictamen_folio_dvnp',
  'dictamen_uvie_nombre',
  'observaciones',
  'cliente_id',
  // Subestación
  'capacidad_subestacion_kva',
  // Protecciones
  'tiene_i1_i2',
  'tiene_interruptor_exclusivo',
  'tiene_ccfp',
  'tiene_proteccion_respaldo',
] as const

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { expediente_id, ...rawCampos } = body

  if (!expediente_id) {
    return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })
  }

  // Filtrar solo campos permitidos
  const update: Record<string, unknown> = {}
  for (const campo of CAMPOS_EXPEDIENTE) {
    if (campo in rawCampos) {
      const val = rawCampos[campo]
      // Convertir strings vacíos a null para campos opcionales
      update[campo] = val === '' ? null : val
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  // Check user role: clients can update expedientes they own but don't have RLS UPDATE policy
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  const esCliente = perfil?.rol === 'cliente'

  // Clients: verify read access via RLS before using service client to write
  if (esCliente) {
    const { data: exp } = await supabase.from('expedientes').select('id').eq('id', expediente_id).maybeSingle()
    if (!exp) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    // Only allow clients to update cliente_id (for linking their account) — no technical fields
    const clientAllowed = new Set(['cliente_id'])
    for (const k of Object.keys(update)) {
      if (!clientAllowed.has(k)) delete update[k]
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Sin campos permitidos' }, { status: 400 })
    const svc = await createServiceClient()
    const { error } = await svc.from('expedientes').update(update).eq('id', expediente_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('expedientes')
    .update(update)
    .eq('id', expediente_id)

  if (error) {
    console.error('[guardar expediente]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
