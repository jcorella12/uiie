import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const LOCKED_STATUSES = ['revision', 'aprobado', 'cerrado']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    expediente_id,
    cli_marca_paneles,
    cli_modelo_paneles,
    cli_num_paneles,
    cli_potencia_panel_wp,
    cli_marca_inversor,
    cli_modelo_inversor,
    cli_capacidad_kw,
    cli_num_inversores,
    cli_num_medidor,
    cli_direccion,
    cli_notas,
  } = body

  if (!expediente_id) {
    return NextResponse.json({ error: 'expediente_id es requerido' }, { status: 400 })
  }

  // Obtener expediente con su status y folio_id
  const { data: expediente } = await supabase
    .from('expedientes')
    .select('id, status, cliente_id, folio_id')
    .eq('id', expediente_id)
    .single()

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // Verificar si el expediente está bloqueado
  if (LOCKED_STATUSES.includes(expediente.status)) {
    return NextResponse.json({ error: 'El expediente está en modo solo lectura' }, { status: 403 })
  }

  // Access verified via RLS: if expediente SELECT succeeded, the user has read access.
  // Just verify they have a valid role to write client pre-load data.
  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  const rolValido = ['cliente', 'admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(perfil?.rol ?? '')
  if (!rolValido) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Actualizar con service client para omitir RLS
  const serviceClient = await createServiceClient()
  const { error } = await serviceClient
    .from('expedientes')
    .update({
      cli_marca_paneles:     cli_marca_paneles     ?? null,
      cli_modelo_paneles:    cli_modelo_paneles    ?? null,
      cli_num_paneles:       cli_num_paneles       ?? null,
      cli_potencia_panel_wp: cli_potencia_panel_wp ?? null,
      cli_marca_inversor:    cli_marca_inversor    ?? null,
      cli_modelo_inversor:   cli_modelo_inversor   ?? null,
      cli_capacidad_kw:      cli_capacidad_kw      ?? null,
      cli_num_inversores:    cli_num_inversores    ?? null,
      cli_num_medidor:       cli_num_medidor       ?? null,
      cli_direccion:         cli_direccion         ?? null,
      cli_notas:             cli_notas             ?? null,
      cli_completado_at:     new Date().toISOString(),
    })
    .eq('id', expediente_id)

  if (error) {
    console.error('Error guardando precarga:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
