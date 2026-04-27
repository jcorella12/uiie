import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveInspectorId } from '@/lib/auth/effective-inspector'
import { Calendario } from '@/components/agenda/Calendario'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AgendaInspectorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('usuarios')
    .select('id, nombre, rol')
    .eq('id', user.id)
    .single()

  // Fallback al JWT si el registro de DB no se encuentra (e.g. UUID mismatch post-import)
  const meta = (user as any).user_metadata as { rol?: string; nombre?: string } | undefined
  const rol  = me?.rol ?? meta?.rol ?? 'inspector'
  const nombre = me?.nombre ?? meta?.nombre ?? user.email ?? 'Usuario'

  // Redirigir a sus dashboards naturales
  if (rol === 'admin')    redirect('/dashboard/admin/agenda')
  if (rol === 'cliente')  redirect('/dashboard/cliente')

  const isResponsable = rol === 'inspector_responsable'
  const isAuxiliar    = rol === 'auxiliar'

  // Auxiliar ve la agenda de su inspector
  const effectiveId = await getEffectiveInspectorId(supabase, user.id, rol)

  const inspectores = isResponsable
    ? ((await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('rol', ['inspector', 'inspector_responsable'])
        .eq('activo', true)
        .order('nombre')).data ?? [])
    : []

  const titulo = isResponsable ? 'Agenda del Equipo'
    : isAuxiliar ? 'Agenda del Inspector'
    : `Mi Agenda`

  const subtitulo = isResponsable
    ? 'Inspecciones de todos los inspectores'
    : isAuxiliar
    ? `Calendario de inspecciones — ${nombre}`
    : 'Calendario de inspecciones'

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{subtitulo}</p>
          </div>
        </div>
        {!isAuxiliar && (
          <Link href="/dashboard/inspector/agenda/nueva" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Programar
          </Link>
        )}
      </div>

      <Calendario
        inspectorId={isResponsable ? undefined : effectiveId}
        isAdmin={isResponsable}
        inspectores={inspectores}
      />
    </div>
  )
}
