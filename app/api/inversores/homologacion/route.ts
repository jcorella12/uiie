import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/inversores/homologacion?marca=Huawei
 *
 * Devuelve la información de homologación CNE para una marca de inversor.
 * Si la marca no tiene homologación vigente, devuelve `null`.
 *
 * El frontend de "Lista de verificación" y "Acta" llaman este endpoint para
 * obtener la redacción sugerida cuando el expediente tiene un inversor de
 * marca homologada (e.g. Huawei).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const url = new URL(req.url)
  const marca = url.searchParams.get('marca')?.trim()
  if (!marca) return NextResponse.json({ error: 'marca requerida' }, { status: 400 })

  const { data, error } = await supabase
    .from('inversor_homologaciones')
    .select('marca, oficio_cne_numero, oficio_cne_fecha, oficio_cne_nombre, carta_marca_fecha, carta_marca_nombre, redaccion_lista, redaccion_acta, vigente')
    .ilike('marca', marca)
    .eq('vigente', true)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ homologacion: data ?? null })
}
