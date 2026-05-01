import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEffectiveInspectorId } from '@/lib/auth/effective-inspector'
import KPICard from '@/components/dashboard/KPICard'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import { FolderOpen, FileText, Calendar, Award, Clock, SearchCheck, RotateCcw, ArrowRight, AlertTriangle, Zap, Users, TrendingUp } from 'lucide-react'
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

  // Auxiliares usan el inspector_id de su inspector
  const inspectorId = await getEffectiveInspectorId(supabase, user.id, rolActual)

  // ── Año actual ────────────────────────────────────────────────────────────
  const anioActual = new Date().getFullYear()
  const inicioAnio = `${anioActual}-01-01T00:00:00.000Z`

  // ── KPIs del inspector responsable (visión global del año) ────────────────
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
      svc.from('expedientes').select('*', { count: 'exact', head: true })
        .gte('created_at', inicioAnio),
      svc.from('folios_lista_control').select('*', { count: 'exact', head: true })
        .gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true })
        .eq('status', 'aprobado').gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true })
        .eq('status', 'revision').gte('created_at', inicioAnio),
      svc.from('expedientes').select('*', { count: 'exact', head: true })
        .in('status', ['devuelto', 'rechazado']).gte('created_at', inicioAnio),
      svc.from('usuarios').select('*', { count: 'exact', head: true })
        .in('rol', ['inspector', 'inspector_responsable']),
      svc.from('expedientes').select('kwp, inspector_id')
        .gte('created_at', inicioAnio),
      svc.from('inspecciones_agenda').select('*', { count: 'exact', head: true })
        .eq('status', 'realizada').gte('fecha_hora', inicioAnio),
      svc.from('usuarios').select('id, nombre')
        .in('rol', ['inspector', 'inspector_responsable']).order('nombre'),
      svc.from('inspecciones_agenda')
        .select('id, fecha_hora, direccion, status, inspector:usuarios!inspector_id(nombre), expediente:expedientes(numero_folio, nombre_cliente_final, cliente:clientes(nombre))')
        .eq('status', 'programada')
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(8),
    ])

    // kWp total del año
    const kwpTotal = (expAnio ?? []).reduce((sum, e) => sum + (e.kwp ?? 0), 0)

    // Top inspectores por expedientes en el año
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

  // ── KPIs personales (inspector / auxiliar / también para responsable como su propio trabajo) ──
  const [
    { count: misExpedientes },
    { count: misSolicitudesPendientes },
    { count: misInspeccionesSemana },
    { count: misFoliosAsignados },
    { count: enRevisionCIAE },
    { count: devueltas },
    { data: solicitudesRecientes },
    { data: proximasInspecciones },
    { data: expActivos },
  ] = await Promise.all([
    supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('inspector_id', inspectorId),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true })
      .eq('inspector_id', inspectorId).eq('status', 'pendiente'),
    supabase.from('inspecciones_agenda').select('*', { count: 'exact', head: true })
      .eq('inspector_id', inspectorId).eq('status', 'programada')
      .gte('fecha_hora', new Date().toISOString())
      .lte('fecha_hora', new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()),
    supabase.from('solicitudes_folio').select('*', { count: 'exact', head: true })
      .eq('inspector_id', inspectorId).eq('status', 'folio_asignado'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .eq('inspector_id', inspectorId).eq('status', 'revision'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true })
      .eq('inspector_id', inspectorId).in('status', ['rechazado', 'devuelto']),
    supabase.from('solicitudes_folio')
      .select('id, cliente_nombre, propietario_nombre, kwp, precio_propuesto, status, created_at')
      .eq('inspector_id', inspectorId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('inspecciones_agenda')
      .select('id, fecha_hora, direccion, status, expediente:expedientes(numero_folio, cliente:clientes(nombre))')
      .eq('inspector_id', inspectorId)
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true })
      .limit(5),
    supabase.from('expedientes')
      .select('id, numero_folio, status, checklist_pct, cliente:clientes(nombre)')
      .eq('inspector_id', inspectorId)
      .in('status', ['devuelto', 'rechazado', 'en_proceso', 'borrador'])
      .order('created_at', { ascending: true })
      .limit(10),
  ])

  // ── Expediente más urgente ───────────────────────────────────────────────
  const activos = expActivos ?? []
  const expPrioritario =
    activos.find(e => e.status === 'devuelto') ??
    activos.find(e => e.status === 'rechazado') ??
    activos.find(e => e.status === 'en_proceso' && (e.checklist_pct ?? 0) >= 100) ??
    activos.find(e => e.status === 'en_proceso') ??
    activos.find(e => e.status === 'borrador') ??
    null

  function ctaExpediente(e: typeof expPrioritario) {
    if (!e) return null
    if (e.status === 'devuelto')
      return { texto: 'Devuelto con observaciones — corrige y reenvía', color: 'amber' as const }
    if (e.status === 'rechazado')
      return { texto: 'Rechazado — revisar motivos', color: 'red' as const }
    if (e.status === 'en_proceso' && (e.checklist_pct ?? 0) >= 100)
      return { texto: 'Enviar a revisión — checklist completo', color: 'green' as const }
    if (e.status === 'en_proceso')
      return { texto: `Continuar — checklist ${e.checklist_pct ?? 0}%`, color: 'orange' as const }
    return { texto: 'Completar información', color: 'orange' as const }
  }

  const cta = ctaExpediente(expPrioritario)

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

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido, {usuario?.nombre ?? user.email}</p>
      </div>

      {/* ── Panel expediente prioritario ── */}
      {expPrioritario && cta && (() => {
        // Mapeo de color → estilos. Importante: amber (devuelto = corregible) vs red (rechazado = serio)
        const styles = {
          red:    { border: 'border-red-200 bg-red-50',         iconBg: 'bg-red-100',    iconColor: 'text-red-600',    label: 'text-red-500',    btn: 'bg-red-600 text-white hover:bg-red-700' },
          amber:  { border: 'border-amber-200 bg-amber-50',     iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  label: 'text-amber-600',  btn: 'bg-amber-500 text-white hover:bg-amber-600' },
          orange: { border: 'border-orange-200 bg-orange-50',   iconBg: 'bg-orange-100', iconColor: 'text-orange-600', label: 'text-orange-500', btn: 'bg-orange-500 text-white hover:bg-orange-600' },
          green:  { border: 'border-emerald-200 bg-emerald-50', iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600',label: 'text-emerald-600',btn: 'bg-emerald-600 text-white hover:bg-emerald-700' },
        }[cta.color]
        const headline = {
          red:    'Requiere correcciones',
          amber:  'Devuelto con observaciones',
          orange: 'Siguiente expediente a trabajar',
          green:  'Siguiente expediente a trabajar',
        }[cta.color]

        return (
          <div className={`mb-6 rounded-xl border-2 p-5 flex items-center justify-between gap-4 ${styles.border}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                {(cta.color === 'red' || cta.color === 'amber')
                  ? <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
                  : <Zap className={`w-5 h-5 ${styles.iconColor}`} />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${styles.label}`}>
                  {headline}
                </p>
                <p className="font-bold text-gray-900 text-base truncate">
                  {(expPrioritario.cliente as any)?.nombre ?? '—'}
                </p>
                <p className="text-xs text-gray-500 font-mono">{expPrioritario.numero_folio} · {cta.texto}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/inspector/expedientes/${expPrioritario.id}`}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${styles.btn}`}
            >
              Abrir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      })()}

      {/* ── Panel global del año — solo inspector_responsable ── */}
      {esResponsable && globalData && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            Resumen {anioActual} — Toda la organización
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
            <KPICard title="Expedientes" value={globalData.totalExpedientes} subtitle={`Creados en ${anioActual}`} icon={FolderOpen} color="green" href="/dashboard/inspector/expedientes" />
            <KPICard title="Folios Emitidos" value={globalData.totalFolios} subtitle={`Registrados en ${anioActual}`} icon={Award} color="purple" href="/dashboard/admin/folios" />
            <KPICard title="Aprobados" value={globalData.totalAprobados} subtitle="Certificados emitidos" icon={SearchCheck} color="blue" href="/dashboard/inspector/certificados" />
            <KPICard title="kWp Inspeccionados" value={`${globalData.kwpTotal.toLocaleString('es-MX')} kWp`} subtitle="Potencia total del año" icon={Zap} color="amber" />
            <KPICard title="En Revisión" value={globalData.totalEnRevision} subtitle="Pendientes de certificado" icon={Clock} color="orange" href="/dashboard/inspector/expedientes?filter=revision" />
            <KPICard title="Con Observaciones" value={globalData.totalDevueltos} subtitle="Devueltos o rechazados" icon={RotateCcw} color={globalData.totalDevueltos > 0 ? 'amber' : 'green'} href="/dashboard/inspector/expedientes?filter=devuelto" />
            <KPICard title="Inspecciones Realizadas" value={globalData.inspeccionesRealizadasAnio} subtitle={`Completadas en ${anioActual}`} icon={Calendar} color="green" href="/dashboard/inspector/agenda" />
            <KPICard title="Inspectores Activos" value={globalData.totalInspectores} subtitle="En el equipo" icon={Users} color="blue" href="/dashboard/inspectores" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
            {/* Top inspectores */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top inspectores por expedientes ({anioActual})</h3>
              <div className="space-y-2">
                {globalData.topInspectores.map((ins, i) => (
                  <div key={ins.nombre} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-gray-400 font-mono text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-800 truncate">{ins.nombre}</span>
                        <span className="text-xs font-semibold text-brand-green ml-2">{ins.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-green rounded-full transition-all"
                          style={{ width: `${Math.round((ins.total / (globalData!.topInspectores[0]?.total || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {globalData.topInspectores.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-3">Sin datos aún.</p>
                )}
              </div>
            </div>

            {/* Próximas inspecciones global */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Próximas inspecciones (todos)</h3>
                <a href="/dashboard/inspector/agenda" className="text-xs text-brand-green hover:underline">Ver agenda →</a>
              </div>
              <div className="space-y-2">
                {globalData.proximasGlobal.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-3">Sin inspecciones programadas.</p>
                )}
                {globalData.proximasGlobal.map((i: any) => (
                  <div key={i.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {i.expediente?.nombre_cliente_final ?? i.expediente?.cliente?.nombre ?? 'Proyecto'}
                        <span className="text-gray-400 font-normal"> · {i.expediente?.numero_folio}</span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{i.direccion ?? 'Sin dirección'}</p>
                      <p className="text-xs text-brand-green font-medium">
                        {new Date(i.fecha_hora).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {i.inspector?.nombre ? ` · ${i.inspector.nombre}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mb-6" />
          <h2 className="text-base font-semibold text-gray-700 mb-3">Mi actividad personal</h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <KPICard title="Mis Expedientes" value={misExpedientes ?? 0} subtitle="Total registrados" icon={FolderOpen} color="green" href="/dashboard/inspector/expedientes" />
        <KPICard title="Solicitudes Pendientes" value={misSolicitudesPendientes ?? 0} subtitle="En espera de folio" icon={Clock} color="orange" href="/dashboard/inspector/solicitudes" />
        <KPICard title="Folios Asignados" value={misFoliosAsignados ?? 0} subtitle="Total histórico" icon={Award} color="purple" href="/dashboard/inspector/expedientes" />
        <KPICard
          title="En Revisión CIAE"
          value={enRevisionCIAE ?? 0}
          subtitle="Pendientes de emitirse · sin error registrado"
          icon={SearchCheck}
          color="blue"
          href="/dashboard/inspector/expedientes?filter=revision"
        />
        <KPICard
          title="Devueltas"
          value={devueltas ?? 0}
          subtitle="Regresadas con observaciones"
          icon={RotateCcw}
          color={devueltas ? 'amber' : 'green'}
          href="/dashboard/inspector/expedientes?filter=devuelto"
        />
        <KPICard title="Inspecciones esta Semana" value={misInspeccionesSemana ?? 0} subtitle="Programadas próximos 7 días" icon={Calendar} color="amber" href="/dashboard/inspector/agenda" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Mis solicitudes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Mis Solicitudes Recientes</h2>
            <a href="/dashboard/inspector/solicitudes" className="text-sm text-brand-green hover:underline font-medium">Ver todas →</a>
          </div>
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
            <div className="space-y-2">
              {solicitudesRecientes.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-800 truncate max-w-[200px]">{s.cliente_nombre ?? '—'}</p>
                    {(s as any).propietario_nombre && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">Sitio: {(s as any).propietario_nombre}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {s.kwp} kWp
                      {rolActual !== 'auxiliar' && ` · ${formatCurrency(s.precio_propuesto)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status]}</span>
                    <p className="text-xs text-gray-400 mt-1">{formatDateShort(s.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas inspecciones */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Próximas Inspecciones</h2>
            <a href="/dashboard/inspector/agenda" className="text-sm text-brand-green hover:underline font-medium">Ver agenda →</a>
          </div>
          {!proximasInspecciones?.length ? (
            <EmptyState
              icon={Calendar}
              title="Sin inspecciones próximas"
              description="Programa visitas desde un expediente"
              action={{ label: 'Ir a expedientes', href: '/dashboard/inspector/expedientes' }}
              variant="compact"
            />
          ) : (
            <div className="space-y-2">
              {proximasInspecciones.map((i) => {
                const exp = i.expediente as any
                return (
                  <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{exp?.cliente?.nombre ?? 'Proyecto'}</p>
                      <p className="text-xs text-gray-500 truncate">{i.direccion ?? 'Sin dirección'}</p>
                      <p className="text-xs text-brand-green font-medium mt-0.5">
                        {new Date(i.fecha_hora).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
