import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS } from '@/lib/utils'
import { formatDateShort } from '@/lib/utils'
import { Users, FolderOpen, CheckCircle, Clock } from 'lucide-react'

export default async function InspectoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check via DB (not user_metadata — can be stale)
  const { data: me } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  if (!me || !['inspector_responsable', 'admin'].includes(me.rol)) redirect('/dashboard/inspector')

  // Fetch inspectors AND inspector_responsable users
  const { data: inspectores } = await supabase
    .from('usuarios')
    .select('id, nombre, apellidos, email, rol, activo, created_at')
    .in('rol', ['inspector', 'inspector_responsable'])
    .order('nombre')

  // Fetch expediente counts per inspector
  const { data: expedienteStats } = await supabase
    .from('expedientes')
    .select('inspector_id, status')

  // Fetch solicitud counts per inspector
  const { data: solicitudStats } = await supabase
    .from('solicitudes_folio')
    .select('inspector_id, status')

  // Build stats map
  const expMap: Record<string, { total: number; activos: number }> = {}
  const solMap: Record<string, { total: number; pendientes: number }> = {}

  for (const e of expedienteStats ?? []) {
    if (!expMap[e.inspector_id]) expMap[e.inspector_id] = { total: 0, activos: 0 }
    expMap[e.inspector_id].total++
    if (['en_proceso', 'revision'].includes(e.status)) expMap[e.inspector_id].activos++
  }
  for (const s of solicitudStats ?? []) {
    if (!solMap[s.inspector_id]) solMap[s.inspector_id] = { total: 0, pendientes: 0 }
    solMap[s.inspector_id].total++
    if (s.status === 'pendiente') solMap[s.inspector_id].pendientes++
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspectores</h1>
          <p className="text-gray-500 text-sm mt-1">
            {inspectores?.length ?? 0} miembro{(inspectores?.length ?? 0) !== 1 ? 's' : ''} del equipo inspector
          </p>
        </div>
      </div>

      {!inspectores?.length ? (
        <div className="card text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Sin inspectores registrados</p>
          <p className="text-sm mt-1">Los inspectores se crean desde el panel de administración.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {inspectores.map((insp) => {
            const exp = expMap[insp.id] ?? { total: 0, activos: 0 }
            const sol = solMap[insp.id] ?? { total: 0, pendientes: 0 }
            const fullName = [insp.nombre, insp.apellidos].filter(Boolean).join(' ')

            return (
              <div key={insp.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-green-light flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-green font-bold text-lg">
                      {insp.nombre?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{insp.email}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        insp.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {insp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {insp.rol === 'inspector_responsable' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-green-light text-brand-green">
                          Responsable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FolderOpen className="w-4 h-4 text-brand-green" />
                      <span className="text-xs text-gray-500">Expedientes</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{exp.total}</p>
                    <p className="text-xs text-gray-400">{exp.activos} activos</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-brand-orange" />
                      <span className="text-xs text-gray-500">Solicitudes</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{sol.total}</p>
                    <p className="text-xs text-gray-400">{sol.pendientes} pendientes</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Desde {formatDateShort(insp.created_at)}</span>
                  <a
                    href={`/dashboard/admin/usuarios?inspector=${insp.id}`}
                    className="text-xs text-brand-green hover:underline font-medium"
                  >
                    Ver detalle →
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
