'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, AlertTriangle, Lock, Calendar } from 'lucide-react'
import Link from 'next/link'
import { tzForEstadoMx } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type InspeccionAgenda = {
  id: string
  fecha_hora: string
  status: 'programada' | 'en_curso' | 'realizada' | 'cancelada'
  expediente: { id: string; numero_folio: string; ciudad: string | null; estado_mx: string | null; cliente: { nombre: string } | null } | null
  inspector: { id: string; nombre: string } | null
}

type DiaBloqueado = {
  fecha: string
  motivo: string | null
  inspector_id: string | null
}

// ─── Constantes de calendario ─────────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

// ─── Paleta de colores por inspector ─────────────────────────────────────────
// Cada entrada: pill (fondo+texto+borde), dot (círculo leyenda), ring (hover)
const PALETTE = [
  { pill: 'bg-violet-100 text-violet-800 border border-violet-200', dot: 'bg-violet-500',  ring: 'ring-violet-200'  },
  { pill: 'bg-blue-100 text-blue-800 border border-blue-200',       dot: 'bg-blue-500',    ring: 'ring-blue-200'    },
  { pill: 'bg-teal-100 text-teal-800 border border-teal-200',       dot: 'bg-teal-500',    ring: 'ring-teal-200'    },
  { pill: 'bg-pink-100 text-pink-800 border border-pink-200',       dot: 'bg-pink-500',    ring: 'ring-pink-200'    },
  { pill: 'bg-amber-100 text-amber-800 border border-amber-200',    dot: 'bg-amber-500',   ring: 'ring-amber-200'   },
  { pill: 'bg-indigo-100 text-indigo-800 border border-indigo-200', dot: 'bg-indigo-500',  ring: 'ring-indigo-200'  },
  { pill: 'bg-rose-100 text-rose-800 border border-rose-200',       dot: 'bg-rose-500',    ring: 'ring-rose-200'    },
  { pill: 'bg-cyan-100 text-cyan-800 border border-cyan-200',       dot: 'bg-cyan-500',    ring: 'ring-cyan-200'    },
  { pill: 'bg-lime-100 text-lime-800 border border-lime-200',       dot: 'bg-lime-700',    ring: 'ring-lime-200'    },
  { pill: 'bg-orange-100 text-orange-800 border border-orange-200', dot: 'bg-orange-500',  ring: 'ring-orange-200'  },
] as const

// Colores de status para vista individual (sin admin)
const STATUS_PILL: Record<InspeccionAgenda['status'], string> = {
  programada: 'bg-orange-100 text-orange-800 border border-orange-200',
  en_curso:   'bg-blue-100 text-blue-800 border border-blue-200',
  realizada:  'bg-green-100 text-green-700 border border-green-200',
  cancelada:  'bg-red-100 text-red-700 border border-red-200',
}
const STATUS_DOT: Record<InspeccionAgenda['status'], string> = {
  programada: 'bg-orange-400',
  en_curso:   'bg-blue-500',
  realizada:  'bg-green-500',
  cancelada:  'bg-red-400',
}
const STATUS_LABEL: Record<InspeccionAgenda['status'], string> = {
  programada: 'Programada',
  en_curso:   'En curso',
  realizada:  'Realizada',
  cancelada:  'Cancelada',
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  inspectorId?: string
  isAdmin?: boolean
  inspectores?: { id: string; nombre: string }[]
}

// ─── Supabase client fuera del componente ─────────────────────────────────────
const _supabase = createClient()

// ─── Componente principal ─────────────────────────────────────────────────────
export function Calendario({ inspectorId, isAdmin = false, inspectores = [] }: Props) {
  const supabase = _supabase
  const today    = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [filtroInspector, setFiltroInspector] = useState<string>(inspectorId ?? '')
  const [inspecciones, setInspecciones] = useState<InspeccionAgenda[]>([])
  const [bloqueados,   setBloqueados]   = useState<DiaBloqueado[]>([])
  const [loading, setLoading] = useState(true)

  // ── Mapa inspector_id → índice de color (estable: ordenado por id) ──────────
  const colorMap = useMemo(() => {
    const sorted = [...inspectores].sort((a, b) => a.id.localeCompare(b.id))
    const map = new Map<string, number>()
    sorted.forEach((insp, i) => map.set(insp.id, i % PALETTE.length))
    return map
  }, [inspectores])

  function getInspColor(inspectorId: string | undefined) {
    if (!inspectorId) return PALETTE[0]
    const idx = colorMap.get(inspectorId) ?? 0
    return PALETTE[idx % PALETTE.length]
  }

  // ── Cargar datos del mes ───────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    const inicio    = new Date(year, month, 1)
    const fin       = new Date(year, month + 1, 1)
    const isoInicio = inicio.toISOString()
    const isoFin    = fin.toISOString()
    const dateInicio = inicio.toISOString().split('T')[0]
    const dateFin    = new Date(year, month + 1, 0).toISOString().split('T')[0]

    let q = supabase
      .from('inspecciones_agenda')
      .select(`
        id, fecha_hora, status,
        expediente:expedientes(id, numero_folio, ciudad, estado_mx, cliente:clientes(nombre)),
        inspector:usuarios!inspector_id(id, nombre)
      `)
      .gte('fecha_hora', isoInicio)
      .lt('fecha_hora', isoFin)
      .order('fecha_hora')

    if (filtroInspector) {
      // Incluir las visitas donde el usuario es ejecutor (delegación)
      q = q.or(`inspector_id.eq.${filtroInspector},inspector_ejecutor_id.eq.${filtroInspector}`)
    }

    let bq = supabase
      .from('dias_bloqueados')
      .select('fecha, motivo, inspector_id')
      .gte('fecha', dateInicio)
      .lte('fecha', dateFin)

    if (!isAdmin && filtroInspector) {
      bq = bq.or(`inspector_id.eq.${filtroInspector},inspector_id.is.null`)
    }

    const [{ data: insp }, { data: bloq }] = await Promise.all([q, bq])
    setInspecciones((insp as unknown as InspeccionAgenda[]) ?? [])
    setBloqueados((bloq as DiaBloqueado[]) ?? [])
    setLoading(false)
  }, [year, month, filtroInspector, isAdmin])

  useEffect(() => { cargar() }, [cargar])

  // ── Navegación ────────────────────────────────────────────────────────────
  const prevMes = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMes = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ── Grid del mes ──────────────────────────────────────────────────────────
  const primerDia  = new Date(year, month, 1).getDay()
  const diasDelMes = new Date(year, month + 1, 0).getDate()
  const celdas: (number | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ]
  while (celdas.length % 7 !== 0) celdas.push(null)

  // Índices por día
  const inspeccionesPorDia = new Map<number, InspeccionAgenda[]>()
  for (const ins of inspecciones) {
    const d = new Date(ins.fecha_hora).getDate()
    if (!inspeccionesPorDia.has(d)) inspeccionesPorDia.set(d, [])
    inspeccionesPorDia.get(d)!.push(ins)
  }

  const diasBloqueadosSet = new Set<number>()
  const motivosPorDia     = new Map<number, string>()
  for (const b of bloqueados) {
    const d = parseInt(b.fecha.split('-')[2], 10)
    diasBloqueadosSet.add(d)
    if (b.motivo) motivosPorDia.set(d, b.motivo)
  }

  const hoyNum = today.getFullYear() === year && today.getMonth() === month
    ? today.getDate() : -1

  const totalProgramadas = inspecciones.filter(i => i.status === 'programada').length
  const totalRealizadas  = inspecciones.filter(i => i.status === 'realizada').length
  const totalCanceladas  = inspecciones.filter(i => i.status === 'cancelada').length

  // Inspectores visibles en el mes actual (para leyenda dinámica)
  const inspectoresEnMes = useMemo(() => {
    const ids = new Set(inspecciones.map(i => i.inspector?.id).filter(Boolean))
    return inspectores.filter(i => ids.has(i.id))
  }, [inspecciones, inspectores])

  return (
    <div className="space-y-4">

      {/* ── Barra superior: filtro + leyenda de status ── */}
      <div className="card py-3 px-4 flex flex-wrap items-center justify-between gap-3">
        {isAdmin && inspectores.length > 0 && (
          <select
            value={filtroInspector}
            onChange={e => setFiltroInspector(e.target.value)}
            className="input-field text-sm py-1.5 w-60"
          >
            <option value="">Todos los inspectores</option>
            {inspectores.map(i => {
              const color = getInspColor(i.id)
              return (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              )
            })}
          </select>
        )}

        {/* Leyenda de status (solo cuando no es admin o está filtrando a uno) */}
        {(!isAdmin || filtroInspector) && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 ml-auto">
            {(Object.entries(STATUS_DOT) as [InspeccionAgenda['status'], string][]).map(([s, cls]) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cls}`} />
                <span>{STATUS_LABEL[s]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-red-400" />
              <span>Bloqueado</span>
            </div>
          </div>
        )}

        {/* Leyenda de inspectores (solo en admin sin filtro) */}
        {isAdmin && !filtroInspector && inspectoresEnMes.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs ml-auto">
            {inspectoresEnMes.map(insp => {
              const color = getInspColor(insp.id)
              // Nombre corto: primera palabra del nombre completo
              const nombreCorto = insp.nombre.split(' ')[0]
              return (
                <button
                  key={insp.id}
                  onClick={() => setFiltroInspector(insp.id)}
                  className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                  title={`Filtrar: ${insp.nombre}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
                  <span className="text-gray-700 font-medium">{nombreCorto}</span>
                </button>
              )
            })}
            <div className="flex items-center gap-1.5 ml-1">
              <Lock className="w-3 h-3 text-red-400" />
              <span className="text-gray-500">Bloqueado</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Leyenda expandida de inspectores (tarjeta separada en admin) ── */}
      {isAdmin && !filtroInspector && inspectoresEnMes.length > 1 && (
        <div className="card py-3 px-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Inspectores en este mes
          </p>
          <div className="flex flex-wrap gap-3">
            {inspectoresEnMes.map(insp => {
              const color = getInspColor(insp.id)
              const count = inspecciones.filter(i => i.inspector?.id === insp.id).length
              return (
                <button
                  key={insp.id}
                  onClick={() => setFiltroInspector(insp.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 ${color.pill}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                  <span>{insp.nombre}</span>
                  <span className="opacity-60 font-normal">· {count}</span>
                </button>
              )
            })}
          </div>
          {filtroInspector === '' && inspectoresEnMes.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">Haz clic en un inspector para filtrar la vista</p>
          )}
        </div>
      )}

      {/* Botón para quitar filtro */}
      {isAdmin && filtroInspector && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltroInspector('')}
            className="text-xs text-brand-green hover:underline font-medium flex items-center gap-1"
          >
            ← Ver todos los inspectores
          </button>
          <span className="text-xs text-gray-500">
            — {inspectores.find(i => i.id === filtroInspector)?.nombre ?? 'Inspector'}
          </span>
        </div>
      )}

      {/* ── Calendario principal ── */}
      <div className="card">
        {/* Header navegación */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMes} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Mes anterior">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">{MESES[month]} {year}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalProgramadas > 0 && `${totalProgramadas} programadas`}
              {totalRealizadas  > 0 && ` · ${totalRealizadas} realizadas`}
              {totalCanceladas  > 0 && ` · ${totalCanceladas} canceladas`}
              {totalProgramadas === 0 && totalRealizadas === 0 && totalCanceladas === 0 && !loading && 'Sin inspecciones'}
            </p>
          </div>
          <button onClick={nextMes} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Mes siguiente">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Cabeceras días */}
        <div className="grid grid-cols-7 mb-1">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando agenda…</span>
            </div>
          </div>
        ) : inspecciones.length === 0 && bloqueados.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Calendar className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Sin inspecciones en este mes</p>
            <button
              onClick={prevMes}
              className="text-xs text-brand-green hover:underline font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Ver mes anterior
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-b-xl overflow-hidden">
            {celdas.map((dia, i) => {
              if (dia === null) {
                return <div key={`vacio-${i}`} className="border-b border-r border-gray-100 bg-gray-50/40 min-h-[100px]" />
              }

              const diaInsp    = inspeccionesPorDia.get(dia) ?? []
              const bloqueado  = diasBloqueadosSet.has(dia)
              const motivoBloq = motivosPorDia.get(dia)
              const esHoy      = dia === hoyNum
              const conflicto  = diaInsp.filter(d => d.status === 'programada').length > 1

              return (
                <div
                  key={`dia-${dia}`}
                  className={[
                    'border-b border-r border-gray-100 min-h-[100px] p-1.5 transition-colors',
                    esHoy     ? 'bg-[#0F6E56]/5' : '',
                    bloqueado ? 'bg-red-50/50'    : '',
                  ].join(' ')}
                >
                  {/* Número del día */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={[
                      'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                      esHoy     ? 'bg-brand-green text-white' : 'text-gray-600',
                      bloqueado && !esHoy ? 'text-red-500' : '',
                    ].join(' ')}>
                      {dia}
                    </span>
                    {conflicto && (
                      <span title="Conflicto de horario">
                        <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                      </span>
                    )}
                  </div>

                  {/* Pills */}
                  <div className="space-y-0.5">
                    {diaInsp.slice(0, 3).map(ins => {
                      const folio    = ins.expediente?.numero_folio ?? '—'
                      const cliente  = ins.expediente?.cliente?.nombre ?? '—'
                      const ciudad   = ins.expediente?.ciudad ?? null
                      const estado   = ins.expediente?.estado_mx ?? null
                      const tz       = tzForEstadoMx(estado)
                      const expId    = ins.expediente?.id
                      const fechaFmt = new Date(ins.fecha_hora).toLocaleString('es-MX', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: tz,
                      })

                      // En admin: color por inspector; individual: color por status
                      const pillClass = isAdmin
                        ? getInspColor(ins.inspector?.id).pill
                        : STATUS_PILL[ins.status]

                      // Indicador de status (puntito) en admin
                      const statusDot = STATUS_DOT[ins.status]

                      return (
                        <div key={ins.id} className="relative group/pill">
                          <Link
                            href={expId ? `/dashboard/inspector/expedientes/${expId}` : '#'}
                            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-75 ${pillClass}`}
                          >
                            {/* Puntito de status (solo en admin) */}
                            {isAdmin && (
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
                            )}
                            <span className="truncate">{folio}</span>
                          </Link>
                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/pill:block w-52 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
                            <p className="font-mono font-bold text-[11px] mb-1.5 text-white">{folio}</p>
                            <p className="text-gray-300 leading-snug">{fechaFmt}</p>
                            <p className="text-gray-200 mt-1 leading-snug truncate font-medium">{cliente}</p>
                            {(ciudad || estado) && (
                              <p className="text-gray-400 mt-0.5 leading-snug">
                                {[ciudad, estado].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {isAdmin && ins.inspector && (
                              <p className="text-gray-400 mt-0.5 truncate">
                                Inspector: {ins.inspector.nombre}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {diaInsp.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{diaInsp.length - 3} más</p>
                    )}
                  </div>

                  {/* Día bloqueado */}
                  {bloqueado && (
                    <div className="mt-1 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
                      <span className="text-xs text-red-400 truncate">
                        {motivoBloq ?? 'Bloqueado'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Próximas inspecciones ── */}
      {!loading && (
        <ProximasInspecciones
          inspecciones={inspecciones}
          isAdmin={isAdmin}
          getInspColor={getInspColor}
        />
      )}
    </div>
  )
}

// ─── Sub-componente: Próximas inspecciones ────────────────────────────────────
function ProximasInspecciones({
  inspecciones,
  isAdmin,
  getInspColor,
}: {
  inspecciones: InspeccionAgenda[]
  isAdmin: boolean
  getInspColor: (id: string | undefined) => typeof PALETTE[number]
}) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const proximas = inspecciones
    .filter(i => i.status === 'programada' && new Date(i.fecha_hora) >= hoy)
    .slice(0, 8)

  if (proximas.length === 0) return null

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 text-sm mb-3">
        Próximas inspecciones del mes
      </h3>
      <div className="divide-y divide-gray-50">
        {proximas.map(ins => {
          const fecha   = new Date(ins.fecha_hora)
          const folio   = ins.expediente?.numero_folio ?? '—'
          const nombre  = ins.expediente?.cliente?.nombre ?? '—'
          const expId   = ins.expediente?.id
          const color   = getInspColor(ins.inspector?.id)
          // TZ del estado del expediente — Sonora UTC-7, BC UTC-8, etc.
          const tz      = tzForEstadoMx(ins.expediente?.estado_mx)

          return (
            <div key={ins.id} className="flex items-center gap-4 py-2.5">
              {/* Franja de color del inspector */}
              {isAdmin && (
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${color.dot}`} />
              )}

              {/* Fecha */}
              <div className="w-14 text-center flex-shrink-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide leading-none">
                  {fecha.toLocaleDateString('es-MX', { month: 'short', timeZone: tz })}
                </p>
                <p className="text-2xl font-bold text-brand-green leading-none mt-0.5">
                  {fecha.toLocaleDateString('es-MX', { day: 'numeric', timeZone: tz })}
                </p>
                <p className="text-xs text-gray-400 leading-none mt-0.5">
                  {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: tz })}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 font-mono">{folio}</p>
                <p className="text-xs text-gray-500 truncate">{nombre}</p>
                {ins.expediente?.ciudad && (
                  <p className="text-xs text-gray-400 truncate">
                    {[ins.expediente.ciudad, ins.expediente.estado_mx].filter(Boolean).join(', ')}
                  </p>
                )}
                {isAdmin && ins.inspector && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                    <p className="text-xs font-medium text-gray-600 truncate">
                      {ins.inspector.nombre}
                    </p>
                  </div>
                )}
              </div>

              {/* Link */}
              {expId && (
                <Link
                  href={`/dashboard/inspector/expedientes/${expId}`}
                  className="text-xs text-brand-green hover:underline font-medium flex-shrink-0"
                >
                  Ver →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
