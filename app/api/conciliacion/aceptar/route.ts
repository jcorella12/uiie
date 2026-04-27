import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/conciliacion/aceptar
// Body: { mes: number, anio: number }
// Solo incluye expedientes con status 'aprobado' o 'cerrado' (terminados y emitidos)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rolesPermitidos = ['inspector', 'auxiliar', 'inspector_responsable', 'admin']
    if (!usuarioData || !rolesPermitidos.includes(usuarioData.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { mes, anio } = body as { mes: number; anio: number }

    if (!mes || !anio || mes < 1 || mes > 12) {
      return NextResponse.json({ error: 'Mes o año inválido' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Verificar que no exista ya una conciliación para este corte
    const { data: existing } = await db
      .from('conciliaciones')
      .select('id')
      .eq('inspector_id', user.id)
      .eq('mes', mes)
      .eq('anio', anio)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una conciliación para este corte' }, { status: 400 })
    }

    // Obtener IDs de expedientes ya conciliados
    const { data: conciliados } = await db
      .from('conciliacion_expedientes')
      .select('expediente_id')
    const idsConciliados = new Set((conciliados ?? []).map((c: any) => c.expediente_id).filter(Boolean))

    // Solo expedientes TERMINADOS (aprobado o cerrado)
    const { data: todosExp, error: expError } = await db
      .from('expedientes')
      .select('id, numero_folio, kwp, folio_id')
      .eq('inspector_id', user.id)
      .in('status', ['aprobado', 'cerrado'])

    // Filtrar los ya conciliados en JS
    const expedientes = (todosExp ?? []).filter(e => !idsConciliados.has(e.id))

    if (expError) throw expError

    if (!expedientes || expedientes.length === 0) {
      return NextResponse.json({
        error: 'No hay expedientes aprobados o cerrados pendientes de conciliación',
      }, { status: 400 })
    }

    // Obtener precios via solicitudes_folio (folio_asignado_id = expediente.folio_id)
    const folioIds = expedientes.map(e => e.folio_id).filter(Boolean) as string[]
    let precioMap = new Map<string, number>()

    if (folioIds.length > 0) {
      const { data: solicitudes } = await db
        .from('solicitudes_folio')
        .select('folio_asignado_id, precio_propuesto')
        .in('folio_asignado_id', folioIds)

      for (const s of solicitudes ?? []) {
        if (s.folio_asignado_id) {
          precioMap.set(s.folio_asignado_id, s.precio_propuesto ?? 0)
        }
      }
    }

    const totalKwp   = expedientes.reduce((sum, e) => sum + (e.kwp ?? 0), 0)
    const totalMonto = expedientes.reduce((sum, e) => sum + (precioMap.get(e.folio_id ?? '') ?? 0), 0)

    // Crear la conciliación
    const { data: conciliacion, error: concError } = await db
      .from('conciliaciones')
      .insert({
        inspector_id:      user.id,
        mes,
        anio,
        status:            'aceptada',
        total_expedientes: expedientes.length,
        total_kwp:         totalKwp,
        total_monto:       totalMonto,
        inspector_acepto_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (concError) throw concError

    // Insertar junction expedientes → conciliación
    const junctionRows = expedientes.map(e => ({
      conciliacion_id: conciliacion.id,
      expediente_id:   e.id,
    }))

    const { error: juncError } = await db
      .from('conciliacion_expedientes')
      .insert(junctionRows)

    if (juncError) {
      await db.from('conciliaciones').delete().eq('id', conciliacion.id)
      throw juncError
    }

    return NextResponse.json({
      success:           true,
      conciliacion_id:   conciliacion.id,
      total_expedientes: expedientes.length,
      total_kwp:         totalKwp,
      total_monto:       totalMonto,
    })

  } catch (err: any) {
    console.error('[conciliacion/aceptar]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
