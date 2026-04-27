import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KPICard from '@/components/dashboard/KPICard'
import FinancieroKPIs from '@/components/dashboard/FinancieroKPIs'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import { ClipboardList, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')) redirect('/dashboard')

  const [
    { count: pendientes },
    { count: enRevision },
    { count: asignados },
    { count: foliosLibres },
    { data: cola },
  ] = await Promise.all([
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'en_revision'),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'folio_asignado'),
    supabase.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', false),
    supabase.from('solicitudes_folio')
      .select('id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, status, requiere_autorizacion, created_at, inspector:usuarios!inspector_id(nombre, apellidos)')
      .in('status', ['pendiente', 'en_revision'])
      .order('created_at', { ascending: true })
      .limit(10),
  ])

  const STATUS_BADGE: Record<string, string> = {
    pendiente: 'badge-pendiente',
    en_revision: 'badge-en_revision',
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Cola de revisión, asignación de folios y finanzas</p>
      </div>

      {/* ── Finanzas ── */}
      <FinancieroKPIs />

      {/* ── KPIs operativos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard title="Solicitudes Pendientes" value={pendientes ?? 0} subtitle="Sin revisar" icon={ClipboardList} color="orange" />
        <KPICard title="En Revisión" value={enRevision ?? 0} subtitle="Requieren autorización" icon={AlertTriangle} color="blue" />
        <KPICard title="Folios Asignados" value={asignados ?? 0} subtitle="Total histórico" icon={CheckCircle} color="green" />
        <KPICard title="Folios Disponibles" value={foliosLibres ?? 0} subtitle="En lista de control" icon={FileText} color="purple" />
      </div>

      {/* Cola de revisión */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Cola de Revisión Pendiente</h2>
          <Link href="/dashboard/admin/folios" className="btn-primary text-sm py-1.5 px-4">
            Asignar Folios
          </Link>
        </div>

        {!cola?.length ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">¡Cola vacía!</p>
            <p className="text-sm mt-1">No hay solicitudes pendientes de asignación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Inspector</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">kWp</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Precio</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Estado</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Alerta</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cola.map((s) => {
                  const insp = s.inspector as any
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <span className="font-medium text-gray-800 block truncate">{s.cliente_nombre ?? '—'}</span>
                        {(s as any).propietario_nombre && (
                          <span className="text-xs text-gray-400 block truncate">Sitio: {(s as any).propietario_nombre}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">{s.kwp}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(s.precio_propuesto)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={STATUS_BADGE[s.status] ?? 'badge-pendiente'}>
                          {s.status === 'pendiente' ? 'Pendiente' : 'En Revisión'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {s.requiere_autorizacion && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> Precio bajo
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatDateShort(s.created_at)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href={`/dashboard/admin/folios?solicitud=${s.id}`}
                          className="text-xs text-brand-green hover:text-brand-green-dark font-semibold hover:underline"
                        >
                          Asignar folio
                        </Link>
                      </td>
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
