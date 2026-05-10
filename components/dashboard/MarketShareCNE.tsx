'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react'
import {
  calcMarketShare,
  calcResumenAnual,
  type CertRaw,
  type Granularidad,
} from '@/lib/dashboard/market-share-cne'

interface Props {
  certs: CertRaw[]
}

const GRAN_LABELS: Record<Granularidad, string> = {
  semana:    'Semanal',
  mes:       'Mensual',
  trimestre: 'Trimestral',
}

function fmtPct(n: number): string {
  if (n >= 100) return '100%'
  if (n >= 10)  return `${n.toFixed(1)}%`
  return `${n.toFixed(2)}%`
}

export default function MarketShareCNE({ certs }: Props) {
  const [gran, setGran] = useState<Granularidad>('mes')

  const stats   = useMemo(() => calcMarketShare(certs, gran), [certs, gran])
  const resumen = useMemo(() => calcResumenAnual(certs),       [certs])

  if (!resumen) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aún no hay certificados emitidos en el año.</p>
      </div>
    )
  }

  // Stats descendente — el periodo más reciente arriba
  const statsDesc = [...stats].reverse()
  const periodoActual = statsDesc[0]

  return (
    <div className="space-y-4">
      {/* Header con título y switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-green" />
          <h2 className="text-base font-bold text-gray-900">
            Market Share — Certificados CNE {resumen.year}
          </h2>
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
          {(['semana', 'mes', 'trimestre'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGran(g)}
              className={`px-3 py-1.5 font-semibold transition-colors ${
                gran === g
                  ? 'bg-brand-green text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {GRAN_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen anual + periodo actual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card bg-gradient-to-br from-brand-green/5 to-white border-brand-green/30">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Acumulado {resumen.year}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-brand-green tabular-nums">{resumen.nuestros}</span>
            <span className="text-xs text-gray-400">/ {resumen.nacional_estim} nacional</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-600">{fmtPct(resumen.share_pct)}</span>
            <span className="text-xs text-gray-400">de share</span>
          </div>
        </div>

        {periodoActual && (
          <div className="card">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo actual
            </p>
            <p className="text-sm font-semibold text-gray-700 mt-1 capitalize">{periodoActual.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{periodoActual.nuestros}</span>
              <span className="text-xs text-gray-400">/ {periodoActual.nacional_estim}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Share: <span className="font-semibold text-brand-green">{fmtPct(periodoActual.share_pct)}</span>
            </div>
          </div>
        )}

        <div className="card">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rango cert # vistos</p>
          <p className="text-sm font-mono text-gray-700 mt-2">
            {String(resumen.cert_min).padStart(5, '0')} → {String(resumen.cert_max).padStart(5, '0')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            (UIIE-CC-XXXXX-{resumen.year})
          </p>
        </div>
      </div>

      {/* Tabla de periodos */}
      {statsDesc.length > 0 && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Periodo</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nuestros</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nacional</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Share</th>
                <th className="py-2.5 px-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {statsDesc.map((row) => {
                const barWidth = Math.min(row.share_pct, 100)
                return (
                  <tr key={row.start} className="border-b border-gray-50 hover:bg-gray-50/40">
                    <td className="py-2.5 px-4 text-gray-800 font-medium capitalize">{row.label}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-brand-green">{row.nuestros}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-gray-600">{row.nacional_estim}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-gray-900">{fmtPct(row.share_pct)}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.share_pct >= 15 ? 'bg-emerald-500' :
                            row.share_pct >= 8  ? 'bg-brand-green' :
                            row.share_pct >= 3  ? 'bg-brand-orange' :
                            'bg-gray-300'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        💡 El total nacional se estima a partir del rango de números de certificado
        observados en nuestros expedientes (UIIE-CC-XXXXX). Si el CNE emite muchos
        certificados a otras unidades de inspección que nosotros no procesamos, la
        secuencia avanza igual y eso se refleja aquí.
      </p>
    </div>
  )
}
