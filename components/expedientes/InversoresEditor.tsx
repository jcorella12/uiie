'use client'

/**
 * Editor de múltiples inversores por expediente.
 *
 * Útil tanto para el inspector (en InfoTecnicaForm) como para el cliente
 * (en ExpedientePrecarga). Es común que un proyecto traiga 2+ modelos
 * mezclados (8 Sungrow + 2 Huawei, etc.).
 *
 * Persiste con POST /api/expedientes/inversores (reemplazo total de la lista,
 * más fácil de razonar que CRUD individual).
 */

import { useEffect, useState } from 'react'
import {
  Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
  Search, ChevronDown,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CertificacionInversor = 'ul1741' | 'ieee1547' | 'homologado_cne' | 'ninguna'

export interface InversorRowData {
  id?: string                           // si viene de la DB
  inversor_id?: string | null           // FK al catálogo (opcional)
  marca: string
  modelo: string
  cantidad: number
  potencia_kw?: number | null
  certificacion: CertificacionInversor
  justificacion_ieee1547?: string | null
}

interface CatalogoInversor {
  id:               string
  marca:            string
  modelo:           string
  potencia_kw:      number
  certificacion:    string
  certificado_url:  string | null
  fase:             string
}

interface Props {
  expedienteId: string
  initial:      InversorRowData[]
  /** Callback opcional cuando se guarda exitosamente (para que el padre refresque). */
  onSaved?:     (rows: InversorRowData[]) => void
  /** Si es true, los datos se mostran solo lectura (sin botones de editar). */
  readOnly?:    boolean
  /** Modo "ligero": sin selector de catálogo, captura libre. Útil en el portal del cliente. */
  modoLibre?:   boolean
}

// ─── Constantes UI ────────────────────────────────────────────────────────────

const CERT_OPTIONS: { value: CertificacionInversor; label: string; help?: string }[] = [
  { value: 'ul1741',         label: 'UL 1741',                  help: 'Cumple por sí solo' },
  { value: 'homologado_cne', label: 'Homologado CNE',           help: 'Oficio CNE F00.06.UE/225/2026' },
  { value: 'ieee1547',       label: 'IEEE 1547',                help: 'Requiere justificación' },
  { value: 'ninguna',        label: 'Sin certificación',        help: 'No cumple — genera hallazgo' },
]

// ─── Selector inline de catálogo ──────────────────────────────────────────────

function CatalogPicker({
  onPick, initialQuery = '',
}: { onPick: (inv: CatalogoInversor) => void; initialQuery?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<CatalogoInversor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/cliente/inversores/buscar?q=${encodeURIComponent(query)}`)
        const d = await r.json()
        setResults(d.inversores ?? [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(t)
  }, [query, open])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Buscar marca o modelo en catálogo…"
          className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
        />
        <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-3 justify-center text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="text-center py-3 text-xs text-gray-400">Sin resultados — captura manual abajo</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {results.map(inv => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onPick(inv); setOpen(false); setQuery('') }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                  >
                    <p className="font-medium text-gray-900">{inv.marca} {inv.modelo}</p>
                    <p className="text-[11px] text-gray-500">{inv.potencia_kw} kW · {inv.fase} · {inv.certificacion}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InversoresEditor({
  expedienteId, initial, onSaved, readOnly, modoLibre,
}: Props) {
  const [rows, setRows] = useState<InversorRowData[]>(() =>
    initial.length > 0
      ? initial.map(r => ({ ...r }))
      : [emptyRow()],
  )
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  function emptyRow(): InversorRowData {
    return {
      marca: '',
      modelo: '',
      cantidad: 1,
      potencia_kw: null,
      certificacion: 'ul1741',
      justificacion_ieee1547: null,
    }
  }

  function update(index: number, patch: Partial<InversorRowData>) {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
    setDirty(true)
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()])
    setDirty(true)
  }

  function removeRow(index: number) {
    setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
    setDirty(true)
  }

  function pickFromCatalog(index: number, inv: CatalogoInversor) {
    update(index, {
      inversor_id: inv.id,
      marca: inv.marca,
      modelo: inv.modelo,
      potencia_kw: inv.potencia_kw,
      certificacion: (['ul1741','ieee1547','homologado_cne','ninguna'].includes(inv.certificacion)
        ? inv.certificacion
        : 'ul1741') as CertificacionInversor,
    })
  }

  async function handleSave() {
    setError(null)
    // Validación local
    for (const [i, r] of rows.entries()) {
      if (!r.marca.trim() || !r.modelo.trim()) {
        setError(`Fila ${i + 1}: la marca y el modelo son obligatorios`)
        return
      }
      if (!r.cantidad || r.cantidad < 1) {
        setError(`Fila ${i + 1}: la cantidad debe ser al menos 1`)
        return
      }
      if (r.certificacion === 'ieee1547' && !(r.justificacion_ieee1547 ?? '').trim()) {
        setError(`Fila ${i + 1}: si la certificación es IEEE 1547 debes capturar la justificación`)
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/expedientes/inversores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          inversores: rows.map((r, idx) => ({
            inversor_id: r.inversor_id ?? null,
            marca: r.marca.trim(),
            modelo: r.modelo.trim(),
            cantidad: r.cantidad,
            potencia_kw: r.potencia_kw ?? null,
            certificacion: r.certificacion,
            justificacion_ieee1547: r.justificacion_ieee1547?.trim() || null,
            orden: idx + 1,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
      } else {
        setSavedAt(new Date())
        setDirty(false)
        onSaved?.(rows)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (readOnly) {
    return (
      <div className="space-y-2">
        {rows.length === 0 || (rows.length === 1 && !rows[0].marca) ? (
          <p className="text-sm text-gray-400">Sin inversores capturados.</p>
        ) : (
          rows.map((r, i) => (
            <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm flex items-center justify-between gap-3">
              <span>
                <strong>{r.cantidad}×</strong> {r.marca} {r.modelo}
                {r.potencia_kw != null && <span className="text-gray-500"> · {r.potencia_kw} kW</span>}
              </span>
              <span className="text-xs text-gray-500">
                {CERT_OPTIONS.find(o => o.value === r.certificacion)?.label ?? r.certificacion}
              </span>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-3 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inversor #{i + 1}</p>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-red-400 hover:text-red-600 transition-colors text-xs flex items-center gap-1"
                title="Quitar este inversor"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar
              </button>
            )}
          </div>

          {!modoLibre && (
            <CatalogPicker onPick={(inv) => pickFromCatalog(i, inv)} />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-gray-500 font-medium">Marca *</label>
              <input
                type="text"
                value={r.marca}
                onChange={e => update(i, { marca: e.target.value })}
                placeholder="Sungrow"
                className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-gray-500 font-medium">Modelo *</label>
              <input
                type="text"
                value={r.modelo}
                onChange={e => update(i, { modelo: e.target.value })}
                placeholder="SG110CX"
                className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 font-medium">Cantidad *</label>
              <input
                type="number"
                min={1}
                value={r.cantidad}
                onChange={e => update(i, { cantidad: parseInt(e.target.value) || 1 })}
                className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 font-medium">Potencia (kW)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={r.potencia_kw ?? ''}
                onChange={e => update(i, { potencia_kw: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="110"
                className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-500 font-medium">Certificación</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
              {CERT_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex flex-col gap-0.5 px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                    r.certificacion === opt.value
                      ? 'border-[#0F6E56] bg-[#0F6E56]/5 text-[#0F6E56]'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`cert-${i}`}
                    value={opt.value}
                    checked={r.certificacion === opt.value}
                    onChange={() => update(i, { certificacion: opt.value })}
                    className="sr-only"
                  />
                  <span className="font-medium">{opt.label}</span>
                  {opt.help && <span className="text-[10px] opacity-70">{opt.help}</span>}
                </label>
              ))}
            </div>
          </div>

          {r.certificacion === 'ieee1547' && (
            <div>
              <label className="text-[11px] text-gray-500 font-medium">
                Justificación * <span className="text-gray-400">(por qué no UL1741)</span>
              </label>
              <input
                type="text"
                value={r.justificacion_ieee1547 ?? ''}
                onChange={e => update(i, { justificacion_ieee1547: e.target.value })}
                placeholder="El fabricante no tramitó la certificación UL1741…"
                className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30 focus:border-[#0F6E56]"
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[#0F6E56] hover:bg-[#0F6E56]/5 border border-[#0F6E56]/40 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar otro modelo de inversor
        </button>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-600 inline-flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
          {savedAt && !dirty && !error && (
            <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-[#0F6E56] hover:bg-[#0d5d4a] disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              : 'Guardar inversores'}
          </button>
        </div>
      </div>
    </div>
  )
}
