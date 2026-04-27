'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  FolderOpen, ChevronUp, ChevronDown, GripVertical,
  CheckCircle2, Loader2, UserCog, Search, X, BellRing,
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExpedienteRow {
  id: string
  numero_folio: string
  kwp: number | null
  status: string
  ciudad: string | null
  fecha_inicio: string | null
  created_at: string
  orden_inspector: number | null
  checklist_pct?: number | null
  nombre_cliente_final?: string | null
  cli_completado_at?: string | null
  cliente: { nombre: string } | null
  inspector: { nombre: string } | null
  inspector_id: string | null
}

export interface InspectorOption {
  id: string
  nombre: string
  expedientes_count?: number
}

interface Props {
  expedientes: ExpedienteRow[]
  rol: string
  userId: string
  // for admin/responsable view
  inspectores?: InspectorOption[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  borrador:   'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
  en_proceso: 'badge-en_revision',
  revision:   'badge-pendiente',
  aprobado:   'badge-aprobada',
  rechazado:  'badge-rechazada',
  devuelto:   'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
  cerrado:    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
}
const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', en_proceso: 'En Proceso', revision: 'En Revisión',
  aprobado: 'Aprobado', rechazado: 'Rechazado',   devuelto: 'Devuelto', cerrado: 'Cerrado',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SPColor = 'orange' | 'blue' | 'green' | 'red' | 'gray'
interface SiguientePaso { texto: string; color: SPColor }

function siguientePaso(status: string, pct?: number | null): SiguientePaso {
  switch (status) {
    case 'borrador':
      return { texto: 'Completar info y documentos', color: 'orange' }
    case 'en_proceso':
      if ((pct ?? 0) >= 100) return { texto: '✓ Listo para enviar a revisión', color: 'green' }
      return { texto: `Completar checklist · ${pct ?? 0}%`, color: 'orange' }
    case 'devuelto':
      return { texto: 'Devuelto con observaciones · requiere corrección', color: 'red' }
    case 'rechazado':
      return { texto: 'Correcciones pendientes · ver notas', color: 'red' }
    case 'revision':
      return { texto: 'En espera de revisión', color: 'blue' }
    case 'aprobado':
      return { texto: 'Pendiente: emitir certificado', color: 'green' }
    case 'cerrado':
      return { texto: 'Certificado emitido ✓', color: 'gray' }
    default:
      return { texto: '—', color: 'gray' }
  }
}

const SP_CHIP: Record<SPColor, string> = {
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  gray:   'bg-gray-50 text-gray-400 border-gray-200',
}

function matches(row: ExpedienteRow, q: string): boolean {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    (row.numero_folio ?? '').toLowerCase().includes(s) ||
    (row.nombre_cliente_final ?? '').toLowerCase().includes(s) ||
    ((row.cliente as any)?.nombre ?? '').toLowerCase().includes(s) ||
    (row.ciudad ?? '').toLowerCase().includes(s) ||
    ((row.inspector as any)?.nombre ?? '').toLowerCase().includes(s)
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar por folio, cliente final, nombre, ciudad…"
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// Grupo de estatus para el inspector: abiertos → en revisión → cerrados
const STATUS_GROUP: Record<string, number> = {
  borrador:   1,
  en_proceso: 1,
  devuelto:   1,
  rechazado:  1,
  revision:   2,
  aprobado:   3,
  cerrado:    3,
}

function sortedByOrden(rows: ExpedienteRow[]) {
  return [...rows].sort((a, b) => {
    // 1° — grupo por estatus
    const ga = STATUS_GROUP[a.status] ?? 9
    const gb = STATUS_GROUP[b.status] ?? 9
    if (ga !== gb) return ga - gb
    // 2° — orden manual del inspector (dentro del mismo grupo)
    const ao = a.orden_inspector ?? 9999
    const bo = b.orden_inspector ?? 9999
    if (ao !== bo) return ao - bo
    // 3° — más reciente primero
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

// ─── Drag-and-drop list (inspector view) ──────────────────────────────────────
function DraggableList({
  rows,
  onReorder,
}: {
  rows: ExpedienteRow[]
  onReorder: (ids: string[]) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ExpedienteRow[]>(() => sortedByOrden(rows))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  // ── Drag handlers ──
  function onDragStart(i: number) { dragIdx.current = i }
  function onDragEnter(i: number) { dragOverIdx.current = i }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }

  function onDrop() {
    const from = dragIdx.current
    const to   = dragOverIdx.current
    if (from === null || to === null || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
    setDirty(true)
    dragIdx.current = null
    dragOverIdx.current = null
  }

  // ── Arrow buttons (mobile / accessibility) ──
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    setDirty(true)
  }

  // ── Persist ──
  async function saveOrder() {
    setSaving(true)
    const ordenes = items.map((item, idx) => ({ id: item.id, orden: idx + 1 }))
    try {
      const res = await fetch('/api/expedientes/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenes }),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        onReorder(items.map(i => i.id))
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const visibleItems = busqueda ? items.filter(r => matches(r, busqueda)) : items

  return (
    <div className="space-y-3">
      {/* Search */}
      <SearchInput value={busqueda} onChange={setBusqueda} />

      {/* Save bar */}
      {(dirty || saved) && (
        <div className="flex items-center justify-between bg-brand-green/5 border border-brand-green/20 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-sm text-brand-green font-medium">
            {saved ? '✓ Orden guardado' : 'Tienes cambios sin guardar'}
          </p>
          {!saved && (
            <button
              onClick={saveOrder}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2 py-1.5"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
                : <><CheckCircle2 className="w-3.5 h-3.5" /> Guardar orden</>
              }
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 pb-1 flex items-center gap-1.5">
        <GripVertical className="w-3.5 h-3.5" />
        Arrastra las filas o usa las flechas para cambiar el orden de trabajo
      </p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="w-8 py-3 px-2"></th>
              <th className="w-14 py-3 px-2 text-center font-medium text-gray-400 text-xs">#</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Folio</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell">Cliente Final</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell">Nombre</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">kWp</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 hidden lg:table-cell">Ciudad</th>
              <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 hidden lg:table-cell">Siguiente paso</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">Inicio</th>
              <th className="py-3 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-sm text-gray-400">
                  Sin resultados para &ldquo;{busqueda}&rdquo;
                </td>
              </tr>
            )}
            {visibleItems.map((exp, i) => {
              const cliente = exp.cliente as any
              const sp = siguientePaso(exp.status, exp.checklist_pct)
              const grupo = STATUS_GROUP[exp.status] ?? 9
              const grupoAnterior = i > 0 ? (STATUS_GROUP[visibleItems[i - 1].status] ?? 9) : grupo
              const esNuevoGrupo = !busqueda && (i === 0 || grupo !== grupoAnterior)
              const GRUPO_LABEL: Record<number, string> = {
                1: 'Abiertos',
                2: 'En revisión CIAE',
                3: 'Emitidos / Cerrados',
              }
              return (
                <>
                  {esNuevoGrupo && (
                    <tr key={`sep-${i}`} className="border-b border-gray-100">
                      <td colSpan={11} className="py-1.5 px-4 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {GRUPO_LABEL[grupo] ?? ''}
                      </td>
                    </tr>
                  )}
                <tr
                  key={exp.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragEnter={() => onDragEnter(i)}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  className={`border-b transition-colors cursor-grab active:cursor-grabbing group ${
                    exp.status === 'devuelto'
                      ? 'border-orange-200 bg-orange-50/60 hover:bg-orange-50 border-l-4 border-l-orange-400'
                      : 'border-gray-50 hover:bg-gray-50'
                  }`}
                >
                  {/* Grip */}
                  <td className="py-3 px-2 text-center">
                    <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 mx-auto" />
                  </td>

                  {/* Priority number */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1}
                        className="p-0.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/inspector/expedientes/${exp.id}`}
                        className="font-mono text-brand-green font-semibold text-xs hover:underline"
                      >
                        {exp.numero_folio}
                      </Link>
                      {exp.cli_completado_at && ['borrador', 'en_proceso'].includes(exp.status) && (
                        <span
                          title={`Cliente notificó el ${new Date(exp.cli_completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — ya subió su información`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5"
                        >
                          <BellRing className="w-2.5 h-2.5" />
                          Listo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-800 hidden sm:table-cell">{exp.nombre_cliente_final ?? '—'}</td>
                  <td className="py-3 px-3 text-gray-600 hidden sm:table-cell">{cliente?.nombre ?? '—'}</td>
                  <td className="py-3 px-3 text-right text-gray-700 hidden md:table-cell">{exp.kwp ?? '—'}</td>
                  <td className="py-3 px-3 text-gray-600 hidden lg:table-cell">{exp.ciudad ?? '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={STATUS_BADGE[exp.status] ?? STATUS_BADGE.borrador}>
                      {STATUS_LABEL[exp.status] ?? exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${SP_CHIP[sp.color]}`}>
                      {sp.texto}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                    {exp.fecha_inicio ? formatDateShort(exp.fecha_inicio) : '—'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Link
                      href={`/dashboard/inspector/expedientes/${exp.id}`}
                      className="text-xs text-brand-green hover:underline font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


// ─── Status urgency order ─────────────────────────────────────────────────────
const STATUS_URGENCY: Record<string, number> = {
  revision:   1,   // needs admin action → top priority
  en_proceso: 2,   // inspector working on it
  borrador:   3,   // just started / no folio
  aprobado:   4,
  rechazado:  5,
  cerrado:    6,
}

const ACTIVE_STATUSES = new Set(['borrador', 'en_proceso', 'revision'])

function sortByUrgency(rows: ExpedienteRow[]) {
  return [...rows].sort((a, b) => {
    const ua = STATUS_URGENCY[a.status] ?? 9
    const ub = STATUS_URGENCY[b.status] ?? 9
    if (ua !== ub) return ua - ub
    // same urgency → oldest first (been waiting longer)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// ─── Admin view — unified priority list ───────────────────────────────────────
function AdminView({
  expedientes,
  inspectores,
}: {
  expedientes: ExpedienteRow[]
  inspectores: InspectorOption[]
}) {
  // "todos" = null; otherwise filter by inspector id
  const [filtroInsp, setFiltroInsp] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const filtered = (filtroInsp
    ? expedientes.filter(e => e.inspector_id === filtroInsp)
    : expedientes
  ).filter(e => matches(e, busqueda))

  const sorted = sortByUrgency(filtered)

  const activos    = sorted.filter(e => ACTIVE_STATUSES.has(e.status))
  const finalizados = sorted.filter(e => !ACTIVE_STATUSES.has(e.status))

  const totalActivos = (filtroInsp ? expedientes.filter(e => e.inspector_id === filtroInsp) : expedientes)
    .filter(e => ACTIVE_STATUSES.has(e.status)).length

  return (
    <div className="space-y-5">

      {/* ── Inspector filter chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltroInsp(null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
            filtroInsp === null
              ? 'bg-brand-green text-white border-brand-green shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            filtroInsp === null ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {expedientes.length}
          </span>
        </button>

        {inspectores.map(insp => {
          const active = filtroInsp === insp.id
          const countActivos = expedientes.filter(e => e.inspector_id === insp.id && ACTIVE_STATUSES.has(e.status)).length
          return (
            <button
              key={insp.id}
              type="button"
              onClick={() => setFiltroInsp(prev => prev === insp.id ? null : insp.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-green text-white border-brand-green shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <UserCog className="w-3.5 h-3.5 opacity-70" />
              <span>{insp.nombre}</span>
              {countActivos > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {countActivos}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search ── */}
      <SearchInput value={busqueda} onChange={setBusqueda} />

      {/* ── Summary line ── */}
      {totalActivos > 0 && !busqueda && (
        <p className="text-sm text-orange-600 font-medium flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          {totalActivos} expediente{totalActivos !== 1 ? 's' : ''} requiere{totalActivos === 1 ? '' : 'n'} atención
        </p>
      )}

      {/* ── Unified table ── */}
      {sorted.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Sin expedientes</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left py-3 px-3 font-medium text-gray-500">Folio</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell">Cliente Final</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell">Nombre</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden md:table-cell">Inspector</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">kWp</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden lg:table-cell">Ciudad</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden xl:table-cell">Siguiente paso</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">Inicio</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-gray-400">
                    {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin expedientes'}
                  </td>
                </tr>
              )}
              {/* Active expedientes */}
              {activos.map((exp) => {
                const cliente  = exp.cliente  as any
                const inspector = exp.inspector as any
                const sp = siguientePaso(exp.status, exp.checklist_pct)
                return (
                  <tr key={exp.id} className={`border-b transition-colors ${
                    exp.status === 'devuelto'
                      ? 'border-orange-200 bg-orange-50/60 hover:bg-orange-50 border-l-4 border-l-orange-400'
                      : 'border-gray-100 hover:bg-orange-50/40'
                  }`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/inspector/expedientes/${exp.id}`}
                          className="font-mono text-brand-green font-semibold text-xs hover:underline"
                        >
                          {exp.numero_folio}
                        </Link>
                        {exp.cli_completado_at && ['borrador', 'en_proceso'].includes(exp.status) && (
                          <span
                            title={`Cliente notificó el ${new Date(exp.cli_completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — ya subió su información`}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5"
                          >
                            <BellRing className="w-2.5 h-2.5" />
                            Listo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-800 hidden sm:table-cell">{exp.nombre_cliente_final ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600 hidden sm:table-cell">{cliente?.nombre ?? '—'}</td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {inspector?.nombre ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 hidden md:table-cell">{exp.kwp ?? '—'}</td>
                    <td className="py-3 px-3 text-gray-600 hidden lg:table-cell">{exp.ciudad ?? '—'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={STATUS_BADGE[exp.status] ?? STATUS_BADGE.borrador}>
                        {STATUS_LABEL[exp.status] ?? exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden xl:table-cell">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${SP_CHIP[sp.color]}`}>
                        {sp.texto}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                      {exp.fecha_inicio ? formatDateShort(exp.fecha_inicio) : '—'}
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      {exp.status === 'revision' ? (
                        <Link
                          href={`/dashboard/inspector/expedientes/${exp.id}#revision`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-100 transition-colors"
                        >
                          Revisar →
                        </Link>
                      ) : exp.status === 'aprobado' ? (
                        <Link
                          href={`/dashboard/inspector/expedientes/${exp.id}#revision`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-100 transition-colors"
                        >
                          Certificar →
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/inspector/expedientes/${exp.id}`}
                          className="text-xs text-brand-green hover:underline font-medium"
                        >
                          Ver →
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}

              {/* Divider between active and completed */}
              {activos.length > 0 && finalizados.length > 0 && (
                <tr className="bg-gray-50">
                  <td colSpan={8} className="py-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Finalizados · {finalizados.length}
                  </td>
                </tr>
              )}

              {/* Completed expedientes */}
              {finalizados.map((exp) => {
                const cliente   = exp.cliente  as any
                const inspector = exp.inspector as any
                const sp = siguientePaso(exp.status, exp.checklist_pct)
                return (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors opacity-60 hover:opacity-100">
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/dashboard/inspector/expedientes/${exp.id}`}
                        className="font-mono text-gray-500 font-semibold text-xs hover:underline"
                      >
                        {exp.numero_folio}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 hidden sm:table-cell">{exp.nombre_cliente_final ?? '—'}</td>
                    <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell">{cliente?.nombre ?? '—'}</td>
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {inspector?.nombre ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 hidden md:table-cell">{exp.kwp ?? '—'}</td>
                    <td className="py-2.5 px-3 text-gray-400 hidden lg:table-cell">{exp.ciudad ?? '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={STATUS_BADGE[exp.status] ?? STATUS_BADGE.borrador}>
                        {STATUS_LABEL[exp.status] ?? exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 hidden xl:table-cell">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${SP_CHIP[sp.color]}`}>
                        {sp.texto}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-400 hidden md:table-cell">
                      {exp.fecha_inicio ? formatDateShort(exp.fecha_inicio) : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <Link
                        href={`/dashboard/inspector/expedientes/${exp.id}`}
                        className="text-xs text-gray-400 hover:underline hover:text-brand-green font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function ExpedientesOrdenables({ expedientes, rol, userId, inspectores }: Props) {
  const esAdmin = ['inspector_responsable', 'admin'].includes(rol)

  const [orderedIds, setOrderedIds] = useState<string[] | null>(null)

  // For admin: pass all expedientes grouped
  if (esAdmin && inspectores && inspectores.length > 0) {
    return <AdminView expedientes={expedientes} inspectores={inspectores} />
  }

  // For inspector/auxiliar: draggable list
  const myRows = expedientes.filter(e => e.inspector_id === userId)

  if (myRows.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-gray-600">Sin expedientes</p>
        <p className="text-sm mt-1">Los expedientes se crean una vez que tengas un folio asignado.</p>
      </div>
    )
  }

  return (
    <DraggableList
      rows={myRows}
      onReorder={ids => setOrderedIds(ids)}
    />
  )
}
