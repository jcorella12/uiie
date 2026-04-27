'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
  Upload, Loader2, Receipt, CreditCard, TrendingUp, Zap,
  Package, DollarSign, ChevronLeft, ChevronRight, Info,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const COMISION_INSPECTOR  = 0.60
const COMISION_CIAE       = 0.40
const IVA                 = 0.16

// ─── Types ────────────────────────────────────────────────────────────────────
interface Expediente {
  id: string
  numero_folio: string
  kwp: number | null
  ciudad: string | null
  status: string
  fecha_inicio: string | null
  folio_id: string | null
  precio_propuesto: number | null
  cliente: { nombre: string } | null
}

interface Conciliacion {
  id: string
  mes: number
  anio: number
  status: 'aceptada' | 'facturada' | 'pagada' | 'cerrada'
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
  expedientes: Expediente[]
}

interface Props {
  pendientes:  Expediente[]
  historial:   Conciliacion[]
  mesActual:   number
  anioActual:  number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  aceptada:  { label: 'Aceptada',         color: 'bg-blue-100 text-blue-700' },
  facturada: { label: 'Factura recibida', color: 'bg-purple-100 text-purple-700' },
  pagada:    { label: 'Pago enviado',     color: 'bg-amber-100 text-amber-700' },
  cerrada:   { label: 'Cerrada ✓',        color: 'bg-green-100 text-green-700' },
}

const STATUS_EXP: Record<string, string> = {
  aprobado: 'Aprobado', cerrado: 'Cerrado',
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Resumen financiero ───────────────────────────────────────────────────────
function ResumenFinanciero({
  totalMonto, compact = false,
}: {
  totalMonto: number
  compact?: boolean
}) {
  const iva       = totalMonto * IVA
  const conIva    = totalMonto + iva
  const inspector = totalMonto * COMISION_INSPECTOR
  const ciae      = totalMonto * COMISION_CIAE

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Tu comisión (60%)</p>
          <p className="text-lg font-bold text-brand-green">{fmt(inspector)}</p>
          <p className="text-xs text-gray-400">sobre {fmt(totalMonto)} s/IVA</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Comisión CIAE (40%)</p>
          <p className="text-lg font-bold text-gray-700">{fmt(ciae)}</p>
          <p className="text-xs text-gray-400">Total c/IVA: {fmt(conIva)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card text-center py-4">
        <p className="text-xs text-gray-500 mb-1">Subtotal s/IVA</p>
        <p className="text-xl font-bold text-gray-900">{fmt(totalMonto)}</p>
      </div>
      <div className="card text-center py-4">
        <p className="text-xs text-gray-500 mb-1">Total c/IVA</p>
        <p className="text-xl font-bold text-gray-700">{fmt(conIva)}</p>
        <p className="text-xs text-gray-400">IVA: {fmt(iva)}</p>
      </div>
      <div className="card text-center py-4 border-brand-green/30 bg-brand-green/5">
        <p className="text-xs text-gray-500 mb-1">Tu comisión</p>
        <p className="text-xl font-bold text-brand-green">{fmt(inspector)}</p>
        <p className="text-xs text-gray-400">60%</p>
      </div>
      <div className="card text-center py-4">
        <p className="text-xs text-gray-500 mb-1">Comisión CIAE</p>
        <p className="text-xl font-bold text-gray-600">{fmt(ciae)}</p>
        <p className="text-xs text-gray-400">40%</p>
      </div>
    </div>
  )
}

// ─── Doc upload zone ──────────────────────────────────────────────────────────
function DocZone({
  label, icon: Icon, existingUrl, existingNombre, existingAt,
  onUpload, disabled, loading,
}: {
  label: string; icon: React.ElementType
  existingUrl: string | null; existingNombre: string | null; existingAt: string | null
  onUpload: (f: File) => void; disabled: boolean; loading: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  if (existingUrl) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 truncate">{existingNombre}</p>
          {existingAt && <p className="text-xs text-gray-400">{fmtDate(existingAt)}</p>}
        </div>
        <a href={existingUrl} target="_blank" rel="noopener noreferrer"
           className="text-xs text-brand-green font-medium hover:underline shrink-0">Ver →</a>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 opacity-60">
        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xs text-gray-400">Pendiente</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-brand-green hover:bg-green-50/40 transition-colors"
      onClick={() => ref.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onUpload(f) }}
    >
      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
        {loading ? <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
                 : <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{loading ? 'Subiendo...' : 'Clic o arrastra · PDF o imagen'}</p>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden"
        disabled={loading} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
    </div>
  )
}

// ─── Historial card (un corte pasado) ─────────────────────────────────────────
function CorteCard({
  conc, onUploadDoc,
}: {
  conc: Conciliacion
  onUploadDoc: (id: string, tipo: 'factura' | 'comprobante', f: File) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [uploadingComp, setUploadingComp] = useState(false)
  const [uploadErr,    setUploadErr]    = useState<string | null>(null)
  const [localFactura, setLocalFactura] = useState({
    url: conc.factura_url, nombre: conc.factura_nombre, at: conc.factura_subida_at,
  })
  const [localComp, setLocalComp] = useState({
    url: conc.comprobante_url, nombre: conc.comprobante_nombre, at: conc.comprobante_subido_at,
  })
  const [localStatus, setLocalStatus] = useState(conc.status)

  const badge      = STATUS_BADGE[localStatus]
  const totalMonto = conc.total_monto ?? 0

  async function handleComp(file: File) {
    setUploadingComp(true)
    setUploadErr(null)
    try {
      await onUploadDoc(conc.id, 'comprobante', file)
      setLocalComp({ url: '#refresh', nombre: file.name, at: new Date().toISOString() })
      if (localStatus === 'facturada') setLocalStatus('pagada')
    } catch (e: any) {
      setUploadErr(e.message ?? 'Error al subir')
    } finally {
      setUploadingComp(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            Corte {MESES[conc.mes]} {conc.anio}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {conc.total_expedientes} expediente{conc.total_expedientes !== 1 ? 's' : ''}
            {conc.total_kwp != null ? ` · ${conc.total_kwp} kWp` : ''}
            {totalMonto > 0 ? ` · ${fmt(totalMonto)} s/IVA` : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}>
          {badge.label}
        </span>
        <div className="flex gap-1.5 shrink-0">
          <span title="Factura"     className={`w-2 h-2 rounded-full ${localFactura.url ? 'bg-purple-400' : 'bg-gray-200'}`} />
          <span title="Comprobante" className={`w-2 h-2 rounded-full ${localComp.url   ? 'bg-green-400'  : 'bg-gray-200'}`} />
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
          {/* Resumen financiero compacto */}
          {totalMonto > 0 && <ResumenFinanciero totalMonto={totalMonto} compact />}

          {/* Documentos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DocZone
              label="Factura CIAE"
              icon={Receipt}
              existingUrl={localFactura.url}
              existingNombre={localFactura.nombre}
              existingAt={localFactura.at}
              onUpload={() => {}}
              disabled={true}
              loading={false}
            />
            <DocZone
              label="Comprobante de pago"
              icon={CreditCard}
              existingUrl={localComp.url}
              existingNombre={localComp.nombre}
              existingAt={localComp.at}
              onUpload={handleComp}
              disabled={!localFactura.url}
              loading={uploadingComp}
            />
          </div>

          {!localFactura.url && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              En espera de que el equipo CIAE suba la factura
            </p>
          )}
          {localFactura.url && !localComp.url && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Factura recibida — sube tu comprobante de pago para completar
            </p>
          )}
          {uploadErr && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />{uploadErr}
            </p>
          )}

          {/* Expedientes del corte */}
          {conc.expedientes.length > 0 && (
            <ExpedientesTable expedientes={conc.expedientes} />
          )}

          <p className="text-xs text-gray-400">
            Aceptado el {fmtDate(conc.inspector_acepto_at)}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tabla de expedientes ─────────────────────────────────────────────────────
function ExpedientesTable({ expedientes }: { expedientes: Expediente[] }) {
  const totalKwp   = expedientes.reduce((s, e) => s + (e.kwp ?? 0), 0)
  const totalMonto = expedientes.reduce((s, e) => s + (e.precio_propuesto ?? 0), 0)
  const hayPrecios = expedientes.some(e => e.precio_propuesto != null)

  return (
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
              <th className="text-center py-2 px-3 font-medium text-gray-500">Estado</th>
              {hayPrecios && <th className="text-right py-2 px-3 font-medium text-gray-500">Precio</th>}
            </tr>
          </thead>
          <tbody>
            {expedientes.map((exp, i) => (
              <tr key={exp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="py-2 px-3 font-mono text-brand-green font-semibold">{exp.numero_folio}</td>
                <td className="py-2 px-3 text-gray-700">{exp.cliente?.nombre ?? '—'}</td>
                <td className="py-2 px-3 text-right text-gray-600">{exp.kwp ?? '—'}</td>
                <td className="py-2 px-3 text-gray-500">{exp.ciudad ?? '—'}</td>
                <td className="py-2 px-3 text-center">
                  <span className="text-gray-500">{STATUS_EXP[exp.status] ?? exp.status}</span>
                </td>
                {hayPrecios && (
                  <td className="py-2 px-3 text-right text-gray-700">
                    {exp.precio_propuesto != null ? fmt(exp.precio_propuesto) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
              <td colSpan={2} className="py-2 px-3 text-gray-700">Total</td>
              <td className="py-2 px-3 text-right text-gray-900">{totalKwp.toFixed(2)}</td>
              <td colSpan={hayPrecios ? 2 : 1} />
              {hayPrecios && (
                <td className="py-2 px-3 text-right text-gray-900">{fmt(totalMonto)}</td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ConciliacionInspector({
  pendientes, historial, mesActual, anioActual,
}: Props) {
  // Navegación de corte (para el selector al aceptar)
  const [cortemes,  setCortesMes]  = useState(mesActual)
  const [corteanio, setCortesAnio] = useState(anioActual)

  const [accepting,   setAccepting]   = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [accepted,    setAccepted]    = useState(false)
  const [newConc,     setNewConc]     = useState<Conciliacion | null>(null)

  // Calcular totales de los pendientes
  const totalKwpPend   = pendientes.reduce((s, e) => s + (e.kwp ?? 0), 0)
  const totalMontoPend = pendientes.reduce((s, e) => s + (e.precio_propuesto ?? 0), 0)
  const hayPrecios     = pendientes.some(e => e.precio_propuesto != null)

  // Navegación de mes del corte
  function prevCorte() {
    if (cortemes === 1) { setCortesMes(12); setCortesAnio(a => a - 1) }
    else setCortesMes(m => m - 1)
  }
  function nextCorte() {
    if (cortemes === 12) { setCortesMes(1); setCortesAnio(a => a + 1) }
    else setCortesMes(m => m + 1)
  }
  const isCurrentCorte = cortemes === mesActual && corteanio === anioActual
  const corteLabel = `${MESES[cortemes]} ${corteanio}`

  // Verificar si ya existe conciliación para el corte seleccionado
  const corteDuplicado = historial.some(c => c.mes === cortemes && c.anio === corteanio)
    || (newConc?.mes === cortemes && newConc?.anio === corteanio)

  async function handleAceptar() {
    setAccepting(true)
    setAcceptError(null)
    try {
      const res  = await fetch('/api/conciliacion/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: cortemes, anio: corteanio }),
      })
      const data = await res.json()
      if (!res.ok) { setAcceptError(data.error ?? 'Error al aceptar'); return }
      setAccepted(true)
      setNewConc({
        id: data.conciliacion_id,
        mes: cortemes, anio: corteanio,
        status: 'aceptada',
        total_expedientes: pendientes.length,
        total_kwp: totalKwpPend,
        total_monto: totalMontoPend,
        inspector_acepto_at: new Date().toISOString(),
        factura_url: null, factura_nombre: null, factura_subida_at: null,
        comprobante_url: null, comprobante_nombre: null, comprobante_subido_at: null,
        expedientes: pendientes,
      })
    } catch {
      setAcceptError('Error de conexión. Intenta de nuevo.')
    } finally {
      setAccepting(false)
    }
  }

  async function handleUploadDoc(concId: string, tipo: 'factura' | 'comprobante', file: File) {
    const fd = new FormData()
    fd.append('conciliacion_id', concId)
    fd.append('tipo', tipo)
    fd.append('file', file)
    const res  = await fetch('/api/conciliacion/documento', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error al subir')
  }

  const historialFull = newConc ? [newConc, ...historial] : historial

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Conciliación</h1>
        <p className="text-sm text-gray-500 mt-1">
          Expedientes aprobados o cerrados · corte a corte
        </p>
      </div>

      {/* ── Sección pendiente ── */}
      {!accepted && (
        <>
          {pendientes.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
              <p className="font-medium text-gray-600">Sin expedientes pendientes</p>
              <p className="text-sm mt-1">
                Solo se incluyen expedientes con estado <strong>Aprobado</strong> o <strong>Cerrado</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-gray-900">{pendientes.length}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Expedientes
                  </p>
                </div>
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-gray-900">{totalKwpPend.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> kWp
                  </p>
                </div>
                <div className="card text-center py-4">
                  <p className="text-sm font-bold text-amber-600">Sin conciliar</p>
                  <p className="text-xs text-gray-400 mt-1">Pendiente de corte</p>
                </div>
              </div>

              {/* Resumen financiero */}
              {hayPrecios && totalMontoPend > 0 && (
                <ResumenFinanciero totalMonto={totalMontoPend} />
              )}
              {!hayPrecios && (
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  No se encontró precio en algunas solicitudes. El monto se calculará con los datos disponibles.
                </div>
              )}

              {/* Tabla */}
              <div className="card overflow-hidden p-0">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 text-sm">
                    Expedientes a incluir en este corte
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Solo se incluyen expedientes con estado Aprobado o Cerrado
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <ExpedientesTable expedientes={pendientes} />
                </div>

                {/* Aceptar bar */}
                <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-amber-900">
                        Etiqueta del corte
                      </p>
                      {/* Selector de mes/año del corte */}
                      <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-lg px-2 py-1.5 w-fit">
                        <button
                          type="button"
                          onClick={prevCorte}
                          className="p-1 rounded hover:bg-amber-100 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                        <span className="text-sm font-semibold text-amber-800 min-w-[130px] text-center">
                          {corteLabel}
                        </span>
                        <button
                          type="button"
                          onClick={nextCorte}
                          className="p-1 rounded hover:bg-amber-100 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                      </div>
                      {corteDuplicado && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Ya existe una conciliación para {corteLabel}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAceptar}
                      disabled={accepting || corteDuplicado}
                      className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition-colors disabled:opacity-60 shrink-0"
                    >
                      {accepting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Aceptando...</>
                        : <><CheckCircle2 className="w-4 h-4" /> Aceptar Corte {corteLabel}</>
                      }
                    </button>
                  </div>

                  {acceptError && (
                    <p className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />{acceptError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Banner éxito ── */}
      {accepted && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Corte {corteLabel} aceptado
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              El equipo CIAE preparará la factura. Cuando llegue, podrás subir tu comprobante de pago desde el historial.
            </p>
          </div>
        </div>
      )}

      {/* ── Historial de cortes ── */}
      {historialFull.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Historial de cortes
          </h2>
          <div className="space-y-3">
            {historialFull.map(conc => (
              <CorteCard
                key={conc.id}
                conc={conc}
                onUploadDoc={handleUploadDoc}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
