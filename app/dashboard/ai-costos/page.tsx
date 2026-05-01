import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DollarSign, Brain, FolderOpen, User, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { formatearCostoUSD } from '@/lib/ai/cost'

export const dynamic = 'force-dynamic'

const ENDPOINT_LABELS: Record<string, string> = {
  'ocr/ine':                          'OCR INE',
  'ocr/medidor':                      'OCR Medidor',
  'inversores/ocr':                   'OCR Inversor',
  'expedientes/revision-ia':          'Revisión IA',
  'expedientes/certificado/leer':     'Lectura Certificado',
  'documentos/analizar':              'Análisis Documento',
  'cre/certificados/descargar-leer':  'Lectura CNE',
  'testigos/importar':                'Importar Participantes',
  'testigos/importar-ines':           'Importar INEs',
}

export default async function AICostosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  if (!perfil || !['admin', 'inspector_responsable'].includes(perfil.rol)) {
    redirect('/dashboard')
  }

  const db = await createServiceClient()

  // ── Mes actual ────────────────────────────────────────────────────────────
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString()

  const { data: costosMes } = await db
    .from('ai_costos')
    .select('costo_usd, endpoint, expediente_id, usuario_id, created_at')
    .gte('created_at', inicioMes)
    .order('created_at', { ascending: false })

  const { data: costosMesAnterior } = await db
    .from('ai_costos')
    .select('costo_usd')
    .gte('created_at', inicioMesAnterior)
    .lt('created_at', inicioMes)

  const { data: costosTotal } = await db
    .from('ai_costos')
    .select('costo_usd, expediente_id')

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const totalMes = (costosMes ?? []).reduce((s, r: any) => s + Number(r.costo_usd ?? 0), 0)
  const totalMesAnterior = (costosMesAnterior ?? []).reduce((s, r: any) => s + Number(r.costo_usd ?? 0), 0)
  const totalHistorico = (costosTotal ?? []).reduce((s, r: any) => s + Number(r.costo_usd ?? 0), 0)
  const numLlamadasMes = (costosMes ?? []).length
  const expedientesUnicos = new Set((costosTotal ?? []).map((r: any) => r.expediente_id).filter(Boolean))
  const promedioPorExpediente = expedientesUnicos.size > 0 ? totalHistorico / expedientesUnicos.size : 0

  // Cambio vs mes anterior
  const cambio = totalMesAnterior > 0
    ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100
    : 0

  // ── Por endpoint (mes actual) ─────────────────────────────────────────────
  const porEndpointMap: Record<string, { count: number; total: number }> = {}
  for (const r of costosMes ?? []) {
    const ep = (r as any).endpoint
    if (!porEndpointMap[ep]) porEndpointMap[ep] = { count: 0, total: 0 }
    porEndpointMap[ep].count += 1
    porEndpointMap[ep].total += Number((r as any).costo_usd ?? 0)
  }
  const porEndpoint = Object.entries(porEndpointMap)
    .map(([ep, v]) => ({ endpoint: ep, ...v }))
    .sort((a, b) => b.total - a.total)

  // ── Top usuarios (todo histórico) ─────────────────────────────────────────
  const porUsuarioMap: Record<string, { count: number; total: number }> = {}
  for (const r of costosTotal ?? []) {
    const uid = (r as any).usuario_id
    if (!uid) continue
    if (!porUsuarioMap[uid]) porUsuarioMap[uid] = { count: 0, total: 0 }
    porUsuarioMap[uid].count += 1
    porUsuarioMap[uid].total += Number((r as any).costo_usd ?? 0)
  }
  const usuarioIds = Object.keys(porUsuarioMap)
  const { data: usuarios } = usuarioIds.length > 0
    ? await db.from('usuarios').select('id, nombre, apellidos, rol, email').in('id', usuarioIds)
    : { data: [] }

  const porUsuario = (usuarios ?? [])
    .map((u: any) => ({
      ...u,
      ...(porUsuarioMap[u.id] ?? { count: 0, total: 0 }),
    }))
    .sort((a, b) => b.total - a.total)

  // ── Top expedientes ───────────────────────────────────────────────────────
  const porExpMap: Record<string, { count: number; total: number }> = {}
  for (const r of costosTotal ?? []) {
    const eid = (r as any).expediente_id
    if (!eid) continue
    if (!porExpMap[eid]) porExpMap[eid] = { count: 0, total: 0 }
    porExpMap[eid].count += 1
    porExpMap[eid].total += Number((r as any).costo_usd ?? 0)
  }
  const expIds = Object.keys(porExpMap)
    .sort((a, b) => porExpMap[b].total - porExpMap[a].total)
    .slice(0, 15)

  const { data: expedientes } = expIds.length > 0
    ? await db.from('expedientes').select('id, numero_folio, status, inspector:usuarios!inspector_id(nombre, apellidos)').in('id', expIds)
    : { data: [] }

  const topExpedientes = expIds.map(id => {
    const exp = (expedientes ?? []).find((e: any) => e.id === id)
    return {
      id,
      numero_folio: (exp as any)?.numero_folio ?? '—',
      status: (exp as any)?.status ?? '?',
      inspector: (exp as any)?.inspector,
      ...porExpMap[id],
    }
  })

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gastos en IA</h1>
          <p className="text-sm text-gray-500">Seguimiento de uso de Claude API por expediente, usuario y endpoint</p>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          label="Mes actual"
          value={formatearCostoUSD(totalMes)}
          sublabel={`${numLlamadasMes} llamadas`}
          color="emerald"
        />
        <KPICard
          icon={<TrendingUp className={cambio >= 0 ? 'w-5 h-5 text-orange-500' : 'w-5 h-5 text-emerald-500'} />}
          label="vs mes anterior"
          value={cambio === 0 ? '—' : `${cambio > 0 ? '+' : ''}${cambio.toFixed(1)}%`}
          sublabel={formatearCostoUSD(totalMesAnterior) + ' el mes pasado'}
          color={cambio >= 0 ? 'orange' : 'emerald'}
        />
        <KPICard
          icon={<FolderOpen className="w-5 h-5 text-blue-600" />}
          label="Promedio / expediente"
          value={formatearCostoUSD(promedioPorExpediente)}
          sublabel={`${expedientesUnicos.size} expedientes con IA`}
          color="blue"
        />
        <KPICard
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          label="Total histórico"
          value={formatearCostoUSD(totalHistorico)}
          sublabel="Acumulado"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por endpoint (mes actual) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Por tipo de IA (mes actual)</h2>
            <Calendar className="w-4 h-4 text-gray-300" />
          </div>
          {porEndpoint.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin uso de IA este mes.</p>
          ) : (
            <div className="space-y-2">
              {porEndpoint.map(e => {
                const pct = totalMes > 0 ? (e.total / totalMes) * 100 : 0
                return (
                  <div key={e.endpoint} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {ENDPOINT_LABELS[e.endpoint] ?? e.endpoint}
                      </span>
                      <span className="text-gray-500 text-xs tabular-nums">
                        {formatearCostoUSD(e.total)} <span className="text-gray-400">·</span> {e.count}x
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top usuarios */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Por usuario (histórico)</h2>
            <User className="w-4 h-4 text-gray-300" />
          </div>
          {porUsuario.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos.</p>
          ) : (
            <div className="space-y-2">
              {porUsuario.slice(0, 10).map((u: any) => {
                const nombre = [u.nombre, u.apellidos].filter(Boolean).join(' ') || u.email || '—'
                return (
                  <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{nombre}</p>
                      <p className="text-xs text-gray-400 capitalize">{(u.rol ?? '').replace('_', ' ')}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-mono font-semibold text-gray-900">
                        {formatearCostoUSD(u.total)}
                      </p>
                      <p className="text-xs text-gray-400">{u.count} llamadas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top expedientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Top expedientes con más IA</h2>
          <FolderOpen className="w-4 h-4 text-gray-300" />
        </div>

        {topExpedientes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin expedientes con uso de IA.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Folio</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Inspector</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Llamadas</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500">Total IA</th>
                </tr>
              </thead>
              <tbody>
                {topExpedientes.map(e => {
                  const inspNombre = e.inspector
                    ? [(e.inspector as any).nombre, (e.inspector as any).apellidos].filter(Boolean).join(' ')
                    : '—'
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/dashboard/inspector/expedientes/${e.id}`}
                          className="font-mono text-brand-green hover:underline"
                        >
                          {e.numero_folio}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-gray-700">{inspNombre}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-600">{e.count}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-mono font-semibold">
                        {formatearCostoUSD(e.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Costos calculados con tarifas de Anthropic vigentes al momento de la llamada.
        Los precios están configurados en <code className="bg-gray-100 px-1 rounded">lib/ai/cost.ts</code>.
      </p>
    </div>
  )
}

// ─── KPICard helper ───────────────────────────────────────────────────────────
function KPICard({
  icon, label, value, sublabel, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  color: 'emerald' | 'orange' | 'blue' | 'purple'
}) {
  const bg = {
    emerald: 'bg-emerald-50',
    orange:  'bg-orange-50',
    blue:    'bg-blue-50',
    purple:  'bg-purple-50',
  }[color]

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 font-mono">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}
