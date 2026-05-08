'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  FolderOpen, ChevronUp, ChevronDown, ChevronsUpDown, GripVertical,
  CheckCircle2, Loader2, UserCog, Search, X, BellRing,
  LayoutGrid, Rows3, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import BotonZipCompacto from './BotonZipCompacto'

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
  respaldo_descargado_at?: string | null
  respaldo_archivado_at?: string | null
  respaldo_borrado_at?: string | null
  cliente: { nombre: string } | null
  inspector: { nombre: string } | null
  inspector_id: string | null
  inspector_ejecutor_id?: string | null
  inspector_ejecutor?: { nombre: string; apellidos?: string | null } | null
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

// ─── Sortable column helpers (Windows-Explorer style) ────────────────────────
type SortKey = 'folio' | 'cliente_final' | 'cliente' | 'inspector' | 'kwp' | 'ciudad' | 'fecha'
type SortDir = 'asc' | 'desc'
interface SortState { key: SortKey; dir: SortDir }

function sortValue(row: ExpedienteRow, key: SortKey): string | number {
  switch (key) {
    case 'folio':         return row.numero_folio ?? ''
    case 'cliente_final': return (row.nombre_cliente_final ?? '').toLowerCase()
    case 'cliente':       return (row.cliente?.nombre ?? '').toLowerCase()
    case 'inspector':     return (row.inspector?.nombre ?? '').toLowerCase()
    case 'kwp':           return row.kwp ?? -1
    case 'ciudad':        return (row.ciudad ?? '').toLowerCase()
    case 'fecha':         return row.fecha_inicio ? new Date(row.fecha_inicio).getTime() : 0
  }
}

function applySort<T extends ExpedienteRow>(rows: T[], sort: SortState | null): T[] {
  if (!sort) return rows
  const arr = [...rows]
  arr.sort((a, b) => {
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ?  1 : -1
    return 0
  })
  return arr
}

/** Header clickeable. 1° clic asc, 2° desc, 3° quita el sort. */
function SortableTh({
  label, sortKey, current, onClick, className = 'text-left py-3 px-3 font-medium text-gray-500',
}: {
  label: string
  sortKey: SortKey
  current: SortState | null
  onClick: (k: SortKey) => void
  className?: string
}) {
  const active = current?.key === sortKey
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-gray-700 ${active ? 'text-brand-green' : ''}`}
        title={active ? `Ordenado ${current?.dir === 'asc' ? 'A→Z' : 'Z→A'} — clic para invertir` : `Ordenar por ${label}`}
      >
        {label}
        {!active && <ChevronsUpDown className="w-3 h-3 opacity-40" />}
        {active && current?.dir === 'asc'  && <ChevronUp   className="w-3 h-3" />}
        {active && current?.dir === 'desc' && <ChevronDown className="w-3 h-3" />}
      </button>
    </th>
  )
}

/** Hook: maneja el estado de sort con ciclo asc → desc → null. */
function useSortable() {
  const [sort, setSort] = useState<SortState | null>(null)
  const handle = (key: SortKey) => {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc')        return { key, dir: 'desc' }
      return null
    })
  }
  return { sort, handle, setSort }
}

/** Paginador simple — solo "« 1 2 3 »". */
function Paginator({ page, total, perPage, onPage }: {
  page: number; total: number; perPage: number; onPage: (p: number) => void
}) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const start = page * perPage + 1
  const end = Math.min((page + 1) * perPage, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40 text-xs">
      <span className="text-gray-500">
        Mostrando <span className="font-semibold text-gray-700">{start}–{end}</span> de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2 text-gray-700 font-medium tabular-nums">
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(Math.min(pages - 1, page + 1))}
          disabled={page === pages - 1}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const FINALIZADOS_PER_PAGE = 50

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
    // 1° — grupo por estatus (abiertos → revisión → finalizados)
    const ga = STATUS_GROUP[a.status] ?? 9
    const gb = STATUS_GROUP[b.status] ?? 9
    if (ga !== gb) return ga - gb
    // Finalizados (grupo 3): SIEMPRE por número de folio descendente
    // (los más nuevos arriba). Ignora el orden manual y created_at —
    // el folio es el identificador estable que el usuario reconoce.
    if (ga === 3) {
      return (b.numero_folio ?? '').localeCompare(a.numero_folio ?? '')
    }
    // Activos (grupos 1 y 2): orden manual del inspector
    const ao = a.orden_inspector ?? 9999
    const bo = b.orden_inspector ?? 9999
    if (ao !== bo) return ao - bo
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

// ─── Drag-and-drop list (inspector view) ──────────────────────────────────────
function DraggableList({
  rows,
  userId,
  onReorder,
}: {
  rows: ExpedienteRow[]
  userId: string
  onReorder: (ids: string[]) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ExpedienteRow[]>(() => sortedByOrden(rows))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)
  // Modo de vista: 'cards' o 'table' — se persiste en localStorage
  const [vista, setVista] = useState<'cards' | 'table'>('cards')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('expedientes-vista') as 'cards' | 'table' | null
    if (saved === 'cards' || saved === 'table') setVista(saved)
  }, [])
  function cambiarVista(v: 'cards' | 'table') {
    setVista(v)
    if (typeof window !== 'undefined') localStorage.setItem('expedientes-vista', v)
  }
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  // Sort de columnas (estilo Windows). Cuando hay sort activo, el orden
  // manual queda en pausa y se ordena por el criterio elegido.
  const { sort, handle: handleSort, setSort } = useSortable()
  // Paginación de finalizados (group=3) dentro de la lista
  const [pageFinal, setPageFinal] = useState(0)
  useEffect(() => { setPageFinal(0) }, [busqueda, sort])

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

  // Items con búsqueda → con sort opcional → con paginación de finalizados
  const baseItems = busqueda ? items.filter(r => matches(r, busqueda)) : items

  let visibleItems: ExpedienteRow[]
  let finalCount = 0
  let finalPaginated = false
  if (sort) {
    // Con sort: separar grupos para mantener "finalizados al fondo",
    // ordenar cada grupo por el criterio, paginar finalizados.
    const noFin = baseItems.filter(r => (STATUS_GROUP[r.status] ?? 9) !== 3)
    const fin   = baseItems.filter(r => (STATUS_GROUP[r.status] ?? 9) === 3)
    const noFinSorted = applySort(noFin, sort)
    const finSorted   = applySort(fin,   sort)
    finalCount = finSorted.length
    finalPaginated = finalCount > FINALIZADOS_PER_PAGE
    const finPage = finSorted.slice(
      pageFinal * FINALIZADOS_PER_PAGE,
      (pageFinal + 1) * FINALIZADOS_PER_PAGE,
    )
    visibleItems = [...noFinSorted, ...finPage]
  } else {
    // Sin sort: orden manual (drag/drop). Solo paginar finalizados.
    const fin = baseItems.filter(r => (STATUS_GROUP[r.status] ?? 9) === 3)
    finalCount = fin.length
    finalPaginated = finalCount > FINALIZADOS_PER_PAGE
    if (finalPaginated) {
      const noFin = baseItems.filter(r => (STATUS_GROUP[r.status] ?? 9) !== 3)
      const finPage = fin.slice(
        pageFinal * FINALIZADOS_PER_PAGE,
        (pageFinal + 1) * FINALIZADOS_PER_PAGE,
      )
      visibleItems = [...noFin, ...finPage]
    } else {
      visibleItems = baseItems
    }
  }
  const dragDisabled = !!sort

  return (
    <div className="space-y-3">
      {/* Search + sort + toggle de vista */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={busqueda} onChange={setBusqueda} />
        </div>
        <select
          value={sort ? `${sort.key}:${sort.dir}` : ''}
          onChange={e => {
            const v = e.target.value
            if (!v) { setSort(null); return }
            const [k, d] = v.split(':') as [SortKey, SortDir]
            setSort({ key: k, dir: d })
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          aria-label="Ordenar por"
        >
          <option value="">Orden manual</option>
          <option value="folio:asc">Folio (A→Z)</option>
          <option value="folio:desc">Folio (Z→A)</option>
          <option value="cliente_final:asc">Cliente final (A→Z)</option>
          <option value="cliente_final:desc">Cliente final (Z→A)</option>
          <option value="fecha:desc">Fecha (más reciente)</option>
          <option value="fecha:asc">Fecha (más antiguo)</option>
          <option value="kwp:desc">kWp (mayor)</option>
          <option value="kwp:asc">kWp (menor)</option>
          <option value="ciudad:asc">Ciudad (A→Z)</option>
        </select>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden flex-shrink-0" role="group" aria-label="Modo de vista">
          <button
            type="button"
            onClick={() => cambiarVista('cards')}
            title="Vista de tarjetas"
            className={`px-2.5 py-2 transition-colors ${
              vista === 'cards'
                ? 'bg-brand-green text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => cambiarVista('table')}
            title="Vista compacta de tabla"
            className={`px-2.5 py-2 transition-colors border-l border-gray-200 ${
              vista === 'table'
                ? 'bg-brand-green text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Rows3 className="w-4 h-4" />
          </button>
        </div>
      </div>

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

      {/* Estado vacío */}
      {visibleItems.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sin resultados para &ldquo;{busqueda}&rdquo;
        </div>
      )}

      {/* ── Vista de tabla (compacta) ── */}
      {vista === 'table' && visibleItems.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          {sort && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-50/60 border-b border-blue-100 text-xs">
              <span className="text-blue-700">
                Ordenado por <strong>{sort.key}</strong> ({sort.dir === 'asc' ? 'A→Z' : 'Z→A'}) — el orden manual está pausado
              </span>
              <button
                type="button"
                onClick={() => handleSort(sort.key)}
                className="text-blue-700 font-semibold hover:underline"
              >
                Volver al orden manual
              </button>
            </div>
          )}
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="w-8 py-3 px-2"></th>
                <th className="w-14 py-3 px-2 text-center font-medium text-gray-400 text-xs">#</th>
                <SortableTh label="Folio"         sortKey="folio"         current={sort} onClick={handleSort} />
                <SortableTh label="Cliente Final" sortKey="cliente_final" current={sort} onClick={handleSort} />
                <SortableTh label="kWp"           sortKey="kwp"           current={sort} onClick={handleSort} className="text-right py-3 px-3 font-medium text-gray-500" />
                <SortableTh label="Ciudad"        sortKey="ciudad"        current={sort} onClick={handleSort} className="text-left py-3 px-3 font-medium text-gray-500 hidden lg:table-cell" />
                <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500 hidden md:table-cell">Avance</th>
                <th className="py-3 px-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((exp, i) => {
                const cliente = exp.cliente as any
                const grupo = STATUS_GROUP[exp.status] ?? 9
                const grupoAnterior = i > 0 ? (STATUS_GROUP[visibleItems[i - 1].status] ?? 9) : grupo
                const esNuevoGrupo = !busqueda && (i === 0 || grupo !== grupoAnterior)
                const GRUPO_LABEL: Record<number, string> = { 1: 'Abiertos', 2: 'En revisión CIAE', 3: 'Emitidos / Cerrados' }
                const esDelegueYo = exp.inspector_ejecutor_id && exp.inspector_id === userId
                const meDelegaron = exp.inspector_ejecutor_id === userId && exp.inspector_id !== userId
                return (
                  <>
                    {esNuevoGrupo && (
                      <tr key={`sep-${i}`} className="border-b border-gray-100">
                        <td colSpan={9} className="py-1.5 px-4 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {GRUPO_LABEL[grupo] ?? ''}
                        </td>
                      </tr>
                    )}
                    <tr
                      key={exp.id}
                      draggable={!dragDisabled && grupo !== 3}
                      onDragStart={() => !dragDisabled && grupo !== 3 && onDragStart(i)}
                      onDragEnter={() => !dragDisabled && grupo !== 3 && onDragEnter(i)}
                      onDragOver={onDragOver}
                      onDrop={() => !dragDisabled && grupo !== 3 && onDrop()}
                      className={`border-b transition-colors group ${
                        dragDisabled || grupo === 3 ? '' : 'cursor-grab active:cursor-grabbing'
                      } ${
                        exp.status === 'devuelto'
                          ? 'border-orange-200 bg-orange-50/60 hover:bg-orange-50 border-l-4 border-l-orange-400'
                          : 'border-gray-50 hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-2.5 px-2 text-center">
                        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 mx-auto" />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                            className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-gray-400 w-5 text-center tabular-nums">{i + 1}</span>
                          <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                            className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/dashboard/inspector/expedientes/${exp.id}`}
                            className="font-mono text-brand-green font-semibold text-xs hover:underline">
                            {exp.numero_folio}
                          </Link>
                          {exp.cli_completado_at && ['borrador', 'en_proceso'].includes(exp.status) && (
                            <span title="Cliente listo" className="inline-flex items-center text-amber-700 bg-amber-100 border border-amber-200 rounded-full p-0.5">
                              <BellRing className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {esDelegueYo && (
                            <span title="Delegaste la visita" className="inline-flex items-center text-blue-700 bg-blue-100 border border-blue-200 rounded-full p-0.5">
                              <UserCog className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {meDelegaron && (
                            <span title="Te delegaron esta visita" className="inline-flex items-center text-purple-700 bg-purple-100 border border-purple-200 rounded-full p-0.5">
                              <UserCog className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-800 max-w-[260px] truncate">
                        <p className="font-medium truncate">{exp.nombre_cliente_final ?? cliente?.nombre ?? '—'}</p>
                        {cliente?.nombre && exp.nombre_cliente_final && cliente.nombre !== exp.nombre_cliente_final && (
                          <p className="text-[10px] text-gray-400 truncate">{cliente.nombre}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums">{exp.kwp ?? '—'}</td>
                      <td className="py-2.5 px-3 text-gray-600 hidden lg:table-cell">{exp.ciudad ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={STATUS_BADGE[exp.status] ?? STATUS_BADGE.borrador}>
                          {STATUS_LABEL[exp.status] ?? exp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        {exp.checklist_pct != null && grupo !== 3 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className={`h-full rounded-full ${
                                  (exp.checklist_pct ?? 0) >= 100 ? 'bg-emerald-500' :
                                  (exp.checklist_pct ?? 0) >= 70 ? 'bg-orange-400' : 'bg-gray-300'
                                }`}
                                style={{ width: `${Math.max(exp.checklist_pct ?? 0, 4)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold tabular-nums text-gray-500 w-7 text-right">
                              {exp.checklist_pct ?? 0}%
                            </span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <BotonZipCompacto
                            expedienteId={exp.id}
                            numeroFolio={exp.numero_folio}
                            status={exp.status}
                            respaldoDescargadoAt={exp.respaldo_descargado_at ?? null}
                            respaldoArchivadoAt={exp.respaldo_archivado_at ?? null}
                            respaldoBorradoAt={exp.respaldo_borrado_at ?? null}
                          />
                          <Link href={`/dashboard/inspector/expedientes/${exp.id}`}
                            className="text-xs text-brand-green hover:underline font-medium">
                            Ver →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
          {finalPaginated && (
            <Paginator page={pageFinal} total={finalCount} perPage={FINALIZADOS_PER_PAGE} onPage={setPageFinal} />
          )}
        </div>
      )}

      {/* ── Vista de tarjetas ── */}
      {vista === 'cards' && visibleItems.length > 0 && (
      <div className="space-y-3">
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
          const esDevuelto = exp.status === 'devuelto'
          const esDelegueYo = exp.inspector_ejecutor_id && exp.inspector_id === userId
          const meDelegaron = exp.inspector_ejecutor_id === userId && exp.inspector_id !== userId
          const ejecutorNombre = exp.inspector_ejecutor
            ? `${exp.inspector_ejecutor.nombre} ${exp.inspector_ejecutor.apellidos ?? ''}`.trim()
            : ''

          return (
            <div key={exp.id}>
              {/* Separador de grupo */}
              {esNuevoGrupo && (
                <div className="flex items-center gap-2 mt-5 mb-2 first:mt-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {GRUPO_LABEL[grupo] ?? ''}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              <div
                draggable={!dragDisabled && grupo !== 3}
                onDragStart={() => !dragDisabled && grupo !== 3 && onDragStart(i)}
                onDragEnter={() => !dragDisabled && grupo !== 3 && onDragEnter(i)}
                onDragOver={onDragOver}
                onDrop={() => !dragDisabled && grupo !== 3 && onDrop()}
                className={`group relative rounded-xl border bg-white transition-all hover:shadow-md ${
                  dragDisabled || grupo === 3 ? '' : 'cursor-grab active:cursor-grabbing'
                } ${
                  esDevuelto
                    ? 'border-orange-300 bg-orange-50/40 border-l-4 border-l-orange-500'
                    : 'border-gray-200 hover:border-brand-green/40'
                }`}
              >
                <div className="flex items-stretch gap-3">
                  {/* Columna izquierda: drag + número de prioridad */}
                  <div className="flex flex-col items-center justify-center gap-1 px-2 py-3 border-r border-gray-100 bg-gray-50/50 rounded-l-xl">
                    <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="p-0.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] font-bold text-gray-500 w-5 text-center tabular-nums">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      className="p-0.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0 p-3 sm:p-4">
                    {/* Fila 1: folio + status + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Link
                        href={`/dashboard/inspector/expedientes/${exp.id}`}
                        className="font-mono text-brand-green font-bold text-sm hover:underline"
                      >
                        {exp.numero_folio}
                      </Link>
                      <span className={STATUS_BADGE[exp.status] ?? STATUS_BADGE.borrador}>
                        {STATUS_LABEL[exp.status] ?? exp.status}
                      </span>
                      {exp.cli_completado_at && ['borrador', 'en_proceso'].includes(exp.status) && (
                        <span
                          title={`Cliente notificó el ${new Date(exp.cli_completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5"
                        >
                          <BellRing className="w-2.5 h-2.5" />
                          Cliente listo
                        </span>
                      )}
                      {esDelegueYo && (
                        <span
                          title={`Delegaste la visita a ${ejecutorNombre || 'otro inspector'}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-1.5 py-0.5"
                        >
                          <UserCog className="w-2.5 h-2.5" />
                          Delegué a {ejecutorNombre.split(' ')[0]}
                        </span>
                      )}
                      {meDelegaron && (
                        <span
                          title={`Te delegaron esta visita${exp.inspector ? ` desde ${exp.inspector.nombre}` : ''}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-1.5 py-0.5"
                        >
                          <UserCog className="w-2.5 h-2.5" />
                          Delegado{exp.inspector ? ` por ${exp.inspector.nombre}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Fila 2: cliente final + EPC */}
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {exp.nombre_cliente_final ?? cliente?.nombre ?? <span className="text-gray-400 font-normal italic">Sin cliente final</span>}
                      </p>
                      {cliente?.nombre && exp.nombre_cliente_final && cliente.nombre !== exp.nombre_cliente_final && (
                        <p className="text-xs text-gray-500 truncate">EPC: {cliente.nombre}</p>
                      )}
                    </div>

                    {/* Fila 3: meta info en chips */}
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-500">
                      {exp.kwp != null && (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-gray-700">{exp.kwp}</span> kWp
                        </span>
                      )}
                      {exp.ciudad && (
                        <span className="inline-flex items-center gap-1">
                          📍 {exp.ciudad}
                        </span>
                      )}
                      {exp.fecha_inicio && (
                        <span className="inline-flex items-center gap-1">
                          📅 {formatDateShort(exp.fecha_inicio)}
                        </span>
                      )}
                    </div>

                    {/* Fila 4: progress + siguiente paso (solo activos) */}
                    {grupo !== 3 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                        {/* Checklist progress */}
                        {exp.checklist_pct != null && (
                          <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-[260px]">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (exp.checklist_pct ?? 0) >= 100 ? 'bg-emerald-500' :
                                  (exp.checklist_pct ?? 0) >= 70 ? 'bg-orange-400' : 'bg-gray-300'
                                }`}
                                style={{ width: `${Math.max(exp.checklist_pct ?? 0, 4)}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold tabular-nums ${
                              (exp.checklist_pct ?? 0) >= 100 ? 'text-emerald-600' :
                              (exp.checklist_pct ?? 0) >= 70 ? 'text-orange-500' : 'text-gray-400'
                            }`}>
                              {exp.checklist_pct ?? 0}%
                            </span>
                          </div>
                        )}

                        {/* Siguiente paso */}
                        <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border font-medium ${SP_CHIP[sp.color]}`}>
                          {sp.texto}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col items-end justify-center gap-1.5 px-3 py-3 border-l border-gray-100">
                    <BotonZipCompacto
                      expedienteId={exp.id}
                      numeroFolio={exp.numero_folio}
                      status={exp.status}
                      respaldoDescargadoAt={exp.respaldo_descargado_at ?? null}
                      respaldoArchivadoAt={exp.respaldo_archivado_at ?? null}
                      respaldoBorradoAt={exp.respaldo_borrado_at ?? null}
                    />
                    <Link
                      href={`/dashboard/inspector/expedientes/${exp.id}`}
                      className="text-xs text-brand-green hover:underline font-semibold whitespace-nowrap"
                    >
                      Ver →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {finalPaginated && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <Paginator page={pageFinal} total={finalCount} perPage={FINALIZADOS_PER_PAGE} onPage={setPageFinal} />
          </div>
        )}
      </div>
      )}
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
  // Sort compartido entre activos y finalizados; al ser null, vuelve al
  // orden por urgencia (default).
  const { sort, handle: handleSort } = useSortable()
  const [pageFinal, setPageFinal] = useState(0)

  const filtered = (filtroInsp
    ? expedientes.filter(e => e.inspector_id === filtroInsp)
    : expedientes
  ).filter(e => matches(e, busqueda))

  const baseActivos    = filtered.filter(e => ACTIVE_STATUSES.has(e.status))
  const baseFinal      = filtered.filter(e => !ACTIVE_STATUSES.has(e.status))
  const activos        = sort ? applySort(baseActivos, sort) : sortByUrgency(baseActivos)
  // Finalizados: por defecto SIEMPRE por folio descendente (los más nuevos
  // arriba). Si el usuario elige un sort manual, ese gana.
  const finalizadosAll = sort
    ? applySort(baseFinal, sort)
    : applySort(baseFinal, { key: 'folio', dir: 'desc' })
  const finalizados    = finalizadosAll.slice(
    pageFinal * FINALIZADOS_PER_PAGE,
    (pageFinal + 1) * FINALIZADOS_PER_PAGE,
  )
  // Reset paginación cuando cambia filtro/búsqueda/sort
  useEffect(() => { setPageFinal(0) }, [filtroInsp, busqueda, sort])

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
      {(activos.length === 0 && finalizadosAll.length === 0) ? (
        <div className="card text-center py-16 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Sin expedientes</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <SortableTh label="Folio"         sortKey="folio"         current={sort} onClick={handleSort} />
                <SortableTh label="Cliente Final" sortKey="cliente_final" current={sort} onClick={handleSort} className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell" />
                <SortableTh label="Nombre"        sortKey="cliente"       current={sort} onClick={handleSort} className="text-left py-3 px-3 font-medium text-gray-500 hidden sm:table-cell" />
                <SortableTh label="Inspector"     sortKey="inspector"     current={sort} onClick={handleSort} className="text-left py-3 px-3 font-medium text-gray-500 hidden md:table-cell" />
                <SortableTh label="kWp"           sortKey="kwp"           current={sort} onClick={handleSort} className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell" />
                <SortableTh label="Ciudad"        sortKey="ciudad"        current={sort} onClick={handleSort} className="text-left py-3 px-3 font-medium text-gray-500 hidden lg:table-cell" />
                <th className="text-center py-3 px-3 font-medium text-gray-500">Estado</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 hidden xl:table-cell">Siguiente paso</th>
                <SortableTh label="Inicio"        sortKey="fecha"         current={sort} onClick={handleSort} className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell" />
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {activos.length === 0 && finalizadosAll.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-gray-400">
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
              {activos.length > 0 && finalizadosAll.length > 0 && (
                <tr className="bg-gray-50">
                  <td colSpan={10} className="py-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Finalizados · {finalizadosAll.length}
                    {finalizadosAll.length > FINALIZADOS_PER_PAGE && (
                      <span className="ml-2 font-normal normal-case text-gray-400">
                        (página {pageFinal + 1} de {Math.ceil(finalizadosAll.length / FINALIZADOS_PER_PAGE)})
                      </span>
                    )}
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
                      <div className="flex items-center justify-end gap-2">
                        <BotonZipCompacto
                          expedienteId={exp.id}
                          numeroFolio={exp.numero_folio}
                          status={exp.status}
                          respaldoDescargadoAt={exp.respaldo_descargado_at ?? null}
                          respaldoArchivadoAt={exp.respaldo_archivado_at ?? null}
                          respaldoBorradoAt={exp.respaldo_borrado_at ?? null}
                        />
                        <Link
                          href={`/dashboard/inspector/expedientes/${exp.id}`}
                          className="text-xs text-gray-400 hover:underline hover:text-brand-green font-medium"
                        >
                          Ver →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Paginator
            page={pageFinal}
            total={finalizadosAll.length}
            perPage={FINALIZADOS_PER_PAGE}
            onPage={setPageFinal}
          />
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

  // Inspector ve sus propios + los delegados a él
  const myRows = expedientes.filter(e =>
    e.inspector_id === userId || e.inspector_ejecutor_id === userId
  )

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
      userId={userId}
      onReorder={ids => setOrderedIds(ids)}
    />
  )
}
