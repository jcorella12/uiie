'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, Download, ChevronLeft, ChevronRight,
  FileSpreadsheet, Users, Award, DollarSign, Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'

// ─── Constantes ───────────────────────────────────────────────────────────────
const COMISION_INSPECTOR  = 0.60
const COMISION_RESPONSABLE = 0.40
const IVA = 0.16

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SolicitudRow {
  id: string
  cliente_nombre: string
  kwp: number
  precio_propuesto: number
  created_at: string
  inspector: { id: string; nombre: string; apellidos: string | null } | null
  folio: { numero_folio: string } | null
}

interface ResumenInspector {
  id: string
  nombre: string
  folios: number
  totalSinIva: number
  comisionInspector: number
  comisionResponsable: number
}

// ─── Supabase client ──────────────────────────────────────────────────────────
const _supabase = createClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rangoMes(year: number, month: number) {
  const inicio = new Date(year, month, 1)
  const fin    = new Date(year, month + 1, 1)
  return { inicio: inicio.toISOString(), fin: fin.toISOString() }
}

function resumenPorInspector(solicitudes: SolicitudRow[]): ResumenInspector[] {
  const map = new Map<string, ResumenInspector>()
  for (const s of solicitudes) {
    const id = s.inspector?.id ?? 'sin-inspector'
    const nombre = s.inspector
      ? [s.inspector.nombre, s.inspector.apellidos].filter(Boolean).join(' ')
      : 'Sin asignar'
    if (!map.has(id)) {
      map.set(id, { id, nombre, folios: 0, totalSinIva: 0, comisionInspector: 0, comisionResponsable: 0 })
    }
    const r = map.get(id)!
    r.folios++
    r.totalSinIva      += s.precio_propuesto
    r.comisionInspector  += s.precio_propuesto * COMISION_INSPECTOR
    r.comisionResponsable += s.precio_propuesto * COMISION_RESPONSABLE
  }
  return Array.from(map.values()).sort((a, b) => b.totalSinIva - a.totalSinIva)
}

// ─── Exportar Excel ───────────────────────────────────────────────────────────
async function exportarExcel(
  solicitudes: SolicitudRow[],
  resumen: ResumenInspector[],
  mes: number,
  year: number,
) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  // ── Hoja 1: Resumen por inspector ──
  const resumenRows = [
    [`CONCILIACIÓN MENSUAL — ${MESES[mes].toUpperCase()} ${year}`],
    [],
    ['Inspector', 'Folios Emitidos', 'Total s/IVA', 'IVA (16%)', 'Total c/IVA', 'Comisión Inspector (60%)', 'Comisión Responsable (40%)'],
    ...resumen.map(r => [
      r.nombre,
      r.folios,
      r.totalSinIva,
      r.totalSinIva * IVA,
      r.totalSinIva * (1 + IVA),
      r.comisionInspector,
      r.comisionResponsable,
    ]),
    [],
    [
      'TOTAL',
      resumen.reduce((s, r) => s + r.folios, 0),
      resumen.reduce((s, r) => s + r.totalSinIva, 0),
      resumen.reduce((s, r) => s + r.totalSinIva * IVA, 0),
      resumen.reduce((s, r) => s + r.totalSinIva * (1 + IVA), 0),
      resumen.reduce((s, r) => s + r.comisionInspector, 0),
      resumen.reduce((s, r) => s + r.comisionResponsable, 0),
    ],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(resumenRows)

  // Ancho de columnas
  ws1['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 24 }]

  // Formato numérico para columnas de dinero
  const fmtPeso = '"$"#,##0.00'
  const range   = XLSX.utils.decode_range(ws1['!ref'] ?? 'A1')
  for (let R = 3; R <= range.e.r; R++) {
    for (let C = 2; C <= 6; C++) {
      const cell = ws1[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell && cell.t === 'n') cell.z = fmtPeso
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')

  // ── Hoja 2: Detalle de folios ──
  const detalleRows = [
    ['Folio', 'Cliente', 'kWp', 'Inspector', 'Precio s/IVA', 'IVA (16%)', 'Precio c/IVA', 'Comisión Inspector', 'Comisión Responsable', 'Fecha'],
    ...solicitudes.map(s => {
      const iva = s.precio_propuesto * IVA
      return [
        s.folio?.numero_folio ?? '—',
        s.cliente_nombre,
        s.kwp,
        s.inspector ? [s.inspector.nombre, s.inspector.apellidos].filter(Boolean).join(' ') : '—',
        s.precio_propuesto,
        iva,
        s.precio_propuesto + iva,
        s.precio_propuesto * COMISION_INSPECTOR,
        s.precio_propuesto * COMISION_RESPONSABLE,
        new Date(s.created_at).toLocaleDateString('es-MX'),
      ]
    }),
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(detalleRows)
  ws2['!cols'] = [
    { wch: 16 }, { wch: 30 }, { wch: 8 }, { wch: 28 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 12 },
  ]

  const range2 = XLSX.utils.decode_range(ws2['!ref'] ?? 'A1')
  for (let R = 1; R <= range2.e.r; R++) {
    for (const C of [4, 5, 6, 7, 8]) {
      const cell = ws2[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell && cell.t === 'n') cell.z = fmtPeso
    }
  }

  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Folios')

  XLSX.writeFile(wb, `Conciliacion_${MESES[mes]}_${year}.xlsx`)
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ConciliacionPage() {
  const supabase = _supabase
  const hoy      = new Date()

  // Default: mes anterior
  const [year,  setYear]  = useState(hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1)

  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [exporting,   setExporting]   = useState(false)
  const [inspFiltro,  setInspFiltro]  = useState<string>('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const { inicio, fin } = rangoMes(year, month)

    const { data } = await supabase
      .from('solicitudes_folio')
      .select(`
        id, cliente_nombre, kwp, precio_propuesto, created_at,
        inspector:usuarios!inspector_id(id, nombre, apellidos),
        folio:folios_lista_control(numero_folio)
      `)
      .eq('status', 'folio_asignado')
      .gte('created_at', inicio)
      .lt('created_at', fin)
      .order('created_at', { ascending: true })

    setSolicitudes((data as unknown as SolicitudRow[]) ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { cargar() }, [cargar])

  // Navegación de mes
  const prevMes = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMes = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Resumen global
  const resumen = resumenPorInspector(solicitudes)
  const totalSinIva       = solicitudes.reduce((s, r) => s + r.precio_propuesto, 0)
  const totalConIva       = totalSinIva * (1 + IVA)
  const totalInspectores  = totalSinIva * COMISION_INSPECTOR
  const totalResponsable  = totalSinIva * COMISION_RESPONSABLE

  // Detalle filtrado
  const detalle = inspFiltro
    ? solicitudes.filter(s => s.inspector?.id === inspFiltro)
    : solicitudes

  async function handleExport() {
    setExporting(true)
    await exportarExcel(solicitudes, resumen, month, year)
    setExporting(false)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conciliación Mensual</h1>
          <p className="text-gray-500 text-sm mt-1">
            Folios emitidos, ingresos y distribución de comisiones
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector de mes */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
            <button onClick={prevMes} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[130px] text-center">
              {MESES[month]} {year}
            </span>
            <button
              onClick={nextMes}
              disabled={year === hoy.getFullYear() && month >= hoy.getMonth()}
              className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={exporting || solicitudes.length === 0}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileSpreadsheet className="w-4 h-4" />
            }
            {exporting ? 'Generando…' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={<Award className="w-5 h-5 text-brand-green" />}
            label="Folios Emitidos"
            value={String(solicitudes.length)}
            sub={`${resumen.length} inspector${resumen.length !== 1 ? 'es' : ''}`}
            color="green"
          />
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            label="Total s/IVA"
            value={formatCurrency(totalSinIva)}
            sub={`c/IVA: ${formatCurrency(totalConIva)}`}
            color="blue"
          />
          <KpiCard
            icon={<Users className="w-5 h-5 text-purple-600" />}
            label="Comisiones Inspectores"
            value={formatCurrency(totalInspectores)}
            sub="60% del total s/IVA"
            color="purple"
          />
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-brand-orange" />}
            label="Comisión Responsable"
            value={formatCurrency(totalResponsable)}
            sub="40% del total s/IVA"
            color="orange"
          />
        </div>
      )}

      {/* ── Sin datos ── */}
      {!loading && solicitudes.length === 0 && (
        <div className="card text-center py-16">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Sin folios emitidos en {MESES[month]} {year}</p>
          <p className="text-sm text-gray-400 mt-1">Navega a otro mes para ver el historial.</p>
        </div>
      )}

      {/* ── Resumen por inspector ── */}
      {!loading && resumen.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-green" />
              Distribución por Inspector
            </h2>
            <span className="text-xs text-gray-400">{MESES[month]} {year}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Inspector</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Folios</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total s/IVA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">IVA (16%)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total c/IVA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Comisión Inspector</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Comisión Responsable</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r, idx) => {
                  const isFiltered = inspFiltro === r.id
                  return (
                    <tr
                      key={r.id}
                      className={[
                        'border-b border-gray-50 transition-colors',
                        isFiltered ? 'bg-brand-green-light/30' : 'hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-brand-green-light text-brand-green text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{r.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                          {r.folios}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {formatCurrency(r.totalSinIva)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {formatCurrency(r.totalSinIva * IVA)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {formatCurrency(r.totalSinIva * (1 + IVA))}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-brand-green">
                        {formatCurrency(r.comisionInspector)}
                        <span className="block text-xs font-normal text-gray-400">60%</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-600">
                        {formatCurrency(r.comisionResponsable)}
                        <span className="block text-xs font-normal text-gray-400">40%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setInspFiltro(isFiltered ? '' : r.id)}
                          className={[
                            'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                            isFiltered
                              ? 'bg-brand-green text-white'
                              : 'text-brand-green hover:bg-brand-green-light',
                          ].join(' ')}
                        >
                          {isFiltered ? 'Todos' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {/* Fila de totales */}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                  <td className="py-3 px-4 text-gray-800">Total</td>
                  <td className="py-3 px-4 text-center text-gray-800">{solicitudes.length}</td>
                  <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(totalSinIva)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(totalSinIva * IVA)}</td>
                  <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(totalConIva)}</td>
                  <td className="py-3 px-4 text-right text-brand-green">{formatCurrency(totalInspectores)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(totalResponsable)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detalle de folios ── */}
      {!loading && detalle.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-green" />
              {inspFiltro
                ? `Folios de ${resumen.find(r => r.id === inspFiltro)?.nombre ?? 'Inspector'}`
                : 'Detalle de Folios Emitidos'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{detalle.length} folios</span>
              {inspFiltro && (
                <button
                  onClick={() => setInspFiltro('')}
                  className="text-xs text-brand-green hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Folio</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Cliente</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">kWp</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Inspector</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Precio s/IVA</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">IVA</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Precio c/IVA</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Comisión Insp.</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((s, i) => {
                  const iva = s.precio_propuesto * IVA
                  const inspector = s.inspector
                    ? [s.inspector.nombre, s.inspector.apellidos].filter(Boolean).join(' ')
                    : '—'
                  return (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="py-2.5 px-4 font-mono text-brand-green font-semibold text-xs">
                        {s.folio?.numero_folio ?? '—'}
                      </td>
                      <td className="py-2.5 px-4 text-gray-800 max-w-[180px] truncate">
                        {s.cliente_nombre}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{s.kwp}</td>
                      <td className="py-2.5 px-4 text-gray-600 max-w-[160px] truncate">{inspector}</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">{formatCurrency(s.precio_propuesto)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-500">{formatCurrency(iva)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-800 font-medium">{formatCurrency(s.precio_propuesto + iva)}</td>
                      <td className="py-2.5 px-4 text-right text-brand-green font-semibold">{formatCurrency(s.precio_propuesto * COMISION_INSPECTOR)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400">
                        {new Date(s.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Nota al pie ── */}
      {!loading && solicitudes.length > 0 && (
        <p className="text-xs text-gray-400 text-center pb-4">
          * Comisiones calculadas sobre el precio s/IVA. Viáticos son 100% del inspector y no se incluyen en esta conciliación.
        </p>
      )}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'green' | 'blue' | 'purple' | 'orange'
}) {
  const bg: Record<string, string> = {
    green:  'bg-brand-green-light',
    blue:   'bg-blue-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
  }
  return (
    <div className="card flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
