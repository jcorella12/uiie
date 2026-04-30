import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — update orden_inspector for a set of expedientes
// Body: { ordenes: { id: string; orden: number }[] }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const esAdmin = ['admin', 'inspector_responsable'].includes(u.rol)
    const esInspector = ['inspector', 'auxiliar'].includes(u.rol)

    if (!esAdmin && !esInspector) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { ordenes } = await req.json() as { ordenes: { id: string; orden: number }[] }
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      return NextResponse.json({ error: 'ordenes[] requerido' }, { status: 400 })
    }

    const db = await createServiceClient()

    // If inspector/auxiliar (not admin), verify all expedientes belong to them (or their inspector)
    if (!esAdmin) {
      const ids = ordenes.map(o => o.id)
      const { data: exps } = await db
        .from('expedientes')
        .select('id, inspector_id')
        .in('id', ids)

      // Para auxiliares: buscar su inspector_id en la tabla usuarios
      let inspectorIdEfectivo = user.id
      if (u.rol === 'auxiliar') {
        const { data: auxData } = await db
          .from('usuarios')
          .select('inspector_id')
          .eq('id', user.id)
          .single()
        if (auxData?.inspector_id) inspectorIdEfectivo = auxData.inspector_id
      }

      const allMine = (exps ?? []).every(e => e.inspector_id === inspectorIdEfectivo)
      if (!allMine) {
        return NextResponse.json({ error: 'Solo puedes reordenar tus propios expedientes' }, { status: 403 })
      }
    }

    // Update each row individually (Supabase JS v2 doesn't support bulk update with different values)
    const updates = ordenes.map(({ id, orden }) =>
      db.from('expedientes').update({ orden_inspector: orden }).eq('id', id)
    )
    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[expedientes/reordenar POST]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
