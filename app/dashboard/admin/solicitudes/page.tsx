import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StatusBadge, SOLICITUD_STATUS } from '@/components/ui/StatusBadge'
import SolicitudesFilters from '@/components/solicitudes/SolicitudesFilters'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import {
  ClipboardList, AlertTriangle, ArrowRight, Eye, MoreHorizontal,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const PAGE_SIZE = 20

interface Props {
  searchParams: {
    tab?: string
    q?: string
    inspector?: string
    kwp?: string
    periodo?: string
    page?: string
  }
}

export default async function GestionSolicitudesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')) redirect('/dashboard')

  // ── Carga toda la lista (filtros se aplican en JS para flexibilidad) ─────
  const { data: solicitudes } = await supabase
    .from('solicitudes_folio')
    .select(`
      id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, precio_base, porcentaje_precio,
      status, requiere_autorizacion, created_at, inspector_id,
      inspector:usuarios!inspector_id(nombre, apellidos)
    `)
    .order('created_at', { ascending: false })

  // Lista de inspectores activos para el filtro (bypass RLS porque inspectores normales no ven otros usuarios)
  const dbAdmin = await createServiceClient()
  const { data: inspectoresList } = await dbAdmin
    .from('usuarios')
    .select('id, nombre, apellidos')
    .in('rol', ['inspector', 'inspector_responsable', 'auxiliar'])
    .eq('activo', true)
    .order('nombre')

  const todas = solicitudes ?? []

  // ── Aplicar filtros ──────────────────────────────────────────────────────
  const tab       = searchParams?.tab       ?? 'todas'
  const q         = (searchParams?.q ?? '').trim().toLowerCase()
  const inspector = searchParams?.inspector ?? ''
  const kwpRange  = searchParams?.kwp       ?? ''
  const periodo   = searchParams?.periodo   ?? ''

  const ahora = Date.now()
  const periodoMs: Record<string, number> = {
    '7d':   7 * 24 * 60 * 60 * 1000,
    '30d':  30 * 24 * 60 * 60 * 1000,
    '90d':  90 * 24 * 60 * 60 * 1000,
    'year': 365 * 24 * 60 * 60 * 1000,
  }

  function matchesKwp(kwp: number | null | undefined) {
    if (!kwpRange) return true
    if (!kwp) return false
    if (kwpRange === '0-50')   return kwp <= 50
    if (kwpRange === '50-150') return kwp > 50 && kwp <= 150
    if (kwpRange === '150-300')return kwp > 150 && kwp <= 300
    if (kwpRange === '300+')   return kwp > 300
    return true
  }

  const filtradas = todas.filter(s => {
    // Tab/status
    if (tab === 'pendiente'      && s.status !== 'pendiente')      return false
    if (tab === 'en_revision'    && s.status !== 'en_revision')    return false
    if (tab === 'folio_asignado' && s.status !== 'folio_asignado') return false
    if (tab === 'rechazada'      && s.status !== 'rechazada')      return false
    if (tab === 'alerta'         && !s.requiere_autorizacion)      return false

    // Búsqueda libre
    if (q) {
      const haystack = [
        s.cliente_nombre,
        (s as any).propietario_nombre,
        s.id,
      ].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }

    // Inspector
    if (inspector && s.inspector_id !== inspector) return false

    // kWp
    if (!matchesKwp(s.kwp ?? null)) return false

    // Período
    if (periodo && periodoMs[periodo]) {
      const created = new Date(s.created_at).getTime()
      if (ahora - created > periodoMs[periodo]) return false
    }

    return true
  })

  // ── Paginación ──────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const pageActual = Math.min(page, totalPages)
  const slice = filtradas.slice((pageActual - 1) * PAGE_SIZE, pageActual * PAGE_SIZE)

  // ── Counts globales para los tabs (sin búsqueda/filtros) ────────────────
  const counts = {
    todas:          todas.length,
    pendiente:      todas.filter(s => s.status === 'pendiente').length,
    en_revision:    todas.filter(s => s.status === 'en_revision').length,
    folio_asignado: todas.filter(s => s.status === 'folio_asignado').length,
    rechazada:      todas.filter(s => s.status === 'rechazada').length,
    alerta:         todas.filter(s => s.requiere_autorizacion).length,
  }

  const TABS: { id: string; label: string; count: number; dot: string }[] = [
    { id: 'todas',          label: 'Todas',          count: counts.todas,          dot: 'bg-muted' },
    { id: 'pendiente',      label: 'Pendientes',     count: counts.pendiente,      dot: 'bg-gray-400' },
    { id: 'en_revision',    label: 'En revisión',    count: counts.en_revision,    dot: 'bg-purple-500' },
    { id: 'folio_asignado', label: 'Folio asignado', count: counts.folio_asignado, dot: 'bg-brand-green' },
    { id: 'rechazada',      label: 'Rechazadas',     count: counts.rechazada,      dot: 'bg-red-500' },
    { id: 'alerta',         label: 'Con alerta',     count: counts.alerta,         dot: 'bg-brand-orange' },
  ]

  // Helper para construir URL preservando filtros
  function urlWith(params: Partial<Record<string, string | null | undefined>>): string {
    const sp = new URLSearchParams()
    if (tab !== 'todas') sp.set('tab', tab)
    if (q)               sp.set('q', q)
    if (inspector)       sp.set('inspector', inspector)
    if (kwpRange)        sp.set('kwp', kwpRange)
    if (periodo)         sp.set('periodo', periodo)
    if (pageActual > 1)  sp.set('page', String(pageActual))
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === '' || (k === 'tab' && v === 'todas') || (k === 'page' && v === '1')) sp.delete(k)
      else sp.set(k, String(v))
    }
    const s = sp.toString()
    return s ? `?${s}` : ''
  }

  return (
    <div className="p-4 sm:p-7 space-y-5">

      {/* ── Tabs segmented ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="tab-segmented">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/dashboard/admin/solicitudes${urlWith({ tab: t.id, page: '1' })}`}
              className={`tab-segmented-item whitespace-nowrap ${tab === t.id ? 'is-active' : ''}`}
            >
              <span className={`dot ${t.dot}`} />
              {t.label}
              <span className="count">{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Search + filtros ───────────────────────────────────────────── */}
      <SolicitudesFilters
        inspectores={(inspectoresList ?? []) as any}
      />

      {/* ── Resumen del filtro activo ──────────────────────────────────── */}
      {(q || inspector || kwpRange || periodo) && (
        <p className="text-[12px] text-muted">
          Mostrando <span className="font-semibold text-ink2">{filtradas.length}</span> de {todas.length} solicitudes
        </p>
      )}

      {/* ── Tabla ──────────────────────────────────────────────────────── */}
      <section className="rounded-[14px] bg-white border border-border overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8 text-muted" />
            </div>
            <p className="font-semibold text-ink mb-1">Sin resultados</p>
            <p className="text-[13px] text-muted">
              {q || inspector || kwpRange || periodo
                ? 'Ajusta los filtros para ver más solicitudes'
                : 'Las solicitudes de los inspectores aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left py-3 px-5 font-medium text-muted text-[11.5px] uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Inspector</th>
                  <th className="text-right py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">kWp</th>
                  <th className="text-right py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Precio</th>
                  <th className="text-left py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">% Tabulador</th>
                  <th className="text-center py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Estado</th>
                  <th className="text-right py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Fecha</th>
                  <th className="text-right py-3 px-5 font-medium text-muted text-[11.5px] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((s) => {
                  const insp = s.inspector as any
                  const inspNombre = insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'
                  const inspIniciales = insp
                    ? `${(insp.nombre?.[0] ?? '').toUpperCase()}${(insp.apellidos?.[0] ?? '').toUpperCase()}`
                    : '?'
                  const urgente = s.requiere_autorizacion
                  const pct = (s as any).porcentaje_precio as number | null
                  const puedeAsignar = s.status === 'pendiente' || s.status === 'en_revision'

                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border/60 transition-colors ${urgente ? 'bg-[#FFFBF2] hover:bg-[#FFF7E5]' : 'hover:bg-bg/40'}`}
                    >
                      <td className="py-3 px-5 max-w-[240px]">
                        <p className="font-semibold text-ink truncate">{s.cliente_nombre ?? '—'}</p>
                        {(s as any).propietario_nombre && (
                          <p className="text-[11.5px] text-muted truncate">Sitio: {(s as any).propietario_nombre}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-2 max-w-[180px]">
                          <span className="w-7 h-7 rounded-full bg-[#EEF2F6] text-[10.5px] font-bold text-ink2 flex items-center justify-center flex-shrink-0">
                            {inspIniciales || '?'}
                          </span>
                          <span className="text-ink2 text-[12.5px] truncate">{inspNombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-ink2 font-medium tabular-nums">{s.kwp}</td>
                      <td className="py-3 px-3 text-right text-ink2 font-medium tabular-nums">{formatCurrency(s.precio_propuesto)}</td>

                      {/* Mini-bar de % tabulador */}
                      <td className="py-3 px-3">
                        <PorcentajeBar pct={pct} alerta={urgente} />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={s.status} dictionary={SOLICITUD_STATUS} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right text-muted text-[12px] whitespace-nowrap">
                        {formatDateShort(s.created_at)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/admin/solicitudes/${s.id}`}
                            title="Ver detalle"
                            aria-label="Ver detalle"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-border text-muted hover:bg-bg hover:text-ink2 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {puedeAsignar && (
                            <Link
                              href={`/dashboard/admin/folios?solicitud=${s.id}`}
                              title="Asignar folio"
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-green hover:text-brand-green-dark transition-colors px-1.5"
                            >
                              Asignar
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          <button
                            type="button"
                            title="Más acciones"
                            aria-label="Más acciones"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-border text-muted hover:bg-bg hover:text-ink2 transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ─────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <nav
            aria-label="Paginación"
            className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border"
          >
            <p className="text-[11.5px] text-muted">
              Página <span className="font-semibold text-ink2">{pageActual}</span> de {totalPages} ·{' '}
              {filtradas.length} {filtradas.length === 1 ? 'solicitud' : 'solicitudes'}
            </p>
            <div className="flex items-center gap-1">
              <Link
                aria-label="Página anterior"
                href={pageActual > 1 ? `/dashboard/admin/solicitudes${urlWith({ page: String(pageActual - 1) })}` : '#'}
                aria-disabled={pageActual === 1}
                className={`w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-muted transition-colors ${
                  pageActual === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-bg hover:text-ink2'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
              {buildPageList(pageActual, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="px-1.5 text-[12px] text-muted">…</span>
                ) : (
                  <Link
                    key={p}
                    href={`/dashboard/admin/solicitudes${urlWith({ page: String(p) })}`}
                    className={`min-w-[32px] h-8 inline-flex items-center justify-center rounded-lg text-[12.5px] font-semibold transition-colors ${
                      p === pageActual
                        ? 'bg-brand-green text-white'
                        : 'border border-border text-ink2 hover:bg-bg'
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}
              <Link
                aria-label="Página siguiente"
                href={pageActual < totalPages ? `/dashboard/admin/solicitudes${urlWith({ page: String(pageActual + 1) })}` : '#'}
                aria-disabled={pageActual === totalPages}
                className={`w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-muted transition-colors ${
                  pageActual === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-bg hover:text-ink2'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </nav>
        )}
      </section>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Mini-bar inline 60×5px con valor a la derecha.
 * Color según porcentaje:
 *  ≥100 → verde
 *  70-99 → naranja
 *  <70  → rojo
 */
function PorcentajeBar({ pct, alerta }: { pct: number | null; alerta?: boolean }) {
  if (pct == null || isNaN(pct)) {
    return <span className="text-[11px] text-muted/60">—</span>
  }
  const color =
    pct >= 100 ? 'bg-brand-green' :
    pct >= 70  ? 'bg-brand-orange' :
                 'bg-red-500'
  const txtColor =
    pct >= 100 ? 'text-brand-green-dark' :
    pct >= 70  ? 'text-brand-orange-dark' :
                 'text-red-700'
  // Cap visual al 100% pero el valor numérico puede pasarse de eso
  const fillPct = Math.max(2, Math.min(pct, 100))
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-[60px] h-[5px] rounded-[3px] bg-bg overflow-hidden border border-border/60">
        <div
          className={`absolute left-0 top-0 bottom-0 ${color} transition-all rounded-[3px]`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className={`text-[11.5px] font-bold tabular-nums ${txtColor}`}>
        {Math.round(pct)}%
      </span>
      {alerta && pct < 70 && (
        <AlertTriangle className="w-3 h-3 text-brand-orange" aria-label="Requiere autorización" />
      )}
    </div>
  )
}

/** Lista de páginas a mostrar con elipsis. Ej: 1 ... 4 5 6 ... 12 */
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
