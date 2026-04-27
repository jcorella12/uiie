import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { ClipboardList, AlertTriangle } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  pendiente: 'badge-pendiente',
  en_revision: 'badge-en_revision',
  aprobada: 'badge-aprobada',
  rechazada: 'badge-rechazada',
  folio_asignado: 'badge-folio_asignado',
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  folio_asignado: 'Folio Asignado',
}

export default async function GestionSolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')) {
    redirect('/dashboard')
  }

  const { data: solicitudes } = await supabase
    .from('solicitudes_folio')
    .select(`
      id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, status,
      requiere_autorizacion, created_at,
      inspector:usuarios!inspector_id(nombre, apellidos)
    `)
    .order('created_at', { ascending: false })

  const lista = solicitudes ?? []

  // Summary counts
  const total = lista.length
  const pendientes = lista.filter((s) => s.status === 'pendiente').length
  const enRevision = lista.filter((s) => s.status === 'en_revision').length
  const folioAsignado = lista.filter((s) => s.status === 'folio_asignado').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Solicitudes</h1>
          <p className="text-gray-500 text-sm mt-1">Todas las solicitudes de folio del sistema</p>
        </div>
        <Link href="/dashboard/admin/folios" className="btn-primary flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Asignar folios
        </Link>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm shadow-sm">
          <span className="font-semibold text-gray-800">{total}</span>
          <span className="text-gray-500">Total</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-sm">
          <span className="font-semibold text-yellow-800">{pendientes}</span>
          <span className="text-yellow-700">Pendientes</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm">
          <span className="font-semibold text-blue-800">{enRevision}</span>
          <span className="text-blue-700">En revisión</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 text-sm">
          <span className="font-semibold text-purple-800">{folioAsignado}</span>
          <span className="text-purple-700">Folio asignado</span>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-6">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin solicitudes registradas</p>
            <p className="text-sm mt-1">Las solicitudes de los inspectores aparecerán aquí.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Inspector</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">kWp</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Precio</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Autorización</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Fecha</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => {
                const insp = s.inspector as any
                const nextIsFolioAsignado =
                  s.status === 'pendiente' || s.status === 'en_revision'
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 max-w-[180px]">
                      <span className="font-medium text-gray-800 block truncate">{s.cliente_nombre ?? '—'}</span>
                      {(s as any).propietario_nombre && (
                        <span className="text-xs text-gray-400 block truncate">Sitio: {(s as any).propietario_nombre}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{s.kwp}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(s.precio_propuesto)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={STATUS_BADGE[s.status] ?? 'badge-pendiente'}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.requiere_autorizacion && (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> Auth
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {formatDateShort(s.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/admin/solicitudes/${s.id}`}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium hover:underline"
                        >
                          Revisar →
                        </Link>
                        {nextIsFolioAsignado && (
                          <Link
                            href={`/dashboard/admin/folios?solicitud_id=${s.id}`}
                            className="text-xs text-brand-green hover:text-brand-green-dark font-semibold hover:underline whitespace-nowrap"
                          >
                            Folio →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
