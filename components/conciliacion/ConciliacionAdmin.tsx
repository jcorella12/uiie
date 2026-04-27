'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
  Receipt, CreditCard, Loader2, TrendingUp, Zap,
  Package, Users, Filter, DollarSign,
} from 'lucide-react'

const COMISION_INSPECTOR = 0.60
const COMISION_CIAE      = 0.40
const IVA                = 0.16

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
}

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  aceptada:   { label: 'Aceptada',         color: 'bg-blue-100 text-blue-700' },
  facturada:  { label: 'Factura enviada',  color: 'bg-purple-100 text-purple-700' },
  pagada:     { label: 'Pago recibido',    color: 'bg-amber-100 text-amber-700' },
  cerrada:    { label: 'Cerrada ✓',        color: 'bg-green-100 text-green-700' },
}

interface Expediente {
  id: string
  numero_folio: string
  kwp: number | null
  ciudad: string | null
  status: string
  cliente: { nombre: string } | null
}

interface ConciliacionRow {
  id: string
  mes: number
  anio: number
  status: string
  total_expedientes: number
  total_kwp: number | null
  total_monto: number | null
  inspector_acepto_at: string
  factura_url: string | null
  factura_nombre: string | null
  factura_subida_at: string | null
  comprobante_url: string | null
  comprobante_nombre: string | null
  comprobante_subido_at: string | null
  inspector: { id: string; nombre: string; apellidos: string | null } | null
  expedientes: Expediente[]
}

interface Props {
  conciliaciones: ConciliacionRow[]
  mesActual: number
  anioActual: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AdminConcRow({ conc }: { conc: ConciliacionRow }) {
  const [open,              setOpen]              = useState(false)
  const [uploadingFactura,  setUploadingFactura]  = useState(false)
  const [uploadError,       setUploadError]       = useState<string | null>(null)
  const [localStatus,       setLocalStatus]       = useState(conc.status)
  const [localFactura,      setLocalFactura]      = useState({
    url: conc.factura_url, nombre: conc.factura_nombre, at: conc.factura_subida_at,
  })
  const [localComprobante]  = useState({
    url: conc.comprobante_url, nombre: conc.comprobante_nombre, at: conc.comprobante_subido_at,
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const badge = STATUS_BADGE[localStatus] ?? STATUS_BADGE.aceptada
  const inspNombre = conc.inspector
    ? `${conc.inspector.nombre} ${conc.inspector.apellidos ?? ''}`.trim()
    : '—'

  async function uploadFactura(file: File) {
    setUploadingFactura(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('conciliacion_id', conc.id)
      fd.append('tipo', 'factura')
      fd.append('file', file)
      const res  = await fetch('/api/conciliacion/documento', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir la factura')
      setLocalFactura({ url: data.url ?? '#', nombre: file.name, at: new Date().toISOString() })
      if (localStatus === 'aceptada') setLocalStatus('facturada')
    } catch (e: any) {
      setUploadError(e.message)
    } finally {
      setUploadingFactura(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Inspector */}
        <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
          <span className="text-brand-green text-xs font-bold">
            {conc.inspector?.nombre?.[0] ?? '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{inspNombre}</p>
          <p className="text-xs text-gray-500">
            Corte {MESES[conc.mes]} {conc.anio} ·&nbsp;
            {conc.total_expedientes} exp ·&nbsp;
            {conc.total_kwp != null ? `${conc.total_kwp} kWp` : '—'}
            {conc.total_monto != null && conc.total_monto > 0
              ? ` · ${fmt(conc.total_monto)} s/IVA`
              : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}>
          {badge.label}
        </span>
        {/* Doc dots */}
        <div className="flex gap-1.5 shrink-0">
          <span title="Factura"      className={`w-2 h-2 rounded-full ${localFactura.url     ? 'bg-purple-400' : 'bg-gray-200'}`} />
          <span title="Comprobante"  className={`w-2 h-2 rounded-full ${localComprobante.url ? 'bg-green-400'  : 'bg-gray-200'}`} />
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Factura upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Factura — CIAE sube */}
            {localFactura.url ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Factura subida</p>
                  <p className="text-xs text-gray-500 truncate">{localFactura.nombre}</p>
                  {localFactura.at && <p className="text-xs text-gray-400">{formatDate(localFactura.at)}</p>}
                </div>
                <a href={localFactura.url} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-purple-700 font-medium hover:underline shrink-0">Ver →</a>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-purple-200 cursor-pointer hover:border-purple-400 hover:bg-purple-50/40 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFactura(f) }}
              >
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  {uploadingFactura
                    ? <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    : <Receipt className="w-5 h-5 text-purple-400" />}
                </div>
                <p className="text-sm font-medium text-gray-700">Subir Factura</p>
                <p className="text-xs text-gray-400">{uploadingFactura ? 'Subiendo...' : 'PDF o imagen · haz clic o arrastra'}</p>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  disabled={uploadingFactura}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFactura(f) }} />
              </div>
            )}

            {/* Comprobante — inspector sube, CIAE solo visualiza */}
            {localComprobante.url ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Comprobante de pago</p>
                  <p className="text-xs text-gray-500 truncate">{localComprobante.nombre}</p>
                  {localComprobante.at && <p className="text-xs text-gray-400">{formatDate(localComprobante.at)}</p>}
                </div>
                <a href={localComprobante.url} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-green-700 font-medium hover:underline shrink-0">Ver →</a>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 opacity-70">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Comprobante de pago</p>
                  <p className="text-xs text-gray-400">En espera del inspector</p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />{uploadError}
            </p>
          )}

          {/* Resumen financiero */}
          {conc.total_monto != null && conc.total_monto > 0 && (() => {
            const m    = conc.total_monto
            const iva  = m * IVA
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Subtotal s/IVA</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">{fmt(m)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Total c/IVA</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">{fmt(m + iva)}</p>
                </div>
                <div className="bg-brand-green/5 border border-brand-green/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Inspector (60%)</p>
                  <p className="font-semibold text-brand-green text-sm mt-0.5">{fmt(m * COMISION_INSPECTOR)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">CIAE (40%)</p>
                  <p className="font-semibold text-blue-700 text-sm mt-0.5">{fmt(m * COMISION_CIAE)}</p>
                </div>
              </div>
            )
          })()}

          {/* Aceptó el inspector */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Inspector aceptó el {formatDate(conc.inspector_acepto_at)}
          </p>

          {/* Expedientes */}
          {conc.expedientes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Expedientes incluidos
              </p>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Folio</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Cliente</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">kWp</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conc.expedientes.map((exp, i) => (
                      <tr key={exp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-2 px-3 font-mono text-brand-green font-semibold">{exp.numero_folio}</td>
                        <td className="py-2 px-3 text-gray-700">{exp.cliente?.nombre ?? '—'}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{exp.kwp ?? '—'}</td>
                        <td className="py-2 px-3 text-gray-500">{exp.ciudad ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ConciliacionAdmin({ conciliaciones, mesActual, anioActual }: Props) {
  const [filtroMes,  setFiltroMes]  = useState(mesActual)
  const [filtroAnio, setFiltroAnio] = useState(anioActual)

  // Calcular los meses disponibles del historial
  const mesesDisponibles = Array.from(
    new Set(conciliaciones.map(c => `${c.anio}-${String(c.mes).padStart(2, '0')}`))
  ).sort().reverse()

  // Filtrar
  const filtered = conciliaciones.filter(
    c => c.mes === filtroMes && c.anio === filtroAnio
  )

  // Totales del corte filtrado
  const totalExp   = filtered.reduce((s, c) => s + c.total_expedientes, 0)
  const totalKwp   = filtered.reduce((s, c) => s + (c.total_kwp ?? 0), 0)
  const totalMonto = filtered.reduce((s, c) => s + (c.total_monto ?? 0), 0)
  const totalConc  = filtered.length
  const pendFactura = filtered.filter(c => c.status === 'aceptada').length
  const pendPago    = filtered.filter(c => c.status === 'facturada').length
  const cerradas    = filtered.filter(c => ['pagada', 'cerrada'].includes(c.status)).length

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos / Facturas del Equipo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Conciliaciones aceptadas · solo expedientes aprobados o cerrados
          </p>
        </div>
        {/* Selector de mes */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="input-field py-1.5 text-sm pr-8"
            value={`${filtroAnio}-${String(filtroMes).padStart(2, '0')}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-')
              setFiltroAnio(Number(y))
              setFiltroMes(Number(m))
            }}
          >
            {/* Current month always available */}
            <option value={`${anioActual}-${String(mesActual).padStart(2, '0')}`}>
              {MESES[mesActual]} {anioActual}
            </option>
            {mesesDisponibles
              .filter(k => k !== `${anioActual}-${String(mesActual).padStart(2, '0')}`)
              .map(k => {
                const [y, m] = k.split('-')
                return (
                  <option key={k} value={k}>{MESES[Number(m)]} {y}</option>
                )
              })}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-gray-900">{totalConc}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" /> Inspectores
          </p>
        </div>
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-gray-900">{totalExp}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Package className="w-3.5 h-3.5" /> Expedientes
          </p>
        </div>
        <div className="card text-center py-5">
          <p className="text-xl font-bold text-gray-900">
            {totalMonto > 0 ? fmt(totalMonto) : `${totalKwp.toFixed(1)} kWp`}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {totalMonto > 0 ? 'Total s/IVA' : 'kWp total'}
          </p>
          {totalMonto > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Inspector: {fmt(totalMonto * COMISION_INSPECTOR)}
            </p>
          )}
        </div>
        <div className="card py-5 text-center space-y-1">
          {pendFactura > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {pendFactura} sin factura
            </p>
          )}
          {pendPago > 0 && (
            <p className="text-xs text-amber-600 font-medium">
              {pendPago} sin comprobante
            </p>
          )}
          {cerradas > 0 && (
            <p className="text-xs text-green-600 font-medium">
              {cerradas} completadas
            </p>
          )}
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400">Sin conciliaciones este corte</p>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Sin conciliaciones para {MESES[filtroMes]} {filtroAnio}</p>
          <p className="text-sm mt-1">Los inspectores aún no han aceptado su conciliación este mes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(conc => (
            <AdminConcRow key={conc.id} conc={conc} />
          ))}
        </div>
      )}
    </div>
  )
}
