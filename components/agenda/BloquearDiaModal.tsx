'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Lock, Loader2 } from 'lucide-react'

interface Props {
  inspectores: { id: string; nombre: string }[]
  onClose: () => void
  onGuardado: () => void
}

export function BloquearDiaModal({ inspectores, onClose, onGuardado }: Props) {
  const supabase = createClient()
  const [fecha,       setFecha]       = useState('')
  const [motivo,      setMotivo]      = useState('')
  const [inspectorId, setInspectorId] = useState('')   // vacío = global
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function guardar() {
    if (!fecha) { setError('Selecciona una fecha'); return }
    setLoading(true)
    setError(null)

    const { error: err } = await supabase
      .from('dias_bloqueados')
      .upsert({
        fecha,
        motivo:       motivo.trim() || null,
        inspector_id: inspectorId || null,
      }, { onConflict: 'inspector_id,fecha' })

    setLoading(false)
    if (err) { setError(err.message); return }
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-800">Bloquear día</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Inspector (vacío = bloqueo para todos)</label>
            <select
              value={inspectorId}
              onChange={e => setInspectorId(e.target.value)}
              className="input-field"
            >
              <option value="">— Todos los inspectores —</option>
              {inspectores.map(i => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Motivo (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Día festivo, Capacitación…"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={loading || !fecha}
            className="btn-primary flex items-center gap-2 bg-red-600 hover:bg-red-700 border-red-600"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Bloquear día
          </button>
        </div>
      </div>
    </div>
  )
}
