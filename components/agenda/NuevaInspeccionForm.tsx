'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Expediente {
  id: string
  numero_folio: string
  kwp: number
  cliente?: { nombre: string } | null
}

interface Testigo {
  id: string
  nombre: string
  apellidos?: string | null
  empresa?: string | null
}

interface InspeccionExistente {
  fecha_hora: string
  numero_folio?: string | null
  cliente?: string | null
  ciudad?: string | null
  estado?: string | null
}

interface Props {
  expedientes: Expediente[]
  testigos: Testigo[]
  defaultExpedienteId?: string
  showInspector?: boolean
  inspeccionesExistentes?: InspeccionExistente[]
}

// ─── Helpers de calendario ─────────────────────────────────────────────────────

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function ymd(d: Date) {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

// ─── Componente de calendario ─────────────────────────────────────────────────

function Calendario({
  selectedDate,
  onSelect,
  inspeccionesPorDia,
}: {
  selectedDate: string
  onSelect: (d: string) => void
  inspeccionesPorDia: Map<string, InspeccionExistente[]>
}) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [tooltip, setTooltip] = useState<{ str: string; x: number; y: number } | null>(null)

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay  = new Date(viewYear, viewMonth + 1, 0)
  const startOffset = firstDay.getDay()
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1
    cells.push(dayNum < 1 || dayNum > lastDay.getDate() ? null : new Date(viewYear, viewMonth, dayNum))
  }

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const todayStr = ymd(today)

  // Color de fondo según cantidad de inspecciones en el día
  function bgInsp(count: number, isSelected: boolean) {
    if (isSelected) return ''
    if (count === 0) return ''
    if (count === 1) return 'bg-amber-50 ring-1 ring-amber-200'
    if (count === 2) return 'bg-amber-100 ring-1 ring-amber-300'
    return 'bg-amber-200 ring-1 ring-amber-400'
  }

  // Texto del tooltip
  function buildTooltip(insps: InspeccionExistente[]) {
    return insps.map(ins => {
      const hora = new Date(ins.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      const lugar = [ins.ciudad, ins.estado].filter(Boolean).join(', ')
      const folio = ins.numero_folio ?? ''
      const partes = [hora, folio, lugar].filter(Boolean)
      return partes.join(' · ')
    }).join('\n')
  }

  return (
    <div className="select-none relative">
      {/* Header mes/año */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prev} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <span className="text-base font-semibold text-gray-800">
          {MESES_ES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={next} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-50 ring-1 ring-amber-200 inline-block" /> 1 inspección
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 ring-1 ring-amber-300 inline-block" /> 2 inspecciones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200 ring-1 ring-amber-400 inline-block" /> 3+
        </span>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_ES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const str        = ymd(date)
          const isToday    = str === todayStr
          const isSelected = str === selectedDate
          const isPast     = date < today && !isToday
          const insps      = inspeccionesPorDia.get(str) ?? []
          const count      = insps.length

          return (
            <div key={str} className="relative group">
              <button
                type="button"
                onClick={() => onSelect(str)}
                className={[
                  'relative h-11 w-full rounded-xl text-sm font-medium transition-all',
                  'cursor-pointer',
                  isSelected
                    ? 'bg-brand-green text-white shadow-md'
                    : isToday
                    ? 'ring-2 ring-brand-green text-brand-green font-bold'
                    : isPast
                    ? `text-gray-400 ${bgInsp(count, false)}`
                    : `text-gray-700 hover:bg-gray-100 ${bgInsp(count, false)}`,
                  isSelected ? '' : bgInsp(count, false),
                ].filter(Boolean).join(' ')}
              >
                {date.getDate()}
                {/* Indicador de cantidad */}
                {count > 0 && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-600 leading-none">
                    {count}
                  </span>
                )}
                {count > 0 && isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-200 leading-none">
                    {count}
                  </span>
                )}
              </button>

              {/* Tooltip al hacer hover sobre días con inspecciones */}
              {count > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap max-w-[220px]">
                    <p className="font-semibold mb-1 text-amber-300">
                      {count === 1 ? '1 inspección' : `${count} inspecciones`}
                    </p>
                    {insps.map((ins, idx) => {
                      const hora  = new Date(ins.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                      const lugar = [ins.ciudad, ins.estado].filter(Boolean).join(', ')
                      return (
                        <div key={idx} className={idx > 0 ? 'mt-1.5 pt-1.5 border-t border-gray-700' : ''}>
                          <p className="font-medium">{hora}{ins.numero_folio ? ` · ${ins.numero_folio}` : ''}</p>
                          {ins.cliente && <p className="text-gray-300 truncate">{ins.cliente}</p>}
                          {lugar && <p className="text-gray-400">{lugar}</p>}
                        </div>
                      )
                    })}
                  </div>
                  {/* Flecha */}
                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Formulario principal ──────────────────────────────────────────────────────

export default function NuevaInspeccionForm({
  expedientes,
  testigos,
  defaultExpedienteId,
  showInspector = false,
  inspeccionesExistentes = [],
}: Props) {
  const router = useRouter()

  const [expedienteId, setExpedienteId] = useState(defaultExpedienteId ?? '')
  const [selectedDate, setSelectedDate] = useState('')   // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [duracionMin,  setDuracionMin]  = useState(120)
  const [testigoId,    setTestigoId]    = useState('')
  const [notas,        setNotas]        = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Mapa de días YYYY-MM-DD → lista de inspecciones
  const inspeccionesPorDia = useMemo<Map<string, InspeccionExistente[]>>(() => {
    const m = new Map<string, InspeccionExistente[]>()
    for (const ins of inspeccionesExistentes) {
      const key = new Date(ins.fecha_hora).toLocaleDateString('en-CA')
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(ins)
    }
    return m
  }, [inspeccionesExistentes])

  // Inspecciones del día seleccionado
  const conflictosDia = useMemo(() => {
    if (!selectedDate) return []
    return inspeccionesPorDia.get(selectedDate) ?? []
  }, [selectedDate, inspeccionesPorDia])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedTime) {
      setError('Selecciona una fecha y hora.')
      return
    }
    setLoading(true)
    setError(null)

    const fechaHora = `${selectedDate}T${selectedTime}:00`

    try {
      const res = await fetch('/api/inspecciones/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId || null,
          fecha_hora:    fechaHora,
          duracion_min:  duracionMin,
          direccion:     null,
          testigo_id:    testigoId || null,
          notas:         notas.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al programar la inspección.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard/inspector/agenda'), 1500)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Expediente */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
          Expediente
        </h2>
        <div>
          <label className="label">Expediente *</label>
          <select
            className="input-field"
            value={expedienteId}
            onChange={e => setExpedienteId(e.target.value)}
            required
          >
            <option value="">Seleccionar expediente…</option>
            {expedientes.map(exp => {
              const inspector = (exp as any).inspector
              return (
                <option key={exp.id} value={exp.id}>
                  {exp.numero_folio} — {(exp.cliente as any)?.nombre ?? '—'} ({exp.kwp} kWp)
                  {showInspector && inspector ? ` · ${inspector.nombre}` : ''}
                </option>
              )
            })}
          </select>
          {expedientes.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              No tienes expedientes activos. Solicita un folio para crear uno.
            </p>
          )}
        </div>
      </div>

      {/* Calendario */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
          Fecha de inspección
        </h2>

        <Calendario
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          inspeccionesPorDia={inspeccionesPorDia}
        />

        {/* Alerta de conflicto */}
        {conflictosDia.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold">
                {conflictosDia.length === 1
                  ? 'Ya tienes 1 inspección programada para este día'
                  : `Ya tienes ${conflictosDia.length} inspecciones para este día`}
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                {conflictosDia.map((ins, i) => {
                  const lugar = [ins.ciudad, ins.estado].filter(Boolean).join(', ')
                  return (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
                      <span>
                        <span className="font-mono font-medium">
                          {new Date(ins.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ins.numero_folio && <span> — {ins.numero_folio}</span>}
                        {ins.cliente && <span className="text-amber-600"> · {ins.cliente}</span>}
                        {lugar && <span className="text-amber-500 block pl-0">{lugar}</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs text-amber-600 mt-1">
                Puedes continuar, pero verifica que los horarios no se empalmen.
              </p>
            </div>
          </div>
        )}

        {/* Fecha seleccionada + hora */}
        {selectedDate && (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700">
              📅{' '}
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Hora:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Duración:</label>
              <select
                value={duracionMin}
                onChange={e => setDuracionMin(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              >
                {[60, 90, 120, 150, 180, 240].map(m => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Testigo */}
      {testigos.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
            Testigo (opcional)
          </h2>
          <select
            className="input-field"
            value={testigoId}
            onChange={e => setTestigoId(e.target.value)}
          >
            <option value="">Sin testigo</option>
            {testigos.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre} {t.apellidos ?? ''}{t.empresa ? ` — ${t.empresa}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notas */}
      <div className="card">
        <label className="label">Notas adicionales (opcional)</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Observaciones, condiciones del sitio, acceso especial, etc."
          value={notas}
          onChange={e => setNotas(e.target.value)}
        />
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Inspección programada correctamente. Redirigiendo…
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/dashboard/inspector/agenda" className="btn-outline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading || success || !selectedDate}
          className="btn-primary flex items-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Programando…</>
            : 'Programar inspección'
          }
        </button>
      </div>
    </form>
  )
}
