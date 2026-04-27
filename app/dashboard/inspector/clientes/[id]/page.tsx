import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDateShort } from '@/lib/utils'
import ClienteForm from '@/components/clientes/ClienteForm'
import INECaptura from '@/components/ocr/INECaptura'
import PortalAccesoButtons from '@/components/clientes/PortalAccesoButtons'
import {
  ArrowLeft,
  User,
  Building2,
  FileText,
  ChevronRight,
  Eye,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-52 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words">
        {value ?? <span className="text-gray-400">—</span>}
      </span>
    </div>
  )
}

const EXPEDIENTE_STATUS_BADGE: Record<string, string> = {
  borrador: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
  en_proceso: 'badge-en_revision',
  revision: 'badge-pendiente',
  aprobado: 'badge-aprobada',
  rechazado: 'badge-rechazada',
  cerrado: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
}

const EXPEDIENTE_STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  en_proceso: 'En Proceso',
  revision: 'En Revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cerrado: 'Cerrado',
}

const FIGURA_LABELS: Record<string, string> = {
  representante_legal: 'Representante Legal',
  gestor: 'Gestor del Trámite',
  propietario: 'Propietario',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!cliente) redirect('/dashboard/inspector/clientes')

  const { data: expedientes } = await supabase
    .from('expedientes')
    .select('id, numero_folio, kwp, status, ciudad, fecha_inicio, created_at')
    .eq('cliente_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const esPersonaMoral = cliente.tipo_persona === 'moral'
  const direccionCompleta = [
    cliente.direccion,
    cliente.numero_exterior ? `#${cliente.numero_exterior}` : null,
    cliente.numero_interior ? `Int. ${cliente.numero_interior}` : null,
    cliente.colonia,
    cliente.cp ? `CP ${cliente.cp}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/inspector/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Catálogo de Clientes
      </Link>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              {esPersonaMoral ? (
                <Building2 className="w-5 h-5 text-brand-green shrink-0" />
              ) : (
                <User className="w-5 h-5 text-brand-green shrink-0" />
              )}
              <h1 className="text-xl font-bold text-gray-900">{cliente.nombre}</h1>
              {esPersonaMoral ? (
                <span className="badge-en_revision">Persona Moral</span>
              ) : (
                <span className="badge-aprobada">Persona Física</span>
              )}
              {cliente.es_epc && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-orange/10 text-brand-orange-dark font-semibold">
                  EPC
                </span>
              )}
            </div>
            {cliente.nombre_comercial && (
              <p className="text-sm text-gray-500 pl-8">
                Nombre comercial: <span className="text-gray-700">{cliente.nombre_comercial}</span>
              </p>
            )}
            {cliente.rfc && (
              <p className="text-sm text-gray-500 pl-8 font-mono">{cliente.rfc}</p>
            )}
          </div>

          {/* Botón Ver Portal */}
          <Link
            href={`/dashboard/cliente?preview=${cliente.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green-light text-brand-green text-sm font-semibold hover:bg-brand-green hover:text-white transition-all self-start"
          >
            <Eye className="w-4 h-4" />
            Ver portal del cliente
          </Link>
        </div>
      </div>

      {/* Datos generales */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <User className="w-5 h-5 text-brand-green" />
          <h2 className="text-base font-semibold text-gray-800">Datos del Cliente</h2>
        </div>

        <div className="divide-y divide-gray-50">
          <DetailRow label="Tipo de persona" value={esPersonaMoral ? 'Persona Moral' : 'Persona Física'} />
          <DetailRow label="Nombre / Razón social" value={cliente.nombre} />
          {cliente.nombre_comercial && (
            <DetailRow label="Nombre comercial" value={cliente.nombre_comercial} />
          )}
          <DetailRow label="RFC" value={cliente.rfc} />
          {!esPersonaMoral && (
            <DetailRow label="CURP" value={cliente.curp} />
          )}
          {esPersonaMoral && (
            <>
              <DetailRow label="Representante" value={cliente.representante} />
              <DetailRow
                label="Figura jurídica"
                value={cliente.figura_juridica ? FIGURA_LABELS[cliente.figura_juridica] ?? cliente.figura_juridica : undefined}
              />
            </>
          )}
          <DetailRow
            label="Email"
            value={
              cliente.email ? (
                <PortalAccesoButtons
                  clienteId={cliente.id}
                  email={cliente.email}
                  tieneAcceso={!!cliente.usuario_id}
                />
              ) : undefined
            }
          />
          <DetailRow label="Teléfono" value={cliente.telefono} />
          <DetailRow
            label="Dirección"
            value={direccionCompleta || undefined}
          />
          <DetailRow
            label="Ciudad / Municipio / Estado"
            value={[cliente.ciudad, cliente.municipio, cliente.estado].filter(Boolean).join(' / ') || undefined}
          />
          <DetailRow label="Correo CFE" value={cliente.correo_cfe} />
          {cliente.notas && (
            <DetailRow
              label="Notas"
              value={<span className="whitespace-pre-wrap">{cliente.notas}</span>}
            />
          )}
          <DetailRow
            label="Registrado el"
            value={cliente.created_at ? formatDate(cliente.created_at) : undefined}
          />
        </div>
      </div>

      {/* Quien firma */}
      {cliente.firmante_mismo === false && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <FileText className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-semibold text-gray-800">Quien Firma el Contrato</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <DetailRow label="Nombre" value={cliente.firmante_nombre} />
            <DetailRow label="CURP" value={cliente.firmante_curp} />
            <DetailRow label="Número de INE" value={cliente.firmante_numero_ine} />
            <DetailRow label="Teléfono" value={cliente.firmante_telefono} />
            <DetailRow label="Correo" value={cliente.firmante_correo} />
          </div>
        </div>
      )}

      {/* Quien atiende */}
      {cliente.atiende_mismo === false && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <User className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-semibold text-gray-800">Quien Atiende la Visita</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <DetailRow label="Nombre" value={cliente.atiende_nombre} />
            <DetailRow label="CURP" value={cliente.atiende_curp} />
            <DetailRow label="Número de INE" value={cliente.atiende_numero_ine} />
            <DetailRow label="Teléfono" value={cliente.atiende_telefono} />
            <DetailRow label="Correo" value={cliente.atiende_correo} />
          </div>
        </div>
      )}

      {/* Historial de inspecciones */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <FileText className="w-5 h-5 text-brand-green" />
          <h2 className="text-base font-semibold text-gray-800">Historial de Inspecciones</h2>
        </div>

        {!expedientes?.length ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Sin expedientes registrados</p>
            <p className="text-xs mt-1 text-gray-400">Los expedientes aparecerán aquí una vez creados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Folio</th>
                  <th className="text-right py-2.5 px-2 font-medium text-gray-500">kWp</th>
                  <th className="text-center py-2.5 px-2 font-medium text-gray-500">Estado</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Ciudad</th>
                  <th className="text-right py-2.5 px-2 font-medium text-gray-500">Fecha</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {expedientes.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-2">
                      <span className="font-mono text-brand-green font-semibold text-xs">
                        {exp.numero_folio ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-700">{exp.kwp ?? '—'}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={EXPEDIENTE_STATUS_BADGE[exp.status] ?? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'}>
                        {EXPEDIENTE_STATUS_LABEL[exp.status] ?? exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gray-600">{exp.ciudad ?? '—'}</td>
                    <td className="py-2.5 px-2 text-right text-gray-500">
                      {exp.fecha_inicio ? formatDateShort(exp.fecha_inicio) : (exp.created_at ? formatDateShort(exp.created_at) : '—')}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <Link
                        href={`/dashboard/inspector/expedientes/${exp.id}`}
                        className="text-xs text-brand-green hover:underline font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OCR — INE del cliente */}
      {cliente.tipo_persona === 'fisica' && (
        <details className="card p-0 overflow-hidden group">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors select-none flex items-center justify-between list-none">
            <span className="flex items-center gap-2">
              Credencial INE / IFE
              {cliente.ocr_nombre && (
                <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  Escaneada
                </span>
              )}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
          </summary>
          <div className="p-6 border-t border-gray-100">
            <INECaptura
              entityType="cliente"
              entityId={cliente.id}
              savedData={{
                ine_url_frente:   cliente.ine_url_frente,
                ine_url_reverso:  cliente.ine_url_reverso,
                ocr_nombre:       cliente.ocr_nombre,
                ocr_curp:         cliente.ocr_curp,
                ocr_clave_elector: cliente.ocr_clave_elector,
                ocr_vigencia:     cliente.ocr_vigencia,
                ocr_domicilio:    cliente.ocr_domicilio,
              }}
            />
          </div>
        </details>
      )}

      {/* Editar — collapsible */}
      <details className="card p-0 overflow-hidden group">
        <summary className="cursor-pointer px-6 py-4 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors select-none flex items-center justify-between list-none">
          <span>Editar datos del cliente</span>
          <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="p-6 border-t border-gray-100">
          <ClienteForm modo="editar" cliente={cliente} />
        </div>
      </details>
    </div>
  )
}
