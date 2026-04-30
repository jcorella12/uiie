import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default async function TodasSolicitudes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['inspector_responsable', 'admin'].includes(usuario?.rol ?? '')) redirect('/dashboard/inspector')

  const { data: solicitudes } = await supabase
    .from('solicitudes_folio')
    .select(`
      id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, porcentaje_precio, status,
      requiere_autorizacion, ciudad, fecha_estimada, created_at,
      inspector:usuarios!inspector_id(nombre, apellidos),
      folio:folios_lista_control(numero_folio)
    `)
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Todas las Solicitudes</h1>
        <p className="text-gray-500 text-sm mt-1">Vista global de todos los inspectores</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Cliente</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Inspector</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">kWp</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Precio</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">%</th>
              <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Folio</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(solicitudes ?? []).map((s) => {
              const insp = s.inspector as any
              const folio = s.folio as any
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-800 truncate max-w-[160px]">{s.cliente_nombre ?? '—'}</span>
                      {s.requiere_autorizacion && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    {(s as any).propietario_nombre && (
                      <p className="text-xs text-gray-400">Sitio: {(s as any).propietario_nombre}</p>
                    )}
                    <p className="text-xs text-gray-400">{s.ciudad}</p>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 truncate max-w-[120px]">
                    {insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right">{s.kwp}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(s.precio_propuesto)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-semibold text-xs ${s.porcentaje_precio >= 100 ? 'text-brand-green' : s.porcentaje_precio >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.porcentaje_precio.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status]}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-brand-green">{folio?.numero_folio ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400 text-xs">{formatDateShort(s.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!solicitudes?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin solicitudes registradas.</div>
        )}
      </div>
    </div>
  )
}
