'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react'

interface Props {
  clienteId:     string
  clienteNombre: string
}

export default function EliminarClienteBtn({ clienteId, clienteNombre }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Confirmación: tipear el nombre del cliente (primeras 20 chars).
  // Sirve para que un click accidental no borre por error.
  const expected = clienteNombre.trim().slice(0, 20).toUpperCase()

  function reset() {
    setOpen(false); setConfirmText(''); setJustificacion(''); setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (confirmText.trim().toUpperCase() !== expected) {
      return setError(`Captura "${expected}" para confirmar`)
    }
    if (justificacion.trim().length < 5) {
      return setError('La justificación debe tener al menos 5 caracteres')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/clientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, justificacion: justificacion.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al eliminar')
        return
      }
      router.push('/dashboard/inspector/clientes')
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        title="Eliminar cliente"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Eliminar cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={reset}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eliminar cliente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Operación auditada e <strong>irreversible</strong>.</p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
              <p className="text-sm font-semibold text-red-900">Esto borrará permanentemente:</p>
              <ul className="text-xs text-red-800 space-y-0.5 ml-4 list-disc">
                <li>El cliente <strong>{clienteNombre}</strong></li>
                <li>Sus INEs / identificaciones (si existen)</li>
              </ul>
              <p className="text-xs text-red-900 font-bold mt-2 pt-2 border-t border-red-300">
                ⚠ Si el cliente tiene <strong>expedientes o solicitudes vinculadas</strong>, el borrado se
                bloqueará. Tendrás que borrar primero esos registros.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">
                Para confirmar, escribe <span className="font-mono bg-gray-100 px-1 rounded">{expected}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                disabled={loading}
                className="input-field mt-1 font-mono uppercase"
                placeholder={expected}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">
                Justificación * <span className="text-gray-400 font-normal">(mín 5 caracteres)</span>
              </label>
              <textarea
                value={justificacion}
                onChange={e => setJustificacion(e.target.value)}
                disabled={loading}
                rows={3}
                className="input-field mt-1"
                placeholder="Ej. Cliente de prueba creado durante demo."
                maxLength={400}
              />
              <p className="text-[11px] text-gray-400 mt-1">{justificacion.trim().length}/400</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={reset} disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</> : <><Trash2 className="w-4 h-4" /> Sí, eliminar</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
