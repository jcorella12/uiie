import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import SolicitudRevisar from './SolicitudRevisar'
import RecrerarExpedienteBtn from './RecrerarExpedienteBtn'

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

interface Props {
  params: Promise<{ id: string }>
}

export default async function SolicitudDetallePage({ params }: Props) {
  const { id } = await params

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

  const { data: solicitud, error } = await supabase
    .from('solicitudes_folio')
    .select(`
      id, cliente_nombre, propietario_nombre, cliente_id, tipo_persona, kwp,
      precio_propuesto, precio_base, porcentaje_precio,
      requiere_autorizacion, status,
      ciudad, estado_mx, fecha_estimada,
      notas_inspector, notas_responsable,
      folio_asignado_id, revisado_por, fecha_revision, created_at,
      inspector:usuarios!inspector_id(id, nombre, apellidos, email, telefono),
      folio:folios_lista_control(numero_folio),
      revisor:usuarios!revisado_por(nombre, apellidos)
    `)
    .eq('id', id)
    .single()

  if (error || !solicitud) notFound()

  // Si ya tiene folio asignado, buscar el expediente correspondiente
  let expedienteId: string | null = null
  if ((solicitud as any).folio_asignado_id) {
    const { data: exp } = await supabase
      .from('expedientes')
      .select('id')
      .eq('folio_id', (solicitud as any).folio_asignado_id)
      .maybeSingle()
    expedienteId = exp?.id ?? null
  }

  const insp = solicitud.inspector as any
  const folio = solicitud.folio as any
  const revisor = solicitud.revisor as any
  const pct = solicitud.porcentaje_precio ?? 0
  const pctColor = pct >= 100 ? 'text-brand-green' : pct >= 70 ? 'text-yellow-600' : 'text-red-600'
  const precioConIva = (solicitud.precio_propuesto ?? 0) * 1.16

  const canTakeAction = ['pendiente', 'en_revision', 'aprobada'].includes(solicitud.status)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/admin/solicitudes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Revisión de Solicitud</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {solicitud.cliente_nombre ?? '—'}
            {(solicitud as any).propietario_nombre ? ` · Sitio: ${(solicitud as any).propietario_nombre}` : ''}
            {' · '}{formatDateShort(solicitud.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={STATUS_BADGE[solicitud.status] ?? 'badge-pendiente'}>
            {STATUS_LABEL[solicitud.status] ?? solicitud.status}
          </span>
          {expedienteId && (
            <Link
              href={`/dashboard/admin/expedientes/${expedienteId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green-dark transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Ver expediente
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Alert: requiere autorización */}
          {solicitud.requiere_autorizacion && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800 text-sm">Requiere autorización especial</p>
                <p className="text-orange-700 text-xs mt-0.5">
                  El precio propuesto está por debajo del 70 % del tabulador base ({formatCurrency(solicitud.precio_base ?? 0)}).
                </p>
              </div>
            </div>
          )}

          {/* Cliente / Proyecto */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Datos del Proyecto
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Cliente / EPC</dt>
                <dd className="font-medium text-gray-800">{solicitud.cliente_nombre ?? '—'}</dd>
              </div>
              {(solicitud as any).propietario_nombre && (
                <div>
                  <dt className="text-xs text-gray-500">Propietario del Sitio</dt>
                  <dd className="font-medium text-gray-800">{(solicitud as any).propietario_nombre}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">Tipo de persona</dt>
                <dd className="font-medium text-gray-800 capitalize">{solicitud.tipo_persona}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Ciudad</dt>
                <dd className="font-medium text-gray-800">{solicitud.ciudad ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Estado</dt>
                <dd className="font-medium text-gray-800">{solicitud.estado_mx ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Potencia (kWp)</dt>
                <dd className="font-bold text-gray-900">{solicitud.kwp} kWp</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Fecha estimada</dt>
                <dd className="font-medium text-gray-800">{formatDateShort(solicitud.fecha_estimada)}</dd>
              </div>
            </dl>
          </div>

          {/* Pricing */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Precio y Tabulador</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Precio tabulador base</dt>
                <dd className="font-medium text-gray-800">{formatCurrency(solicitud.precio_base ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Precio propuesto s/IVA</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(solicitud.precio_propuesto ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Precio c/IVA (16 %)</dt>
                <dd className="font-medium text-gray-700">{formatCurrency(precioConIva)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">% del tabulador</dt>
                <dd className={`font-bold ${pctColor}`}>{pct.toFixed(1)} %</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Comisión inspector (60 %)</dt>
                <dd className="font-medium text-brand-green">{formatCurrency((solicitud.precio_propuesto ?? 0) * 0.60)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Comisión unidad (40 %)</dt>
                <dd className="font-medium text-gray-600">{formatCurrency((solicitud.precio_propuesto ?? 0) * 0.40)}</dd>
              </div>
            </dl>
          </div>

          {/* Inspector notes */}
          {solicitud.notas_inspector && (
            <div className="card border-l-4 border-blue-300">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Notas del Inspector</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{solicitud.notas_inspector}</p>
            </div>
          )}

          {/* Folio info if assigned */}
          {folio?.numero_folio && (
            <div className="card border-l-4 border-brand-green">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-1">Folio Asignado</h2>
                  <p className="font-mono font-bold text-brand-green text-lg">{folio.numero_folio}</p>
                </div>
                {expedienteId && (
                  <Link
                    href={`/dashboard/admin/expedientes/${expedienteId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Ir al expediente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — inspector + actions */}
        <div className="space-y-5">
          {/* Inspector info */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Inspector</h2>
            {insp ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">{insp.nombre} {insp.apellidos ?? ''}</p>
                {insp.email && <p className="text-gray-500 text-xs">{insp.email}</p>}
                {insp.telefono && <p className="text-gray-500 text-xs">{insp.telefono}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin asignar</p>
            )}
          </div>

          {/* Revision info */}
          {revisor && (
            <div className="card bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">Revisado por</h2>
              <p className="text-sm font-medium text-gray-800">{revisor.nombre} {revisor.apellidos ?? ''}</p>
              {solicitud.fecha_revision && (
                <p className="text-xs text-gray-400 mt-1">{formatDateShort(solicitud.fecha_revision)}</p>
              )}
              {solicitud.notas_responsable && (
                <p className="text-xs text-gray-600 mt-2 italic whitespace-pre-wrap">{solicitud.notas_responsable}</p>
              )}
            </div>
          )}

          {/* Action panel */}
          {canTakeAction ? (
            <SolicitudRevisar
              solicitudId={solicitud.id}
              currentStatus={solicitud.status}
              currentNotas={solicitud.notas_responsable ?? ''}
            />
          ) : (
            <div className="card bg-gray-50 text-center py-6">
              {solicitud.status === 'folio_asignado' ? (
                <>
                  <CheckCircle className="w-8 h-8 text-brand-green mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Folio asignado</p>
                  <p className="text-xs text-gray-400 mt-1">Esta solicitud ya fue procesada completamente.</p>
                </>
              ) : (
                <>
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin acciones disponibles</p>
                </>
              )}
            </div>
          )}

          {/* Link to assign folio if approved */}
          {solicitud.status === 'aprobada' && (
            <Link
              href={`/dashboard/admin/folios?solicitud_id=${solicitud.id}`}
              className="btn-primary w-full text-center block"
            >
              Asignar Folio →
            </Link>
          )}

          {/* Recover missing expediente — folio assigned but expediente never created */}
          {solicitud.status === 'folio_asignado' && !expedienteId && (
            <RecrerarExpedienteBtn solicitudId={solicitud.id} />
          )}
        </div>
      </div>
    </div>
  )
}
