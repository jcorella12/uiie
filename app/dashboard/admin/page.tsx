import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import KPICard from '@/components/dashboard/KPICard'
import FinancieroKPIs from '@/components/dashboard/FinancieroKPIs'
import MarketShareCNE from '@/components/dashboard/MarketShareCNE'
import { StatusBadge, SOLICITUD_STATUS } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import {
  ClipboardList, FileText, CheckCircle, AlertTriangle,
  ArrowRight, Eye,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: { tab?: string }
}

export default async function AdminDashboard({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable'].includes(usuario?.rol ?? '')) redirect('/dashboard')

  // Service client para market share — admin/responsable, ya pasó el guard
  const dbAdmin = await createServiceClient()
  const certsAdminPromise = dbAdmin
    .from('expedientes')
    .select('numero_certificado, fecha_emision_certificado')
    .not('numero_certificado', 'is', null)
    .not('fecha_emision_certificado', 'is', null)

  const [
    { count: pendientes },
    { count: enRevision },
    { count: asignados },
    { count: foliosLibres },
    { data: cola },
    { count: requierenAuth },
    { data: certsAdmin },
  ] = await Promise.all([
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'en_revision'),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('status', 'folio_asignado'),
    supabase.from('folios_lista_control').select('*', { count: 'exact', head: true }).eq('asignado', false),
    supabase.from('solicitudes_folio')
      .select('id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, status, requiere_autorizacion, created_at, inspector:usuarios!inspector_id(nombre, apellidos)')
      .in('status', ['pendiente', 'en_revision'])
      .order('created_at', { ascending: true })
      .limit(20),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true }).eq('requiere_autorizacion', true).in('status', ['pendiente', 'en_revision']),
    certsAdminPromise,
  ])

  // ── Filtro vía tab ────────────────────────────────────────────────────────
  const tabActivo = searchParams?.tab ?? 'todas'
  const filtrada = (cola ?? []).filter(s => {
    if (tabActivo === 'pendiente')   return s.status === 'pendiente'
    if (tabActivo === 'en_revision') return s.status === 'en_revision'
    if (tabActivo === 'alerta')      return s.requiere_autorizacion
    return true
  })

  const TABS: { id: string; label: string; count: number; dotColor: string }[] = [
    { id: 'todas',       label: 'Todas',         count: cola?.length ?? 0,                  dotColor: 'bg-muted' },
    { id: 'pendiente',   label: 'Pendientes',    count: (cola ?? []).filter(s => s.status === 'pendiente').length, dotColor: 'bg-gray-400' },
    { id: 'en_revision', label: 'En revisión',   count: (cola ?? []).filter(s => s.status === 'en_revision').length, dotColor: 'bg-purple-500' },
    { id: 'alerta',      label: 'Con alerta',    count: (cola ?? []).filter(s => s.requiere_autorizacion).length, dotColor: 'bg-brand-orange' },
  ]

  return (
    <div className="p-4 sm:p-7 space-y-6">

      {/* ── 1. Bloque "Requiere tu atención" ────────────────────────────── */}
      {(requierenAuth ?? 0) > 0 && (
        <div
          className="rounded-[14px] bg-white border border-border p-4 sm:p-5 flex items-start gap-4"
          style={{ borderLeft: '4px solid #EF9F27' }}
        >
          <div className="w-10 h-10 rounded-full bg-brand-orange-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-brand-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold uppercase text-brand-orange mb-1" style={{ letterSpacing: '1.2px' }}>
              Requiere tu atención
            </p>
            <p className="text-[15px] font-semibold text-ink leading-snug">
              {requierenAuth} {requierenAuth === 1 ? 'solicitud' : 'solicitudes'} con precio bajo el umbral del 70% del tabulador
            </p>
            <p className="text-[12.5px] text-muted mt-1">
              Estas solicitudes requieren tu autorización antes de avanzar al folio.
            </p>
          </div>
          <Link
            href="/dashboard/admin?tab=alerta"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-orange text-white text-[13px] font-semibold rounded-[10px] hover:bg-brand-orange-dark transition-colors flex-shrink-0"
          >
            Revisar ahora
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── 2. KPIs operativos (variante neutral) ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          variant="neutral"
          title="Solicitudes pendientes"
          value={pendientes ?? 0}
          subtitle="Sin revisar"
          icon={ClipboardList}
          color="orange"
          href="/dashboard/admin?tab=pendiente"
        />
        <KPICard
          variant="neutral"
          title="En revisión"
          value={enRevision ?? 0}
          subtitle="Requieren autorización"
          icon={AlertTriangle}
          color="purple"
          href="/dashboard/admin?tab=en_revision"
        />
        <KPICard
          variant="neutral"
          title="Folios asignados"
          value={asignados ?? 0}
          subtitle="Total histórico"
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          variant="neutral"
          title="Folios disponibles"
          value={foliosLibres ?? 0}
          subtitle="En lista de control"
          icon={FileText}
          color="blue"
          href="/dashboard/admin/folios"
        />
      </div>

      {/* ── 3. Finanzas (legacy component, mantiene su look) ────────────── */}
      <FinancieroKPIs />

      {/* ── 3.5. Market Share CNE (mes / semana / trimestre) ───────────── */}
      <MarketShareCNE certs={(certsAdmin ?? []) as any} />

      {/* ── 4. Cola de revisión con tabs segmented ─────────────────────── */}
      <section className="rounded-[14px] bg-white border border-border overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[14.5px] font-bold text-ink">Cola de revisión</h2>
            <p className="text-[11.5px] text-muted mt-0.5">Asigna folios a solicitudes aprobadas</p>
          </div>
          <Link
            href="/dashboard/admin/folios"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-green text-white text-[13px] font-semibold rounded-[10px] hover:bg-brand-green-dark transition-colors"
          >
            Asignar folios
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Tabs segmented */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 overflow-x-auto">
          <div className="tab-segmented">
            {TABS.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/admin${t.id === 'todas' ? '' : `?tab=${t.id}`}`}
                className={`tab-segmented-item ${tabActivo === t.id ? 'is-active' : ''}`}
              >
                <span className={`dot ${t.dotColor}`} />
                {t.label}
                <span className="count">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Tabla / empty state */}
        {filtrada.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-brand-green-light flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-brand-green" />
            </div>
            <p className="font-semibold text-ink mb-1">¡Cola vacía!</p>
            <p className="text-[13px] text-muted">No hay solicitudes en este filtro</p>
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
                  <th className="text-center py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Estado</th>
                  <th className="text-center py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Alerta</th>
                  <th className="text-right py-3 px-3 font-medium text-muted text-[11.5px] uppercase tracking-wider">Fecha</th>
                  <th className="text-right py-3 px-5 font-medium text-muted text-[11.5px] uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrada.map((s) => {
                  const insp = s.inspector as any
                  const inspNombre = insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'
                  const inspIniciales = insp
                    ? `${(insp.nombre?.[0] ?? '').toUpperCase()}${(insp.apellidos?.[0] ?? '').toUpperCase()}`
                    : '?'
                  const urgente = s.requiere_autorizacion
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border/60 transition-colors ${urgente ? 'bg-[#FFFBF2] hover:bg-[#FFF7E5]' : 'hover:bg-bg/40'}`}
                    >
                      <td className="py-3 px-5 max-w-[220px]">
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
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={s.status} dictionary={SOLICITUD_STATUS} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        {s.requiere_autorizacion ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange-dark bg-brand-orange-light border border-brand-orange/30 rounded-full px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> Precio bajo
                          </span>
                        ) : (
                          <span className="text-muted/50 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-muted text-[12px] whitespace-nowrap">{formatDateShort(s.created_at)}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/admin/solicitudes/${s.id}`}
                            title="Ver detalle"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-border text-muted hover:bg-bg hover:text-ink2 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/admin/folios?solicitud=${s.id}`}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-green hover:text-brand-green-dark transition-colors"
                          >
                            Asignar
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
