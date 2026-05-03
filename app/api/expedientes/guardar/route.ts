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
  'numero_serie_medidor',
  'numero_cfe_medidor',
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

  // ── Cliente flow: solo puede vincularse a un expediente vacío (cliente_id=NULL)
  // o cuando ya es el cliente vinculado, y cliente_id solo puede ser uno de sus
  // propios registros de clientes (clientes.usuario_id = auth.uid()).
  if (esCliente) {
    // Permitido únicamente cliente_id; cualquier otro campo se ignora
    const clientAllowed = new Set(['cliente_id'])
    for (const k of Object.keys(update)) {
      if (!clientAllowed.has(k)) delete update[k]
    }
    if (!('cliente_id' in update) || !update.cliente_id) {
      return NextResponse.json({ error: 'Sin campos permitidos para cliente' }, { status: 400 })
    }

    // Verificar contra el service role:
    //   1. El expediente existe
    //   2. Su cliente_id actual es NULL o coincide con el cliente_id que el cliente ya tenía (idempotente)
    //   3. El cliente_id propuesto pertenece a este usuario (clientes.usuario_id = auth.uid())
    const svc = await createServiceClient()
    const { data: exp } = await svc.from('expedientes')
      .select('id, cliente_id, cliente_epc_id')
      .eq('id', expediente_id).maybeSingle()
    if (!exp) return NextResponse.json({ error: 'Expediente no existe' }, { status: 404 })

    // Validar que el cliente_id propuesto sea uno del propio usuario
    const { data: misClientes } = await svc.from('clientes')
      .select('id').eq('usuario_id', user.id)
    const idsMiosUsuario = new Set((misClientes ?? []).map(c => c.id))
    if (!idsMiosUsuario.has(update.cliente_id as string)) {
      return NextResponse.json({ error: 'No puedes vincular el expediente a un cliente que no es tuyo' }, { status: 403 })
    }

    // Solo permitir el cambio si el expediente está libre (cliente_id NULL) o ya es de este usuario
    const expCliId = exp.cliente_id as string | null
    const expEpcId = exp.cliente_epc_id as string | null
    const yaEsMio = (expCliId && idsMiosUsuario.has(expCliId)) || (expEpcId && idsMiosUsuario.has(expEpcId))
    if (expCliId && !yaEsMio) {
      return NextResponse.json({ error: 'Este expediente ya está vinculado a otro cliente' }, { status: 409 })
    }

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
