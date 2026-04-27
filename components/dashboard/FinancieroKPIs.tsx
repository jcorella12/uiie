// Server component — no 'use client'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/pricing'
import {
  TrendingUp, DollarSign, Users, Building2,
  ArrowUpRight, ArrowDownRight, Minus, Clock,
} from 'lucide-react'

// ─── Constantes ───────────────────────────────────────────────────────────────
const COMISION_UNIDAD     = 0.40
const COMISION_INSPECTOR  = 0.60
const IVA                 = 0.16

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(a: number, b: number): number {
  if (b === 0) return 0
  return Math.round(((a - b) / b) * 100)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FinKPI({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent: string
  trend?: number
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend}% vs mes anterior
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default async function FinancieroKPIs() {
  const supabase = await createClient()
  const hoy = new Date()
  const año  = hoy.getFullYear()
  const mesActual = hoy.getMonth() // 0-based

  const inicioAño    = new Date(año, 0, 1).toISOString()
  const inicioMes    = new Date(año, mesActual, 1).toISOString()
  const inicioMesAnt = new Date(año, mesActual - 1, 1).toISOString()
  const finMesAnt    = inicioMes

  // ── 1. Todos los folios asignados del año ─────────────────────────────────
  const { data: foliosAño } = await supabase
    .from('solicitudes_folio')
    .select('precio_propuesto, created_at, inspector:usuarios!inspector_id(id, nombre, apellidos)')
    .eq('status', 'folio_asignado')
    .gte('created_at', inicioAño)
    .order('created_at', { ascending: true })

  // ── 2. Pipeline — pendientes/en revisión con precio ───────────────────────
  const { data: pipeline } = await supabase
    .from('solicitudes_folio')
    .select('precio_propuesto')
    .in('status', ['pendiente', 'en_revision'])

  // ── 3. Totales anuales ────────────────────────────────────────────────────
  const rows      = foliosAño ?? []
  const totalAño  = rows.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const pipelineTotal = (pipeline ?? []).reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)

  // ── 4. Mes actual vs anterior ─────────────────────────────────────────────
  const rowsMes    = rows.filter(r => r.created_at >= inicioMes)
  const rowsMesAnt = rows.filter(r => r.created_at >= inicioMesAnt && r.created_at < finMesAnt)
  const totalMes    = rowsMes.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const totalMesAnt = rowsMesAnt.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const tendenciaMes = pct(totalMes, totalMesAnt)

  // ── 5. Desglose mensual para gráfica (12 meses del año) ───────────────────
  const porMes: number[] = Array(12).fill(0)
  const foliosPorMes: number[] = Array(12).fill(0)
  for (const r of rows) {
    const m = new Date(r.created_at).getMonth()
    porMes[m] += r.precio_propuesto ?? 0
    foliosPorMes[m]++
  }
  const maxMes = Math.max(...porMes, 1)

  // ── 6. Top inspectores del año ────────────────────────────────────────────
  const inspMap = new Map<string, { nombre: string; total: number; folios: number }>()
  for (const r of rows) {
    const insp = r.inspector as any
    const key  = insp?.id ?? 'unknown'
    const nombre = insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : 'Sin asignar'
    const prev = inspMap.get(key) ?? { nombre, total: 0, folios: 0 }
    inspMap.set(key, { nombre, total: prev.total + (r.precio_propuesto ?? 0), folios: prev.folios + 1 })
  }
  const topInspectores = Array.from(inspMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // ── 7. Mes más rentable del año ───────────────────────────────────────────
  const mesMasAlto = porMes.indexOf(Math.max(...porMes))

  return (
    <section className="space-y-5">

      {/* ── Sección header ── */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <TrendingUp className="w-5 h-5 text-brand-green" />
        <div>
          <h2 className="text-base font-bold text-gray-900">Finanzas {año}</h2>
          <p className="text-xs text-gray-400">Folios emitidos · Comisiones · Pipeline</p>
        </div>
      </div>

      {/* ── KPI Cards row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <FinKPI
          label={`Total facturado ${año} (s/IVA)`}
          value={formatCurrency(totalAño)}
          sub={`${rows.length} folio${rows.length !== 1 ? 's' : ''} emitido${rows.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          accent="bg-brand-green"
        />
        <FinKPI
          label="Comisión Unidad (40%)"
          value={formatCurrency(totalAño * COMISION_UNIDAD)}
          sub={`c/IVA: ${formatCurrency(totalAño * COMISION_UNIDAD * (1 + IVA))}`}
          icon={Building2}
          accent="bg-brand-orange"
        />
        <FinKPI
          label="Comisión Inspectores (60%)"
          value={formatCurrency(totalAño * COMISION_INSPECTOR)}
          sub={`c/IVA: ${formatCurrency(totalAño * COMISION_INSPECTOR * (1 + IVA))}`}
          icon={Users}
          accent="bg-blue-500"
        />
        <FinKPI
          label="Total c/IVA"
          value={formatCurrency(totalAño * (1 + IVA))}
          sub={`IVA: ${formatCurrency(totalAño * IVA)}`}
          icon={DollarSign}
          accent="bg-purple-500"
        />
      </div>

      {/* ── Mes actual + Pipeline ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FinKPI
          label={`${MESES_CORTO[mesActual]} ${año} (s/IVA)`}
          value={formatCurrency(totalMes)}
          sub={`${rowsMes.length} folio${rowsMes.length !== 1 ? 's' : ''} este mes`}
          icon={TrendingUp}
          accent="bg-brand-green"
          trend={tendenciaMes}
        />
        <FinKPI
          label={`${MESES_CORTO[mesActual === 0 ? 11 : mesActual - 1]} ${mesActual === 0 ? año - 1 : año} (mes anterior)`}
          value={formatCurrency(totalMesAnt)}
          sub={`${rowsMesAnt.length} folio${rowsMesAnt.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          accent="bg-gray-400"
        />
        <FinKPI
          label="Pipeline pendiente"
          value={formatCurrency(pipelineTotal)}
          sub={`${pipeline?.length ?? 0} solicitud${(pipeline?.length ?? 0) !== 1 ? 'es' : ''} en proceso`}
          icon={Clock}
          accent="bg-yellow-500"
        />
      </div>

      {/* ── Gráfica mensual + Top Inspectores ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Gráfica de barras CSS */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Ingresos por Mes {año}</h3>
            {maxMes > 0 && (
              <span className="text-xs text-gray-400">
                Mejor mes: <span className="font-semibold text-gray-700">{MESES_CORTO[mesMasAlto]}</span>
              </span>
            )}
          </div>

          <div className="flex items-end gap-1.5 h-36">
            {porMes.map((val, i) => {
              const isFuture = i > mesActual
              const isCurrent = i === mesActual
              const heightPct = val > 0 ? Math.max((val / maxMes) * 100, 4) : 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  {val > 0 && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="font-semibold">{formatCurrency(val)}</p>
                      <p className="text-gray-300">{foliosPorMes[i]} folio{foliosPorMes[i] !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {/* Bar */}
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className={[
                        'w-full rounded-t-md transition-all',
                        isFuture     ? 'bg-gray-100' :
                        isCurrent    ? 'bg-brand-orange' :
                        val > 0      ? 'bg-brand-green' :
                        'bg-gray-100',
                      ].join(' ')}
                      style={{ height: `${heightPct}%`, minHeight: isFuture ? '0' : val > 0 ? '4px' : '0' }}
                    />
                  </div>
                  {/* Label */}
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-brand-orange' : 'text-gray-400'}`}>
                    {MESES_CORTO[i]}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-green inline-block" /> Cerrado
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-orange inline-block" /> Mes actual
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" /> Sin datos
            </span>
          </div>
        </div>

        {/* Top inspectores */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Top Inspectores {año}</h3>
          </div>

          {topInspectores.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topInspectores.map((insp, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center gap-3">
                  <span className={[
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0',
                    idx === 0 ? 'bg-brand-green text-white' :
                    idx === 1 ? 'bg-blue-100 text-blue-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500',
                  ].join(' ')}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{insp.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {insp.folios} folio{insp.folios !== 1 ? 's' : ''} · comisión {formatCurrency(insp.total * COMISION_INSPECTOR)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-green whitespace-nowrap">
                    {formatCurrency(insp.total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pie de totales */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Comisión Unidad (40%)</span>
              <span className="font-bold text-brand-orange">{formatCurrency(totalAño * COMISION_UNIDAD)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Total c/IVA</span>
              <span className="font-bold text-gray-700">{formatCurrency(totalAño * (1 + IVA))}</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
