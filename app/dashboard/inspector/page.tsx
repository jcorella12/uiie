import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEffectiveInspectorId } from '@/lib/auth/effective-inspector'
import KPICard from '@/components/dashboard/KPICard'
import EmptyState from '@/components/ui/EmptyState'
import { StatusBadge, SOLICITUD_STATUS } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import {
  FolderOpen, FileText, Calendar, Award, Clock, SearchCheck, RotateCcw,
  ArrowRight, AlertTriangle, Zap, Users, TrendingUp, ChevronRight,
  ClipboardList, Workflow,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardInspector() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol, nombre').eq('id', user.id).single()
  const rolActual = usuario?.rol ?? 'inspector'
  if (rolActual === 'admin') redirect('/dashboard/admin')
  if (rolActual === 'cliente') redirect('/dashboard/cliente')

  const esResponsable = rolActual === 'inspector_responsable'

  const inspectorId = await getEffectiveInspectorId(supabase, user.id, rolActual)

  const anioActual = new Date().getFullYear()
  const inicioAnio = `${anioActual}-01-01T00:00:00.000Z`

  // ── Datos globales (solo responsable) ────────────────────────────────────
  let globalData: {
    totalExpedientes: number
    totalFolios: number
    totalAprobados: number
    totalEnRevision: number
    totalDevueltos: number
    totalInspectores: number
    kwpTotal: number
    inspeccionesRealizadasAnio: number
    topInspectores: { nombre: string; total: number }[]
    proximasGlobal: any[]
  } | null = null

  if (esResponsable) {
    const svc = await createServiceClient()
    const [
      { count: totalExpedientes },
      { count: totalFolios },
      { count: totalAprobados },
      { count: totalEnRevision },
      { count: totalDevueltos },
      { count: totalInspectores },
      { data: expAnio },
      { count: inspeccionesRealizadasAnio },
      { data: inspectoresList },
      { data: proximasGlobal },
    ] = await Promise.all([
      svc.from('expedientes').select('*', { count: 'exact', head: true }).gte('created_at', inicioAnio),
      svc.from('folios_lista_control').select('*', { count: 'exact', head: true }).gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true }).eq('status', 'aprobado').gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true }).eq('status', 'revision').gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true }).in('status', ['devuelto', 'rechazado']).gte('created_at', inicioAnio),
      svc.from('usuarios').select('*', { count: 'exact', head: true }).in('rol', ['inspector', 'inspector_responsable']),
      svc.from('expedientes').select('kwp, inspector_id').gte('created_at', inicioAnio),
      svc.from('inspecciones_agenda').select('*', { count: 'exact', head: true }).eq('status', 'realizada').gte('fecha_hora', inicioAnio),
      svc.from('usuarios').select('id, nombre').in('rol', ['inspector', 'inspector_responsable']).order('nombre'),
      svc.from('inspecciones_agenda')
        .select('id, fecha_hora, direccion, status, inspector:usuarios!inspector_id(nombre), expediente:expedientes(numero_folio, nombre_cliente_final, cliente:clientes(nombre))')
        .eq('status', 'programada')
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(8),
    ])

    const kwpTotal = (expAnio ?? []).reduce((sum, e) => sum + (e.kwp ?? 0), 0)
    const porInspector: Record<string, number> = {}
    for (const e of expAnio ?? []) {
      if (e.inspector_id) porInspector[e.inspector_id] = (porInspector[e.inspector_id] ?? 0) + 1
    }
    const topInspectores = (inspectoresList ?? [])
      .map(i => ({ nombre: i.nombre, total: porInspector[i.id] ?? 0 }))
      .filter(i => i.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    globalData = {
      totalExpedientes: totalExpedientes ?? 0,
      totalFolios: totalFolios ?? 0,
      totalAprobados: totalAprobados ?? 0,
      totalEnRevision: totalEnRevision ?? 0,
      totalDevueltos: totalDevueltos ?? 0,
      totalInspectores: totalInspectores ?? 0,
      kwpTotal: Math.round(kwpTotal * 100) / 100,
      inspeccionesRealizadasAnio: inspeccionesRealizadasAnio ?? 0,
      topInspectores,
      proximasGlobal: proximasGlobal ?? [],
    }
  }

  // ── KPIs personales ──────────────────────────────────────────────────────
  const [
    { count: misExpedientes },
    { count: misSolicitudesPendientes },
    { count: misInspeccionesSemana },
    { count: misFoliosAsignados },
    { count: enRevisionCIAE },
    { count: devueltas },
    { count: misEnProceso },
    { count: misCerrados },
    { data: solicitudesRecientes },
    { data: proximasInspecciones },
    { data: expActivos },
  ] = await Promise.all([
    // Expedientes/solicitudes/agenda incluyen tanto los del inspector_id como
    // los donde el usuario es inspector_ejecutor_id (delegación).
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .eq('status', 'pendiente'),
    supabase.from('inspecciones_agenda').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .eq('status', 'programada')
      .gte('fecha_hora', new Date().toISOString())
      .lte('fecha_hora', new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .eq('status', 'folio_asignado'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .eq('status', 'revision'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .in('status', ['rechazado', 'devuelto']),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .in('status', ['en_proceso', 'borrador']),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .in('status', ['aprobado', 'cerrado']),
    supabase.from('solicitudes_folio')
      .select('id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, status, created_at')
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('inspecciones_agenda')
      .select('id, fecha_hora, direccion, status, expediente:expedientes(numero_folio, cliente:clientes(nombre))')
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true })
      .limit(5),
    supabase.from('expedientes')
      .select('id, numero_folio, status, checklist_pct, cliente:clientes(nombre)')
      .or(`inspector_id.eq.${inspectorId},inspector_ejecutor_id.eq.${inspectorId}`)
      .in('status', ['devuelto', 'rechazado', 'en_proceso', 'borrador'])
      .order('created_at', { ascending: true })
      .limit(10),
  ])

  // ── Expediente prioritario ───────────────────────────────────────────────
  const activos = expActivos ?? []
  const expPrioritario =
    activos.find(e => e.status === 'devuelto') ??
    activos.find(e => e.status === 'rechazado') ??
    activos.find(e => e.status === 'en_proceso' && (e.checklist_pct ?? 0) >= 100) ??
    activos.find(e => e.status === 'en_proceso') ??
    activos.find(e => e.status === 'borrador') ??
    null

  // Mensaje, etiqueta y CTA según situación del expediente prioritario
  function ctaInfo(e: typeof expPrioritario) {
    if (!e) return null
    if (e.status === 'devuelto')
      return { eyebrow: 'Devuelto con observaciones', mensaje: 'Tu expediente fue devuelto. Corrige las observaciones del revisor y reenvíalo cuanto antes.', cta: 'Corregir y reenviar' }
    if (e.status === 'rechazado')
      return { eyebrow: 'Expediente rechazado', mensaje: 'El expediente fue rechazado por el revisor. Revisa los motivos y considera el siguiente paso.', cta: 'Ver motivos' }
    if (e.status === 'en_proceso' && (e.checklist_pct ?? 0) >= 100)
      return { eyebrow: 'Listo para enviar', mensaje: 'Tu checklist está al 100%. Es momento de enviar el paquete a revisión de CIAE.', cta: 'Enviar a revisión' }
    if (e.status === 'en_proceso')
      return { eyebrow: 'Continúa el expediente', mensaje: `Tu checklist está al ${e.checklist_pct ?? 0}%. Completa los puntos faltantes para enviar a revisión.`, cta: 'Continuar trabajo' }
    return { eyebrow: 'Completa la información', mensaje: 'Captura los datos básicos para empezar a trabajar este expediente.', cta: 'Completar información' }
  }
  const cta = ctaInfo(expPrioritario)

  // ── Pipeline: 5 etapas ───────────────────────────────────────────────────
  const pipeline = [
    { key: 'solicitud', label: 'Solicitud',         sub: 'pendientes',  count: misSolicitudesPendientes ?? 0, icon: ClipboardList, href: '/dashboard/inspector/solicitudes' },
    { key: 'folio',     label: 'Folio asignado',    sub: 'esperando',   count: misFoliosAsignados        ?? 0, icon: FileText,      href: '/dashboard/inspector/expedientes' },
    { key: 'proceso',   label: 'En proceso',        sub: 'trabajando',  count: misEnProceso              ?? 0, icon: Workflow,      href: '/dashboard/inspector/expedientes' },
    { key: 'revision',  label: 'Revisión CIAE',     sub: 'en revisión', count: enRevisionCIAE            ?? 0, icon: SearchCheck,   href: '/dashboard/inspector/expedientes' },
    { key: 'cert',      label: 'Certificados',      sub: 'emitidos',    count: misCerrados               ?? 0, icon: Award,         href: '/dashboard/inspector/certificados' },
  ] as const

  // Tu foco: la primera etapa con count > 0 con prioridad descendente
  const focoKey: typeof pipeline[number]['key'] =
    expPrioritario?.status === 'devuelto' || expPrioritario?.status === 'rechazado' ? 'proceso' :
    (misEnProceso ?? 0) > 0 ? 'proceso' :
    (misFoliosAsignados ?? 0) > 0 ? 'folio' :
    (misSolicitudesPendientes ?? 0) > 0 ? 'solicitud' :
    (enRevisionCIAE ?? 0) > 0 ? 'revision' :
    'cert'

  const STATUS_BADGE: Record<string, string> = {
    pendiente: 'badge-pendiente',
    en_revision: 'badge-en_revision',
    aprobada: 'badge-aprobada',
    rechazada: 'badge-rechazada',
    folio_asignado: 'badge-folio_asignado',
  }
  const STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente', en_revision: 'En Revisión', aprobada: 'Aprobada',
    rechazada: 'Rechazada', folio_asignado: 'Folio Asignado',
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  function esHoy(iso: string) {
    const d = new Date(iso)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === hoy.getTime()
  }

  return (
    <div className="p-4 sm:p-7 space-y-6">

      {/* ── Carta de prioridad — única, ámbar arriba ────────────────────── */}
      {expPrioritario && cta && (
        <div className="rounded-[14px] bg-white border border-border overflow-hidden" style={{ borderTop: '3px solid #EF9F27' }}>
          <div className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-orange-light flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7 text-brand-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-bold uppercase text-brand-orange mb-1.5" style={{ letterSpacing: '1.2px' }}>
                Prioridad · {cta.eyebrow}
              </p>
              <p className="text-[16px] font-semibold text-ink leading-snug">
                <span className="text-muted">"</span>
                {cta.mensaje}
                <span className="text-muted">"</span>
              </p>
              <p className="text-[12.5px] text-muted mt-1.5">
                <span className="font-mono font-semibold text-ink2">{expPrioritario.numero_folio}</span>
                {' · '}
                <span className="text-ink2">{(expPrioritario.cliente as any)?.nombre ?? 'Sin cliente'}</span>
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/dashboard/inspector/expedientes/${expPrioritario.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-border text-ink2 text-[13px] font-semibold rounded-[10px] hover:bg-bg transition-colors"
                >
                  Ver detalle
                </Link>
                <Link
                  href={`/dashboard/inspector/expedientes/${expPrioritario.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-orange text-white text-[13px] font-semibold rounded-[10px] hover:bg-brand-orange-dark transition-colors"
                >
                  {cta.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline visual: 5 etapas ───────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14.5px] font-bold text-ink">Tu flujo de trabajo</h2>
            <p className="text-[11.5px] text-muted">Un vistazo rápido al estado de tus expedientes</p>
          </div>
        </div>

        {/* Grid responsive: 5 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-2 relative">
          {pipeline.map((etapa, i) => {
            const Icon = etapa.icon
            const activo = etapa.key === focoKey
            const isLast = i === pipeline.length - 1
            return (
              <div key={etapa.key} className="relative">
                <Link
                  href={etapa.href}
                  className={`block rounded-[12px] p-3.5 border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                    activo
                      ? 'border-[rgba(239,159,39,0.4)] bg-[#FFF8EC]'
                      : 'border-border bg-[#FAFBFC] hover:border-brand-green/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-7 h-7 rounded-md bg-white border ${activo ? 'border-brand-orange/30' : 'border-border'} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${activo ? 'text-brand-orange' : 'text-muted'}`} />
                    </div>
                    {activo && (
                      <span className="text-[9.5px] font-bold uppercase text-brand-orange bg-brand-orange-light border border-brand-orange/30 rounded-full px-1.5 py-0.5" style={{ letterSpacing: '0.6px' }}>
                        Tu foco
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[26px] font-bold leading-none ${activo ? 'text-brand-orange-dark' : 'text-ink'}`}
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {etapa.count}
                  </p>
                  <p className={`text-[12.5px] font-semibold mt-1 ${activo ? 'text-ink' : 'text-ink2'}`}>{etapa.label}</p>
                  <p className="text-[11px] text-muted">{etapa.sub}</p>
                </Link>

                {/* Conector circular con chevron — solo entre cards en grid 5col */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 w-3.5 h-3.5 rounded-full bg-white border border-border items-center justify-center">
                    <ChevronRight className="w-2 h-2 text-muted" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── KPIs personales (variante neutral) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KPICard variant="neutral" title="Mis expedientes"        value={misExpedientes ?? 0}        subtitle="Total registrados"      icon={FolderOpen}  color="green"  href="/dashboard/inspector/expedientes" />
        <KPICard variant="neutral" title="Inspecciones esta semana" value={misInspeccionesSemana ?? 0} subtitle="Próximos 7 días"        icon={Calendar}    color="amber"  href="/dashboard/inspector/agenda" />
        <KPICard variant="neutral" title="En revisión CIAE"       value={enRevisionCIAE ?? 0}       subtitle="Pendientes de cierre"   icon={Clock}       color="blue"   href="/dashboard/inspector/expedientes?filter=revision" />
        <KPICard variant="neutral" title="Devueltos"              value={devueltas ?? 0}            subtitle="Con observaciones"      icon={RotateCcw}   color={(devueltas ?? 0) > 0 ? 'amber' : 'green'} href="/dashboard/inspector/expedientes?filter=devuelto" />
        <KPICard variant="neutral" title="Folios asignados"       value={misFoliosAsignados ?? 0}   subtitle="Total histórico"        icon={Award}       color="purple" />
        <KPICard variant="neutral" title="Solicitudes pendientes" value={misSolicitudesPendientes ?? 0} subtitle="En espera de folio" icon={ClipboardList} color="orange" href="/dashboard/inspector/solicitudes" />
      </div>

      {/* ── 2 columnas abajo ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Próximas inspecciones */}
        <section className="rounded-[14px] bg-white border border-border overflow-hidden">
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-[14.5px] font-bold text-ink">Próximas inspecciones</h2>
              <p className="text-[11.5px] text-muted">Tu agenda de visitas</p>
            </div>
            <Link href="/dashboard/inspector/agenda" className="text-[12.5px] text-brand-green hover:underline font-semibold">
              Ver agenda →
            </Link>
          </header>
          <div className="p-3">
            {!proximasInspecciones?.length ? (
              <EmptyState
                icon={Calendar}
                title="Sin inspecciones próximas"
                description="Programa visitas desde un expediente"
                action={{ label: 'Ir a expedientes', href: '/dashboard/inspector/expedientes' }}
                variant="compact"
              />
            ) : (
              <ul className="space-y-1">
                {proximasInspecciones.map((i) => {
                  const exp = i.expediente as any
                  const fecha = new Date(i.fecha_hora)
                  const hoyFlag = esHoy(i.fecha_hora)
                  const dia = fecha.toLocaleDateString('es-MX', { day: '2-digit' })
                  const mes = fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')
                  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  const wd  = fecha.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')
                  return (
                    <li key={i.id}>
                      <Link
                        href={`/dashboard/inspector/expedientes/${(i.expediente as any)?.id ?? ''}`}
                        className="flex items-stretch gap-3 p-2.5 rounded-lg hover:bg-bg/60 transition-colors group"
                      >
                        {/* Barra vertical verde si es hoy */}
                        {hoyFlag && <span className="w-[3px] rounded-full bg-brand-green flex-shrink-0" />}
                        {/* Día/fecha grande a la izquierda */}
                        <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                          <span className={`text-[10px] font-bold uppercase ${hoyFlag ? 'text-brand-green' : 'text-muted'}`}>{wd}</span>
                          <span className={`text-[20px] font-bold leading-none ${hoyFlag ? 'text-brand-green' : 'text-ink'}`}>{dia}</span>
                          <span className={`text-[10px] font-medium uppercase ${hoyFlag ? 'text-brand-green/80' : 'text-muted'}`}>{mes}</span>
                        </div>
                        {/* Detalle */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[13px] text-ink truncate">{exp?.cliente?.nombre ?? 'Proyecto'}</p>
                            {hoyFlag && <span className="text-[9.5px] font-bold uppercase text-brand-green bg-brand-green-light px-1.5 rounded-full">Hoy</span>}
                          </div>
                          {i.direccion && <p className="text-[11.5px] text-muted truncate">📍 {i.direccion}</p>}
                          <p className="text-[12px] text-ink2 font-medium">🕐 {hora}{exp?.numero_folio ? ` · ${exp.numero_folio}` : ''}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted/50 self-center group-hover:text-brand-green transition-colors" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Mis solicitudes recientes */}
        <section className="rounded-[14px] bg-white border border-border overflow-hidden">
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-[14.5px] font-bold text-ink">Mis solicitudes recientes</h2>
              <p className="text-[11.5px] text-muted">Las últimas que has creado</p>
            </div>
            <Link href="/dashboard/inspector/solicitudes" className="text-[12.5px] text-brand-green hover:underline font-semibold">
              Ver todas →
            </Link>
          </header>
          <div className="p-3">
            {!solicitudesRecientes?.length ? (
              <EmptyState
                icon={FileText}
                title="Sin solicitudes aún"
                description="Crea una nueva solicitud de inspección para comenzar"
                action={{ label: 'Nueva solicitud', href: '/dashboard/inspector/solicitudes/nueva' }}
                actionIcon={FileText}
                variant="compact"
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {solicitudesRecientes.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-bg/40 rounded-lg transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[13px] text-ink truncate">{s.cliente_nombre ?? '—'}</p>
                      {(s as any).propietario_nombre && (
                        <p className="text-[11.5px] text-muted truncate">Sitio: {(s as any).propietario_nombre}</p>
                      )}
                      <p className="text-[11.5px] text-ink2 mt-0.5">
                        <span className="font-medium">{s.kwp} kWp</span>
                        {rolActual !== 'auxiliar' && <span className="text-muted"> · {formatCurrency(s.precio_propuesto)}</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusBadge status={s.status} dictionary={SOLICITUD_STATUS} size="xs" />
                      <p className="text-[10.5px] text-muted mt-1">{formatDateShort(s.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ── Panel global del año — solo inspector_responsable, al final ── */}
      {esResponsable && globalData && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <h2 className="text-[14.5px] font-bold text-ink">Resumen {anioActual} — Toda la organización</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
            <KPICard variant="neutral" title="Expedientes" value={globalData.totalExpedientes} subtitle={`Creados en ${anioActual}`} icon={FolderOpen} color="green" href="/dashboard/inspector/expedientes" />
            <KPICard variant="neutral" title="Folios emitidos" value={globalData.totalFolios} subtitle={`En ${anioActual}`} icon={Award} color="purple" href="/dashboard/admin/folios" />
            <KPICard variant="neutral" title="Aprobados" value={globalData.totalAprobados} subtitle="Certificados emitidos" icon={SearchCheck} color="blue" href="/dashboard/inspector/certificados" />
            <KPICard variant="neutral" title="kWp inspeccionados" value={`${globalData.kwpTotal.toLocaleString('es-MX')}`} subtitle="Potencia del año" icon={Zap} color="amber" />
            <KPICard variant="neutral" title="En revisión" value={globalData.totalEnRevision} subtitle="Pendientes de certificado" icon={Clock} color="orange" href="/dashboard/inspector/expedientes?filter=revision" />
            <KPICard variant="neutral" title="Con observaciones" value={globalData.totalDevueltos} subtitle="Devueltos / rechazados" icon={RotateCcw} color={globalData.totalDevueltos > 0 ? 'amber' : 'green'} href="/dashboard/inspector/expedientes?filter=devuelto" />
            <KPICard variant="neutral" title="Inspecciones realizadas" value={globalData.inspeccionesRealizadasAnio} subtitle={`Completadas en ${anioActual}`} icon={Calendar} color="green" href="/dashboard/inspector/agenda" />
            <KPICard variant="neutral" title="Inspectores activos" value={globalData.totalInspectores} subtitle="En el equipo" icon={Users} color="blue" href="/dashboard/inspectores" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Top inspectores */}
            <section className="rounded-[14px] bg-white border border-border p-5">
              <h3 className="text-[14.5px] font-bold text-ink mb-3">Top inspectores ({anioActual})</h3>
              <div className="space-y-2.5">
                {globalData.topInspectores.length === 0 ? (
                  <p className="text-[12.5px] text-muted text-center py-3">Sin datos aún.</p>
                ) : globalData.topInspectores.map((ins, i) => (
                  <div key={ins.nombre} className="flex items-center gap-3">
                    <span className="w-6 text-[11px] text-muted font-mono text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12.5px] font-semibold text-ink truncate">{ins.nombre}</span>
                        <span className="text-[12px] font-bold text-brand-green ml-2 tabular-nums">{ins.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                        <div
                          className="h-full bg-brand-green rounded-full transition-all"
                          style={{ width: `${Math.round((ins.total / (globalData!.topInspectores[0]?.total || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Próximas inspecciones global */}
            <section className="rounded-[14px] bg-white border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14.5px] font-bold text-ink">Próximas inspecciones (todos)</h3>
                <Link href="/dashboard/inspector/agenda" className="text-[12.5px] text-brand-green hover:underline font-semibold">
                  Ver agenda →
                </Link>
              </div>
              {globalData.proximasGlobal.length === 0 ? (
                <p className="text-[12.5px] text-muted text-center py-3">Sin inspecciones programadas.</p>
              ) : (
                <ul className="space-y-2">
                  {globalData.proximasGlobal.map((i: any) => (
                    <li key={i.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-bg/50">
                      <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink truncate">
                          {i.expediente?.nombre_cliente_final ?? i.expediente?.cliente?.nombre ?? 'Proyecto'}
                          <span className="text-muted font-normal"> · {i.expediente?.numero_folio}</span>
                        </p>
                        <p className="text-[11.5px] text-muted truncate">{i.direccion ?? 'Sin dirección'}</p>
                        <p className="text-[11.5px] text-brand-green font-semibold">
                          {new Date(i.fecha_hora).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {i.inspector?.nombre ? ` · ${i.inspector.nombre}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
