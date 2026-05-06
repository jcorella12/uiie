import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id } = await req.json().catch(() => ({}))
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Falta id del inversor' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Bloquea borrar si hay expedientes activos (cualquier estado != cerrado/rechazado) que lo usen
    const { data: enUso, error: usoErr } = await db
      .from('expedientes')
      .select('id, numero_inspeccion, status')
      .or(`inversor_id.eq.${id},cli_inversor_id.eq.${id}`)
      .not('status', 'in', '(cerrado,rechazado)')
      .limit(5)

    if (usoErr) throw usoErr

    if (enUso && enUso.length > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar: el inversor está en uso en expedientes activos',
          expedientes: enUso.map(e => e.numero_inspeccion ?? e.id),
        },
        { status: 409 },
      )
    }

    // Soft delete — preserva referencias históricas en expedientes cerrados
    const { error } = await db
      .from('inversores')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[POST /api/inversores/eliminar]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
