import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { Plus, FileText, AlertTriangle, TrendingUp } from 'lucide-react'

const COMISION_RESPONSABLE = 0.40  // 40% para Joaquín
const COMISION_INSPECTOR   = 0.60  // 60% para el inspector

export default async function MisSolicitudes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const isAuxiliar = me?.rol === 'auxiliar'

  // RLS already filters by inspector_id = auth.uid()
  const { data: solicitudes } = await supabase
    .from('solicitudes_folio')
    .select('id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, porcentaje_precio, status, requiere_autorizacion, fecha_estimada, created_at, folio:folios_lista_control(numero_folio)')
    .order('created_at', { ascending: false })

  const STATUS_BADGE: Record<string, string> = {
    pendiente: 'badge-pendiente', en_revision: 'badge-en_revision',
    aprobada: 'badge-aprobada', rechazada: 'badge-rechazada', folio_asignado: 'badge-folio_asignado',
  }
  const STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente', en_revision: 'En Revisión', aprobada: 'Aprobada',
    rechazada: 'Rechazada', folio_asignado: 'Folio Asignado',
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Folio</h1>
          <p className="text-gray-500 text-sm mt-1">Historial de solicitudes enviadas</p>
        </div>
        <Link href="/dashboard/inspector/solicitudes/nueva" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </Link>
      </div>

      {/* ── Resumen de comisiones del mes — solo inspectores ── */}
      {!isAuxiliar && solicitudes && solicitudes.length > 0 && (() => {
        const emitidas = solicitudes.filter(s => s.status === 'folio_asignado')
        const totalSinIva = emitidas.reduce((sum, s) => sum + (s.precio_propuesto ?? 0), 0)
        const miComision = totalSinIva * COMISION_INSPECTOR
        return (
          <div className="card mb-6 border-l-4 border-brand-green">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-green" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm mb-3">Cotización interna — Distribución del ingreso</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Folios asignados</p>
                    <p className="font-bold text-gray-800">{emitidas.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total s/IVA</p>
                    <p className="font-bold text-gray-800">{formatCurrency(totalSinIva)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tu comisión (60%)</p>
                    <p className="font-bold text-brand-green">{formatCurrency(miComision)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Responsable (40%)</p>
                    <p className="font-bold text-gray-600">{formatCurrency(totalSinIva * COMISION_RESPONSABLE)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">* Solo solicitudes con folio asignado. Viáticos son 100% del inspector y no se incluyen.</p>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="card">
        {!solicitudes?.length ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin solicitudes registradas</p>
            <p className="text-sm mt-1">Crea tu primera solicitud de folio.</p>
            <Link href="/dashboard/inspector/solicitudes/nueva" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" /> Nueva Solicitud
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Cliente</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">kWp</th>
                  {!isAuxiliar && <th className="text-right py-3 px-3 font-medium text-gray-500">Precio</th>}
                  {!isAuxiliar && <th className="text-right py-3 px-3 font-medium text-gray-500">% Tabulador</th>}
                  <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Folio</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Fecha Est.</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Creada</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => {
                  const folio = s.folio as any
                  const pct = s.porcentaje_precio ?? 0
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div>
                            <span className="font-medium text-gray-800 truncate max-w-[180px] block">{s.cliente_nombre ?? '—'}</span>
                            {(s as any).propietario_nombre && (
                              <span className="text-xs text-gray-400 truncate max-w-[180px] block">
                                Sitio: {(s as any).propietario_nombre}
                              </span>
                            )}
                          </div>
                          {s.requiere_autorizacion && (
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700">{s.kwp}</td>
                      {!isAuxiliar && <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(s.precio_propuesto)}</td>}
                      {!isAuxiliar && (
                        <td className="py-3 px-3 text-right">
                          <span className={`font-semibold ${pct >= 100 ? 'text-brand-green' : pct >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3 text-center">
                        <span className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status]}</span>
                      </td>
                      <td className="py-3 px-3 text-sm font-mono text-brand-green">
                        {folio?.numero_folio ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500">{formatDateShort(s.fecha_estimada)}</td>
                      <td className="py-3 px-3 text-right text-gray-400">{formatDateShort(s.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
