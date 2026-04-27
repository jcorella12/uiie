import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/expedientes/testigos
 * Asigna o desvincula un testigo en un expediente (orden 1 o 2).
 * Body: { expediente_id, orden: 1|2, testigo_id?: string }
 *   - Si testigo_id está presente → upsert
 *   - Si testigo_id es null/undefined → eliminar el slot
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { expediente_id, orden, testigo_id } = await req.json()
  if (!expediente_id || !orden) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verify the user has access to this expediente
  const { data: exp } = await supabase
    .from('expedientes')
    .select('inspector_id')
    .eq('id', expediente_id)
    .single()

  if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')
  if (exp.inspector_id !== user.id && !esAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (testigo_id) {
    const { error } = await supabase
      .from('expediente_testigos')
      .upsert({ expediente_id, testigo_id, orden }, { onConflict: 'expediente_id,orden' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    await supabase
      .from('expediente_testigos')
      .delete()
      .eq('expediente_id', expediente_id)
      .eq('orden', orden)
  }

  return NextResponse.json({ ok: true })
}
