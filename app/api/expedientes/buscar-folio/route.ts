import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/expedientes/buscar-folio?folio=UIIE-543-2026
 *
 * Busca un expediente por su numero_folio. Devuelve { expediente_id }
 * si lo encuentra. Solo admin/responsable.
 *
 * Útil para flujos de "asignar manualmente por folio" en la bandeja
 * CNE pendientes.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const url = new URL(req.url)
  const folio = url.searchParams.get('folio')?.trim()
  if (!folio) return NextResponse.json({ error: 'Falta ?folio' }, { status: 400 })

  const db = await createServiceClient()
  const { data: exp } = await db
    .from('expedientes')
    .select('id, numero_folio, status, nombre_cliente_final')
    .eq('numero_folio', folio)
    .maybeSingle()

  if (!exp) return NextResponse.json({ error: 'Folio no encontrado', expediente_id: null }, { status: 404 })

  return NextResponse.json({
    expediente_id:        exp.id,
    numero_folio:         exp.numero_folio,
    status:               exp.status,
    nombre_cliente_final: exp.nombre_cliente_final,
  })
}
