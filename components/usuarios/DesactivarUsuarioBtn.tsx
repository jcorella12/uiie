'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserX, Loader2, X, AlertTriangle } from 'lucide-react'

interface Props {
  usuarioId:     string
  usuarioNombre: string
  usuarioRol:    string
  usuarioActivo: boolean
}

export default function DesactivarUsuarioBtn({
  usuarioId, usuarioNombre, usuarioRol, usuarioActivo,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setOpen(false); setJustificacion(''); setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (justificacion.trim().length < 5) {
      return setError('La justificación debe tener al menos 5 caracteres')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios/desactivar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, justificacion: justificacion.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al desactivar')
        return
      }
      router.push('/dashboard/admin/usuarios')
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Si ya está inactivo, no mostrar botón (sería confuso)
  if (!usuarioActivo) {
    return (
      <p className="text-xs text-gray-400 italic">
        Usuario ya desactivado. Reactiva con la casilla "Usuario activo" arriba.
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
      >
        <UserX className="w-3.5 h-3.5" />
        Desactivar usuario
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
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <UserX className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Desactivar usuario</h3>
                  <p className="text-xs text-gray-500 mt-0.5">El usuario no podrá iniciar sesión, pero su historial se conserva.</p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
              <p className="text-sm font-semibold text-amber-900">
                Vas a desactivar a <strong>{usuarioNombre}</strong> ({usuarioRol})
              </p>
              <ul className="text-xs text-amber-800 space-y-0.5 ml-4 list-disc">
                <li>No podrá iniciar sesión</li>
                <li>Sus expedientes, documentos y registros históricos se mantienen intactos</li>
                <li>Lo puedes reactivar cuando quieras desde "Usuario activo"</li>
              </ul>
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
                placeholder="Ej. Ya no trabaja con nosotros desde el 30 abril."
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
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Desactivando…</> : <><UserX className="w-4 h-4" /> Sí, desactivar</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
