import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AsignarFoliosClient from '@/components/admin/AsignarFoliosClient'

export default async function AsignarFoliosPage({
  searchParams,
}: {
  searchParams: { solicitud?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')) redirect('/dashboard')

  const [
    { data: solicitudes },
    { data: foliosDisponibles },
    { data: maxAsignadoRow },
  ] = await Promise.all([
    supabase
      .from('solicitudes_folio')
      .select(`
        id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, porcentaje_precio,
        status, requiere_autorizacion, notas_inspector, ciudad, fecha_estimada, created_at,
        inspector:usuarios!inspector_id(id, nombre, apellidos, email)
      `)
      .in('status', ['pendiente', 'en_revision'])
      .order('created_at', { ascending: true }),
    supabase
      .from('folios_lista_control')
      .select('id, numero_folio, numero_secuencial')
      .eq('asignado', false)
      .order('numero_secuencial', { ascending: true })
      .limit(200),
    // Número secuencial más alto actualmente asignado
    supabase
      .from('folios_lista_control')
      .select('numero_secuencial')
      .eq('asignado', true)
      .order('numero_secuencial', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const maxSecuencialAsignado: number = (maxAsignadoRow as any)?.numero_secuencial ?? 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Asignación de Folios</h1>
        <p className="text-gray-500 text-sm mt-1">
          {foliosDisponibles?.length ?? 0} folios disponibles ·{' '}
          {solicitudes?.length ?? 0} solicitudes en cola
        </p>
      </div>
      <AsignarFoliosClient
        solicitudes={(solicitudes ?? []) as any}
        foliosDisponibles={foliosDisponibles ?? []}
        solicitudIdParam={searchParams.solicitud}
        maxSecuencialAsignado={maxSecuencialAsignado}
      />
    </div>
  )
}
