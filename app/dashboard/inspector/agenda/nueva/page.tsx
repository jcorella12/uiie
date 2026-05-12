import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NuevaInspeccionForm from '@/components/agenda/NuevaInspeccionForm'

export default async function NuevaInspeccionPage({
  searchParams,
}: {
  searchParams: { expediente_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['inspector', 'inspector_responsable'].includes(usuario?.rol ?? '')) {
    redirect('/dashboard')
  }

  const isResponsable = usuario?.rol === 'inspector_responsable'

  // Fetch current user profile for the form default
  const { data: usuarioPerfil } = await supabase
    .from('usuarios')
    .select('id, nombre, apellidos')
    .eq('id', user.id)
    .single()

  const [{ data: expedientes }, { data: testigos }, { data: inspeccionesRaw }, { data: inspectores }] = await Promise.all([
    isResponsable
      // Inspector responsable puede programar para cualquier expediente activo
      ? supabase
          .from('expedientes')
          .select('id, numero_folio, kwp, estado_mx, cliente:clientes(nombre), inspector:usuarios!inspector_id(nombre)')
          .not('status', 'eq', 'cerrado')
          .order('created_at', { ascending: false })
      // Inspector normal: solo sus propios expedientes
      : supabase
          .from('expedientes')
          .select('id, numero_folio, kwp, estado_mx, cliente:clientes(nombre)')
          .eq('inspector_id', user.id)
          .not('status', 'eq', 'cerrado')
          .order('created_at', { ascending: false }),
    supabase
      .from('testigos')
      .select('id, nombre, apellidos, empresa')
      .eq('activo', true)
      .order('nombre'),
    // Todas las inspecciones (pasadas y futuras) para colorear el calendario
    isResponsable
      ? supabase
          .from('inspecciones_agenda')
          .select('fecha_hora, expediente:expedientes(numero_folio, ciudad, estado_mx, nombre_cliente_final, cliente:clientes(nombre))')
          .in('status', ['programada', 'en_curso', 'realizada'])
          .order('fecha_hora')
      : supabase
          .from('inspecciones_agenda')
          .select('fecha_hora, expediente:expedientes(numero_folio, ciudad, estado_mx, nombre_cliente_final, cliente:clientes(nombre))')
          .eq('inspector_id', user.id)
          .in('status', ['programada', 'en_curso', 'realizada'])
          .order('fecha_hora'),
    // Lista de todos los inspectores activos para la delegación
    supabase
      .from('usuarios')
      .select('id, nombre, apellidos')
      .in('rol', ['inspector', 'inspector_responsable'])
      .order('nombre'),
  ])

  const inspeccionesExistentes = (inspeccionesRaw ?? []).map((i: any) => ({
    fecha_hora:    i.fecha_hora as string,
    numero_folio:  i.expediente?.numero_folio as string | null,
    cliente:       (i.expediente?.nombre_cliente_final ?? i.expediente?.cliente?.nombre) as string | null,
    ciudad:        i.expediente?.ciudad as string | null,
    estado:        i.expediente?.estado_mx as string | null,
  }))

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Programar Inspección</h1>
        <p className="text-gray-500 text-sm mt-1">
          Completa el formulario para agendar una nueva inspección
        </p>
      </div>
      <NuevaInspeccionForm
        expedientes={(expedientes ?? []) as any[]}
        testigos={(testigos ?? []) as any[]}
        inspectores={(inspectores ?? []) as any[]}
        currentUserId={user.id}
        currentUserNombre={
          usuarioPerfil
            ? `${usuarioPerfil.nombre} ${usuarioPerfil.apellidos ?? ''}`.trim()
            : ''
        }
        defaultExpedienteId={searchParams.expediente_id}
        showInspector={isResponsable}
        inspeccionesExistentes={inspeccionesExistentes}
      />
    </div>
  )
}
