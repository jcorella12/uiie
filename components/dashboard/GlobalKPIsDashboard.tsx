// Server component — no 'use client'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, getPrecioBase, TABULADOR, UMBRAL_AUTORIZACION } from '@/lib/pricing'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Users, BarChart3, MapPin, Award, DollarSign, Building2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type InspStats = {
  nombre: string
  folios: number
  totalMonto: number
  totalKwp: number
  avgPctTabulador: number
  pctAbajo: number
  pctUmbral: number
  pctCompleto: number
  avgKwp: number
  ticketPromedio: number
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600">
      <ArrowUpRight className="w-3 h-3" />+{value}%
    </span>
  )
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
      <ArrowDownRight className="w-3 h-3" />{value}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-400">
      <Minus className="w-3 h-3" />0%
    </span>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
      {children}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default async function GlobalKPIsDashboard() {
  const supabase = await createServiceClient()

  // ── Date boundaries ─────────────────────────────────────────────────────────
  const hoy  = new Date()
  const año  = hoy.getFullYear()
  const mes  = hoy.getMonth() // 0-based

  const dow = hoy.getDay() || 7
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - dow + 1)
  inicioSemana.setHours(0, 0, 0, 0)

  const inicioMes    = new Date(año, mes, 1).toISOString()
  const inicioMesAnt = new Date(año, mes - 1, 1).toISOString()
  const finMesAnt    = inicioMes
  const inicioAño    = new Date(año, 0, 1).toISOString()
  const inicioSem    = inicioSemana.toISOString()

  // Plain date strings for DATE columns in Supabase (avoid timestamp vs date comparison bugs)
  const inicioAñoDate = `${año}-01-01`

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  // ── Fetch all data in parallel ───────────────────────────────────────────────
  const [
    { data: expedientes },
    { data: solicitudes },
    { data: pipeline },
    { data: inspectores },
  ] = await Promise.all([
    supabase
      .from('expedientes')
      .select('id, status, kwp, created_at, ciudad, estado_mx, inspector_id')
      .gte('created_at', inicioAño),
    // folio_asignado = certificado CNE emitido; fecha_revision = cuando el admin asignó el folio
    supabase
      .from('solicitudes_folio')
      .select('id, kwp, precio_propuesto, created_at, fecha_revision, inspector_id, inspector:usuarios!inspector_id(id, nombre, apellidos)')
      .eq('status', 'folio_asignado')
      .not('fecha_revision', 'is', null)
      .gte('fecha_revision', inicioAño),
    supabase
      .from('solicitudes_folio')
      .select('precio_propuesto')
      .in('status', ['pendiente', 'en_revision']),
    supabase
      .from('usuarios')
      .select('id, nombre, apellidos')
      .in('rol', ['inspector', 'auxiliar']),
  ])

  // ── Compute ─────────────────────────────────────────────────────────────────
  const expAño   = expedientes ?? []
  const folios   = solicitudes ?? []   // status='folio_asignado' = certificado CRE emitido
  const inspList = inspectores ?? []

  // Cert counts: fecha_revision = cuando el admin asignó el folio = fecha de emisión del certificado
  const certsSemana = folios.filter(f => f.fecha_revision! >= inicioSem)
  const certsMes    = folios.filter(f => f.fecha_revision! >= inicioMes)
  const certsAño    = folios   // ya filtrado fecha_revision >= inicioAño en la query

  // Status breakdown (year — expedientes opened)
  const byStatus = {
    borrador: 0, en_proceso: 0, revision: 0,
    aprobado: 0, rechazado: 0, cerrado: 0,
  } as Record<string, number>
  for (const e of expAño) {
    if (e.status in byStatus) byStatus[e.status]++
  }
  const totalStatusCount = Math.max(expAño.length, 1)

  // Still keep expMes for secondary label on card
  const expMes = expAño.filter(e => e.created_at >= inicioMes)

  // Nacionales: todo folio_asignado tiene folio CRE → todos son nacionales (100%)
  // Mostramos % de expedientes finalizados vs total del año
  const finalizados   = expAño.filter(e => e.status === 'aprobado' || e.status === 'cerrado')
  const pctNacionales = expAño.length > 0
    ? Math.round((finalizados.length / expAño.length) * 100)
    : 0

  // Financiero
  const COMISION_UNIDAD    = 0.40
  const COMISION_INSPECTOR = 0.60
  const IVA = 0.16

  const totalAño     = folios.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  // Financiero también por fecha_revision (consistente con conteo de certs)
  const foliosMes    = folios.filter(r => r.fecha_revision! >= inicioMes)
  const foliosMesAnt = folios.filter(r => r.fecha_revision! >= inicioMesAnt && r.fecha_revision! < finMesAnt)
  const totalMes     = foliosMes.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const totalMesAnt  = foliosMesAnt.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const pipelineTotal = (pipeline ?? []).reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const tendenciaMes  = totalMesAnt > 0
    ? Math.round(((totalMes - totalMesAnt) / totalMesAnt) * 100)
    : 0

  // Monthly bar chart por fecha_revision
  const porMes: number[]      = Array(12).fill(0)
  const foliosPorMes: number[] = Array(12).fill(0)
  for (const r of folios) {
    const m = new Date(r.fecha_revision!).getMonth()
    porMes[m] += r.precio_propuesto ?? 0
    foliosPorMes[m]++
  }
  const maxMes = Math.max(...porMes, 1)

  // Per-inspector tabulador analytics
  const inspMap = new Map<string, {
    nombre: string; folios: number; totalMonto: number; totalKwp: number;
    pcts: number[]; bajo: number; umbral: number; completo: number
  }>()
  for (const r of folios) {
    const insp   = (r as any).inspector as { id: string; nombre: string; apellidos?: string } | null
    const key    = insp?.id ?? 'unknown'
    const nombre = insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '?'
    const prev   = inspMap.get(key) ?? { nombre, folios: 0, totalMonto: 0, totalKwp: 0, pcts: [], bajo: 0, umbral: 0, completo: 0 }
    const precio = r.precio_propuesto ?? 0
    const kwp    = r.kwp ?? 0
    const precioBase = getPrecioBase(kwp)
    const pctTab = precioBase ? Math.round((precio / precioBase) * 100) : null
    prev.folios++
    prev.totalMonto += precio
    prev.totalKwp   += kwp
    if (pctTab !== null) {
      prev.pcts.push(pctTab)
      if (pctTab >= 100) prev.completo++
      else if (pctTab >= 70) prev.umbral++
      else prev.bajo++
    }
    inspMap.set(key, prev)
  }
  const inspStats: InspStats[] = Array.from(inspMap.values()).map(s => ({
    nombre:         s.nombre,
    folios:         s.folios,
    totalMonto:     s.totalMonto,
    totalKwp:       s.totalKwp,
    avgPctTabulador: s.pcts.length > 0 ? Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length) : 0,
    pctAbajo:        s.folios > 0 ? Math.round(s.bajo    / s.folios * 100) : 0,
    pctUmbral:       s.folios > 0 ? Math.round(s.umbral  / s.folios * 100) : 0,
    pctCompleto:     s.folios > 0 ? Math.round(s.completo / s.folios * 100) : 0,
    avgKwp:          s.folios > 0 ? Math.round(s.totalKwp / s.folios * 10) / 10 : 0,
    ticketPromedio:  s.folios > 0 ? Math.round(s.totalMonto / s.folios) : 0,
  })).sort((a, b) => b.folios - a.folios)

  // Top ciudades
  const ciudadMap = new Map<string, number>()
  for (const e of expAño) {
    const ciudad = e.ciudad ?? 'Sin ciudad'
    ciudadMap.set(ciudad, (ciudadMap.get(ciudad) ?? 0) + 1)
  }
  const topCiudades = Array.from(ciudadMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ciudad, count]) => ({ ciudad, count }))
  const maxCiudad = Math.max(...topCiudades.map(c => c.count), 1)

  // Team stats
  const totalKwpAño = folios.reduce((s, r) => s + (r.kwp ?? 0), 0)
  const avgKwpGlobal = folios.length > 0 ? Math.round(totalKwpAño / folios.length * 10) / 10 : 0

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Actividad
      ══════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Actividad · {año}</h2>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Esta Semana */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <SectionHeader>Esta Semana</SectionHeader>
            <p className="text-3xl font-extrabold text-blue-700">{certsSemana.length}</p>
            <p className="text-xs text-blue-500 mt-1">certificados emitidos</p>
            <p className="text-xs text-blue-400 mt-0.5">{expAño.filter(e => e.created_at >= inicioSem).length} exp. abiertos</p>
          </div>
          {/* Este Mes */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <SectionHeader>Este Mes · {MESES[mes]}</SectionHeader>
            <p className="text-3xl font-extrabold text-green-700">{certsMes.length}</p>
            <p className="text-xs text-green-500 mt-1">certificados emitidos</p>
            <p className="text-xs text-green-400 mt-0.5">{expMes.length} exp. abiertos</p>
          </div>
          {/* Este Año */}
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <SectionHeader>Este Año · {año}</SectionHeader>
            <p className="text-3xl font-extrabold text-purple-700">{certsAño.length}</p>
            <p className="text-xs text-purple-500 mt-1">certificados emitidos</p>
            <p className="text-xs text-purple-400 mt-0.5">{expAño.length} exp. abiertos</p>
          </div>
          {/* Nacionales */}
          <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <SectionHeader>Nacionales CRE</SectionHeader>
            <p className="text-3xl font-extrabold text-amber-700">{certsAño.length}</p>
            <p className="text-xs text-amber-600 mt-1">folios CRE emitidos en {año}</p>
            <p className="text-xs text-amber-400 mt-0.5">
              {pctNacionales}% de {expAño.length} expedientes finalizados
            </p>
          </div>
        </div>

        {/* Status breakdown bar */}
        <div className="card">
          <SectionHeader>Distribución por Estatus (año)</SectionHeader>

          <div className="space-y-2.5">
            {(
              [
                { key: 'en_proceso', label: 'En Proceso',  color: 'bg-blue-400'   },
                { key: 'revision',   label: 'En Revisión', color: 'bg-amber-400'  },
                { key: 'aprobado',   label: 'Aprobado',    color: 'bg-green-500'  },
                { key: 'rechazado',  label: 'Rechazado',   color: 'bg-red-400'    },
                { key: 'cerrado',    label: 'Cerrado',      color: 'bg-gray-400'   },
                { key: 'borrador',   label: 'Borrador',    color: 'bg-slate-300'  },
              ] as const
            ).map(({ key, label, color }) => {
              const count = byStatus[key] ?? 0
              const pct   = Math.round((count / totalStatusCount) * 100)
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-500 font-medium flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${color} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-gray-700">{count}</span>
                  <span className="w-8 text-right text-xs text-gray-400">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — Financiero
      ══════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-bold text-gray-900">Financiero · {año}</h2>
        </div>

        {/* Top row KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card">
            <SectionHeader>Total Año s/IVA</SectionHeader>
            <p className="text-2xl font-extrabold text-green-700">{formatCurrency(totalAño)}</p>
            <p className="text-xs text-gray-400 mt-1">{folios.length} folio{folios.length !== 1 ? 's' : ''} emitidos</p>
          </div>
          <div className="card">
            <SectionHeader>Comisión Unidad 40%</SectionHeader>
            <p className="text-2xl font-extrabold text-orange-600">{formatCurrency(totalAño * COMISION_UNIDAD)}</p>
            <p className="text-xs text-gray-400 mt-1">c/IVA: {formatCurrency(totalAño * COMISION_UNIDAD * (1 + IVA))}</p>
          </div>
          <div className="card">
            <SectionHeader>Comisión Inspectores 60%</SectionHeader>
            <p className="text-2xl font-extrabold text-blue-600">{formatCurrency(totalAño * COMISION_INSPECTOR)}</p>
            <p className="text-xs text-gray-400 mt-1">c/IVA: {formatCurrency(totalAño * COMISION_INSPECTOR * (1 + IVA))}</p>
          </div>
          <div className="card">
            <SectionHeader>Total c/IVA</SectionHeader>
            <p className="text-2xl font-extrabold text-purple-700">{formatCurrency(totalAño * (1 + IVA))}</p>
            <p className="text-xs text-gray-400 mt-1">IVA: {formatCurrency(totalAño * IVA)}</p>
          </div>
        </div>

        {/* Second row: mes actual, mes anterior, pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <SectionHeader>Mes Actual s/IVA</SectionHeader>
            <p className="text-2xl font-extrabold text-gray-800">{formatCurrency(totalMes)}</p>
            <div className="mt-1 flex items-center gap-2">
              <TrendBadge value={tendenciaMes} />
              <span className="text-xs text-gray-400">vs mes anterior</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{foliosMes.length} folio{foliosMes.length !== 1 ? 's' : ''} en {MESES[mes]}</p>
          </div>
          <div className="card">
            <SectionHeader>Mes Anterior</SectionHeader>
            <p className="text-2xl font-extrabold text-gray-600">{formatCurrency(totalMesAnt)}</p>
            <p className="text-xs text-gray-400 mt-1">{foliosMesAnt.length} folio{foliosMesAnt.length !== 1 ? 's' : ''} en {MESES[mes === 0 ? 11 : mes - 1]}</p>
          </div>
          <div className="card">
            <SectionHeader>Pipeline Pendiente</SectionHeader>
            <p className="text-2xl font-extrabold text-yellow-600">{formatCurrency(pipelineTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">{pipeline?.length ?? 0} solicitud{(pipeline?.length ?? 0) !== 1 ? 'es' : ''} en proceso</p>
          </div>
        </div>

        {/* Monthly CSS bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader>Ingresos por Mes {año}</SectionHeader>
            <span className="text-xs text-gray-400">
              Mejor mes:{' '}
              <span className="font-semibold text-gray-600">
                {MESES[porMes.indexOf(Math.max(...porMes))]}
              </span>
            </span>
          </div>

          <div className="flex items-end gap-1 h-36">
            {porMes.map((val, i) => {
              const isFuture  = i > mes
              const isCurrent = i === mes
              const heightPct = val > 0 ? Math.max((val / maxMes) * 100, 4) : 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  {val > 0 && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                      <p className="font-semibold">{formatCurrency(val)}</p>
                      <p className="text-gray-300">{foliosPorMes[i]} folio{foliosPorMes[i] !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {/* Bar */}
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className={[
                        'w-full rounded-t-md transition-all',
                        isFuture  ? 'bg-gray-100' :
                        isCurrent ? 'bg-orange-400' :
                        val > 0   ? 'bg-green-500' :
                                    'bg-gray-100',
                      ].join(' ')}
                      style={{
                        height: `${heightPct}%`,
                        minHeight: !isFuture && val > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  {/* Month label */}
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-orange-500' : 'text-gray-400'}`}>
                    {MESES[i]}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-50 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Meses pasados
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" /> Mes actual
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" /> Sin datos
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — Tabulador por Inspector
      ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-900">
            Desempeño Tabulador · {año}
          </h2>
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <span className="font-semibold text-gray-700">100%</span> = precio base del tabulador.
          El umbral mínimo autorizado es{' '}
          <span className="font-semibold text-amber-700">{Math.round(UMBRAL_AUTORIZACION * 100)}%</span>.
          Porcentajes promedio por inspector.
        </p>

        {inspStats.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin datos de folios en {año}</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Inspector</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Folios</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Avg % Tab.</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Distribución</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Ticket Prom.</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">kWp Prom.</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Año</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inspStats.map((insp, idx) => {
                    const pillColor =
                      insp.avgPctTabulador >= 100 ? 'bg-green-100 text-green-800' :
                      insp.avgPctTabulador >= 70  ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-700'
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{insp.nombre}</td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">{insp.folios}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${pillColor}`}>
                            {insp.avgPctTabulador}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {insp.folios > 0 ? (
                            <div className="flex items-center gap-1">
                              {/* Stacked bar */}
                              <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-100 min-w-[100px]">
                                {insp.pctCompleto > 0 && (
                                  <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${insp.pctCompleto}%` }}
                                    title={`Completo: ${insp.pctCompleto}%`}
                                  />
                                )}
                                {insp.pctUmbral > 0 && (
                                  <div
                                    className="bg-amber-400 h-full"
                                    style={{ width: `${insp.pctUmbral}%` }}
                                    title={`Umbral: ${insp.pctUmbral}%`}
                                  />
                                )}
                                {insp.pctAbajo > 0 && (
                                  <div
                                    className="bg-red-400 h-full"
                                    style={{ width: `${insp.pctAbajo}%` }}
                                    title={`Bajo: ${insp.pctAbajo}%`}
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1">
                                {insp.pctCompleto}/{insp.pctUmbral}/{insp.pctAbajo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 whitespace-nowrap">{formatCurrency(insp.ticketPromedio)}</td>
                        <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">{insp.avgKwp} kWp</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(insp.totalMonto)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="py-2.5 px-4 text-xs font-semibold text-gray-600">Total</td>
                    <td className="py-2.5 px-4 text-center text-xs font-bold text-gray-700">{folios.length}</td>
                    <td colSpan={4} />
                    <td className="py-2.5 px-4 text-right text-xs font-bold text-gray-900">{formatCurrency(totalAño)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-5 px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> ≥100% Completo
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 70–99% Umbral
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> &lt;70% Bajo umbral
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — Actividad por Ciudad
      ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Actividad por Ciudad · {año}</h2>
        </div>

        {topCiudades.length === 0 ? (
          <div className="card text-center py-10 text-gray-400 text-sm">Sin datos geográficos</div>
        ) : (
          <div className="card space-y-3">
            <SectionHeader>Top 8 ciudades por número de expedientes</SectionHeader>
            {topCiudades.map(({ ciudad, count }, idx) => {
              const barWidth = Math.round((count / maxCiudad) * 100)
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-gray-400 font-medium text-right flex-shrink-0">{idx + 1}</span>
                  <span className="w-40 text-sm text-gray-700 font-medium truncate flex-shrink-0">{ciudad}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-gray-800 flex-shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — Estado del Equipo
      ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Users className="w-5 h-5 text-purple-500" />
          <h2 className="text-base font-bold text-gray-900">Estado del Equipo</h2>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card text-center">
            <SectionHeader>Inspectores Activos</SectionHeader>
            <p className="text-3xl font-extrabold text-purple-700">{inspList.length}</p>
            <p className="text-xs text-gray-400 mt-1">inspector{inspList.length !== 1 ? 'es' : ''} / auxiliar</p>
          </div>
          <div className="card text-center">
            <SectionHeader>Folios Totales Año</SectionHeader>
            <p className="text-3xl font-extrabold text-gray-800">{folios.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {inspList.length > 0
                ? `≈ ${Math.round(folios.length / inspList.length * 10) / 10} por inspector`
                : 'sin inspectores'}
            </p>
          </div>
          <div className="card text-center">
            <SectionHeader>kWp Total Año</SectionHeader>
            <p className="text-3xl font-extrabold text-green-700">{totalKwpAño.toLocaleString('es-MX')}</p>
            <p className="text-xs text-gray-400 mt-1">kilowatts-pico inspeccionados</p>
          </div>
          <div className="card text-center">
            <SectionHeader>Promedio kWp</SectionHeader>
            <p className="text-3xl font-extrabold text-blue-700">{avgKwpGlobal}</p>
            <p className="text-xs text-gray-400 mt-1">kWp por expediente</p>
          </div>
        </div>

        {/* TABULADOR reference — compact */}
        <div className="card">
          <SectionHeader>Tabulador de Referencia UIIE-CRE-021</SectionHeader>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TABULADOR.slice(0, 12).map((range, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                <p className="text-[10px] text-gray-400">{range.min}–{range.max} kWp</p>
                <p className="text-xs font-bold text-gray-700">{formatCurrency(range.precio_base)}</p>
              </div>
            ))}
          </div>
          {TABULADOR.length > 12 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              +{TABULADOR.length - 12} rangos adicionales hasta {TABULADOR[TABULADOR.length - 1].max} kWp
            </p>
          )}
        </div>
      </section>

    </div>
  )
}
