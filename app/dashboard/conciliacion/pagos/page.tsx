import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ConciliacionAdmin from '@/components/conciliacion/ConciliacionAdmin'

export default async function PagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuarioData || !['admin', 'inspector_responsable'].includes(usuarioData.rol)) {
    redirect('/dashboard')
  }

  const db = await createServiceClient()

  // Todas las conciliaciones con datos del inspector
  const { data: conciliaciones } = await db
    .from('conciliaciones')
    .select(`
      id, mes, anio, status, total_expedientes, total_kwp,
      inspector_acepto_at,
      factura_url, factura_nombre, factura_subida_at,
      comprobante_url, comprobante_nombre, comprobante_subido_at,
      inspector:usuarios!inspector_id(id, nombre, apellidos)
    `)
    .order('anio',  { ascending: false })
    .order('mes',   { ascending: false })
    .order('inspector_acepto_at', { ascending: false })

  // Para cada conciliación, cargar sus expedientes
  const conciliacionesConExp = await Promise.all(
    (conciliaciones ?? []).map(async (conc) => {
      const { data: junc } = await db
        .from('conciliacion_expedientes')
        .select('expediente:expedientes(id, numero_folio, kwp, ciudad, status, cliente:clientes(nombre))')
        .eq('conciliacion_id', conc.id)

      const expedientes = (junc ?? []).map((r: any) => r.expediente).filter(Boolean)
      return { ...conc, expedientes }
    })
  )

  const now       = new Date()
  const mesActual  = now.getMonth() + 1
  const anioActual = now.getFullYear()

  return (
    <ConciliacionAdmin
      conciliaciones={conciliacionesConExp as any}
      mesActual={mesActual}
      anioActual={anioActual}
    />
  )
}
