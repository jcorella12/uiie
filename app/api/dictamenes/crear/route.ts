import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'inspector_responsable'].includes(u?.rol ?? '')
  const db = esAdmin ? await createServiceClient() : supabase

  const body = await req.json()

  // Get the expediente — admin can access any, inspector only their own
  const { data: exp } = await db
    .from('expedientes')
    .select('numero_folio, inspector_id, kwp')
    .eq('id', body.expediente_id)
    .single()

  // For non-admin, verify they own the expediente
  if (!exp || (!esAdmin && exp.inspector_id !== user.id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await db
    .from('dictamenes')
    .insert({
      expediente_id:           body.expediente_id,
      inspector_id:            exp.inspector_id ?? user.id,
      numero_folio:            exp.numero_folio,
      resultado:               body.resultado,
      fecha_inspeccion:        body.fecha_inspeccion,
      fecha_emision:           new Date().toISOString().split('T')[0],
      potencia_kwp:            body.potencia_kwp ?? exp.kwp,
      norma_aplicable:         body.norma_aplicable ?? 'NOM-001-SEDE-2012',
      cumple_norma:            body.cumple_norma ?? true,
      observaciones_generales: body.observaciones_generales,
      observaciones_tecnicas:  body.observaciones_tecnicas,
      recomendaciones:         body.recomendaciones,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
