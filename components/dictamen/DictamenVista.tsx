'use client'

import { formatDate } from '@/lib/utils'
import { Printer, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Props {
  dictamen: any
  expediente: any
}

export default function DictamenVista({ dictamen, expediente }: Props) {
  const cliente = expediente.cliente as any
  const folio = Array.isArray(expediente.folio)
    ? expediente.folio[0]
    : expediente.folio

  const resultado = dictamen.resultado as 'aprobado' | 'rechazado' | 'condicionado'

  const resultadoConfig = {
    aprobado: {
      label: 'APROBADO',
      bg: 'bg-green-600',
      text: 'text-white',
      icon: <CheckCircle2 className="w-8 h-8" />,
      border: 'border-green-600',
    },
    rechazado: {
      label: 'RECHAZADO',
      bg: 'bg-red-600',
      text: 'text-white',
      icon: <XCircle className="w-8 h-8" />,
      border: 'border-red-600',
    },
    condicionado: {
      label: 'CONDICIONADO',
      bg: 'bg-brand-orange',
      text: 'text-white',
      icon: <AlertCircle className="w-8 h-8" />,
      border: 'border-brand-orange',
    },
  }

  const config = resultadoConfig[resultado] ?? resultadoConfig.condicionado

  return (
    <div>
      {/* Print button — hidden when printing */}
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="btn-primary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Document card */}
      <div
        id="dictamen-documento"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-3xl mx-auto print:shadow-none print:border-none print:rounded-none print:p-0"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b-2 border-brand-green pb-5 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-green uppercase">
              CIAE — UIIE-CRE-021
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1 leading-tight">
              Dictamen Técnico de Inspección
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Sistema Fotovoltaico Interconectado</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">No. de Folio</p>
            <p className="font-mono text-brand-green font-bold text-lg">
              {dictamen.numero_folio ?? expediente.numero_folio ?? '—'}
            </p>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Left: expediente data */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Datos del Expediente
            </p>
            <InfoRow label="Cliente" value={cliente?.nombre ?? '—'} />
            <InfoRow label="RFC" value={cliente?.rfc ?? '—'} />
            {cliente?.representante && (
              <InfoRow label="Representante" value={cliente.representante} />
            )}
            <InfoRow
              label="Tipo de persona"
              value={cliente?.tipo_persona === 'moral' ? 'Persona Moral' : 'Persona Física'}
            />
            <InfoRow label="Potencia del sistema" value={`${dictamen.potencia_kwp ?? expediente.kwp ?? '—'} kWp`} />
            <InfoRow label="Norma aplicable" value={dictamen.norma_aplicable ?? '—'} />
            <InfoRow
              label="Cumple con la norma"
              value={dictamen.cumple_norma ? 'Sí' : 'No'}
              valueClass={dictamen.cumple_norma ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}
            />
          </div>

          {/* Right: dictamen dates */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Datos del Dictamen
            </p>
            <InfoRow
              label="Fecha de inspección"
              value={dictamen.fecha_inspeccion ? formatDate(dictamen.fecha_inspeccion) : '—'}
            />
            <InfoRow
              label="Fecha de emisión"
              value={dictamen.fecha_emision ? formatDate(dictamen.fecha_emision) : '—'}
            />
            <InfoRow
              label="Folio del expediente"
              value={expediente.numero_folio ?? folio?.numero_folio ?? '—'}
            />
          </div>
        </div>

        {/* ── Result banner ── */}
        <div
          className={`flex items-center justify-center gap-3 rounded-lg px-6 py-5 mb-6 ${config.bg} ${config.text}`}
        >
          {config.icon}
          <span className="text-2xl font-extrabold tracking-widest">{config.label}</span>
        </div>

        {/* ── Sections ── */}
        {dictamen.observaciones_generales && (
          <Section title="Observaciones Generales">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {dictamen.observaciones_generales}
            </p>
          </Section>
        )}

        {dictamen.observaciones_tecnicas && (
          <Section title="Observaciones Técnicas">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {dictamen.observaciones_tecnicas}
            </p>
          </Section>
        )}

        {dictamen.recomendaciones && (
          <Section title="Recomendaciones">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {dictamen.recomendaciones}
            </p>
          </Section>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex items-end justify-between">
          <div className="text-center">
            <div className="w-48 border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Inspector responsable</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-brand-green">CIAE</p>
            <p className="text-xs text-gray-400">UIIE-CRE-021</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dictamen-documento,
          #dictamen-documento * {
            visibility: visible;
          }
          #dictamen-documento {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex gap-1">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}:</span>
      <span className={`text-xs text-gray-800 font-medium ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">{children}</div>
    </div>
  )
}
