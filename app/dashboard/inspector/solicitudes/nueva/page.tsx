import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import NuevaSolicitudForm from '@/components/solicitudes/NuevaSolicitudForm'

export default async function NuevaSolicitudPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol, nombre').eq('id', user.id).single()
  if (!['inspector', 'inspector_responsable'].includes(usuario?.rol ?? '')) redirect('/dashboard')

  // Load EPC/integrador clients for the dropdown
  // es_epc = true filtra solo los integradores (Greenlux, Dicoma, etc.)
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre')
    .eq('es_epc', true)
    .order('nombre')

  // Cargar lista de inspectores activos para el dropdown de "ejecutor"
  // Usamos serviceClient porque RLS bloquea a inspectores ver otros usuarios
  const dbAdmin = await createServiceClient()
  const { data: inspectores } = await dbAdmin
    .from('usuarios')
    .select('id, nombre, apellidos')
    .in('rol', ['inspector', 'inspector_responsable', 'auxiliar'])
    .eq('activo', true)
    .order('nombre')

  const nombreActual = `${usuario?.nombre ?? ''}`.trim() || user.email || 'Yo'

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Folio</h1>
        <p className="text-gray-500 text-sm mt-1">Completa el formulario para solicitar un folio de inspección</p>
      </div>
      <NuevaSolicitudForm
        inspectorId={user.id}
        inspectorNombre={nombreActual}
        clientes={clientes ?? []}
        inspectores={(inspectores ?? []) as any}
      />
    </div>
  )
}
