'use client'

/**
 * Editor inline del precio del expediente.
 *
 * El precio se fija al crear la solicitud y se guarda en
 * `solicitudes_folio.precio_propuesto`. Antes era inmutable después de
 * que se asignaba el folio; este componente permite modificarlo cuando
 * el alcance del proyecto cambia (más paneles, ajuste comercial, etc.).
 *
 * Cada cambio se persiste con bitácora en `precio_historial`.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign, Pencil, Save, X, Loader2, AlertCircle, History,
  CheckCircle2,
} from 'lucide-react'

interface HistorialEvento {
  precio_anterior: number | null
  precio_nuevo:    number
  fecha:           string
  usuario_id:      string
  rol?:            string
  motivo?:         string | null
}

interface Props {
  expedienteId: string
  precioActual: number | null
  historial?:   HistorialEvento[]
  /** true cuando el expediente está cerrado / no se permite editar. */
  readOnly?:    boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 2,
  }).format(n)

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function PrecioExpedienteCard({
  expedienteId, precioActual, historial = [], readOnly,
}: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [precio, setPrecio]     = useState<string>(precioActual != null ? String(precioActual) : '')
  const [motivo, setMotivo]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)
  const [verHistorial, setVerHistorial] = useState(false)

  function reset() {
    setEditando(false)
    setPrecio(precioActual != null ? String(precioActual) : '')
    setMotivo('')
    setError(null)
    setDone(false)
  }

  async function guardar() {
    setError(null)
    const num = parseFloat(precio)
    if (!Number.isFinite(num) || num < 0) {
      return setError('Ingresa un número válido (≥ 0)')
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/precio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio: num, motivo: motivo.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }
      setDone(true)
      router.refresh()
      setTimeout(() => { setEditando(false); setDone(false) }, 1200)
    } catch (e: any) {
      setError(e?.message ?? 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // ── Vista solo lectura ─────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Precio del expediente
            </p>
            {!editando && (
              <>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {precioActual != null ? fmt(precioActual) : '—'}
                </p>
                <p className="text-[11px] text-gray-400">
                  + IVA {precioActual != null ? `· ${fmt(precioActual * 1.16)} con IVA` : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {!editando && !readOnly && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Modificar
          </button>
        )}
      </div>

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      {editando && (
        <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-gray-600">Nuevo precio (MXN)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                disabled={saving || done}
                className="w-full mt-0.5 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="Ej. 8500"
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-gray-600">Motivo del cambio (opcional)</label>
              <input
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                disabled={saving || done}
                className="w-full mt-0.5 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="Ej. Cliente amplió de 30 a 50 paneles"
                maxLength={500}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          {done && (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Precio actualizado.
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={saving || done}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
                : <><Save className="w-3.5 h-3.5" /> Guardar precio</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Historial de cambios ──────────────────────────────────────────── */}
      {historial.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setVerHistorial(v => !v)}
            className="text-[11px] text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            <History className="w-3 h-3" />
            {verHistorial ? 'Ocultar' : `Ver historial (${historial.length} cambio${historial.length !== 1 ? 's' : ''})`}
          </button>
          {verHistorial && (
            <ul className="mt-2 space-y-1.5">
              {[...historial].reverse().map((h, i) => (
                <li key={i} className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span>
                      {h.precio_anterior != null ? fmt(h.precio_anterior) : '—'}
                      {' → '}
                      <strong className="text-gray-900">{fmt(h.precio_nuevo)}</strong>
                    </span>
                    <span className="text-[10px] text-gray-400">{fmtFecha(h.fecha)}</span>
                  </div>
                  {h.motivo && (
                    <p className="text-[11px] text-gray-500 mt-0.5 italic">"{h.motivo}"</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
