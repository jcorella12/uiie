import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // Verify the user is an inspector or inspector_responsable
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || !['inspector', 'inspector_responsable'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const { expediente_id, fecha_hora, duracion_min, direccion, testigo_id, notas, inspector_ejecutor_id } = body

  if (!fecha_hora) {
    return NextResponse.json({ error: 'La fecha y hora son obligatorias.' }, { status: 400 })
  }

  // Para inspector_responsable: usar el inspector_id del expediente, no el propio uid
  let resolvedInspectorId = user.id
  if (usuario.rol === 'inspector_responsable' && expediente_id) {
    const { data: exp } = await supabase
      .from('expedientes')
      .select('inspector_id')
      .eq('id', expediente_id)
      .single()
    if (exp?.inspector_id) resolvedInspectorId = exp.inspector_id
  }

  // Si se especifica un inspector ejecutor diferente, verificar que existe y es inspector activo
  let resolvedEjecutorId: string | null = null
  if (inspector_ejecutor_id && inspector_ejecutor_id !== resolvedInspectorId) {
    const { data: ejecutor } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('id', inspector_ejecutor_id)
      .in('rol', ['inspector', 'inspector_responsable'])
      .maybeSingle()
    if (!ejecutor) {
      return NextResponse.json({ error: 'El inspector ejecutor no es válido.' }, { status: 400 })
    }
    resolvedEjecutorId = ejecutor.id
  }

  const { data, error } = await supabase
    .from('inspecciones_agenda')
    .insert({
      expediente_id,
      inspector_id: resolvedInspectorId,
      inspector_ejecutor_id: resolvedEjecutorId,
      fecha_hora,
      duracion_min: duracion_min ?? 120,
      direccion,
      testigo_id: testigo_id || null,
      notas,
      status: 'programada',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
