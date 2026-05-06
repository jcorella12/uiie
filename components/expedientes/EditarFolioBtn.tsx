'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X, AlertTriangle } from 'lucide-react'

interface Props {
  expedienteId: string
  folioActual: string
}

export default function EditarFolioBtn({ expedienteId, folioActual }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nuevoFolio, setNuevoFolio] = useState(folioActual)
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setOpen(false)
    setNuevoFolio(folioActual)
    setJustificacion('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedFolio = nuevoFolio.trim()
    const trimmedJust = justificacion.trim()
    if (!trimmedFolio) return setError('Captura el nuevo folio')
    if (trimmedFolio === folioActual) return setError('El nuevo folio es igual al actual')
    if (trimmedJust.length < 10) return setError('La justificación debe tener al menos 10 caracteres')

    setLoading(true)
    try {
      const res = await fetch('/api/expedientes/cambiar-folio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          nuevo_folio: trimmedFolio,
          justificacion: trimmedJust,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar el folio')
        return
      }
      reset()
      router.refresh()
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
        title="Modificar número de folio (admin)"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-brand-green hover:bg-brand-green-light transition-colors"
        aria-label="Editar folio"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={reset}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Modificar número de folio</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Acción auditada — el cambio queda registrado con tu usuario y motivo.
                </p>
              </div>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Cambiar el folio puede romper referencias en documentos ya generados (contratos,
                actas, certificados). Regenera los documentos afectados después del cambio.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Folio actual</label>
              <p className="font-mono text-sm bg-gray-100 rounded px-3 py-2 mt-1">{folioActual}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700" htmlFor="nuevo-folio">
                Nuevo folio *
              </label>
              <input
                id="nuevo-folio"
                type="text"
                value={nuevoFolio}
                onChange={e => setNuevoFolio(e.target.value)}
                disabled={loading}
                className="input-field font-mono mt-1"
                placeholder="Ej. UIIE-545-2026"
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700" htmlFor="justificacion">
                Justificación * <span className="text-gray-400 font-normal">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                id="justificacion"
                value={justificacion}
                onChange={e => setJustificacion(e.target.value)}
                disabled={loading}
                rows={3}
                className="input-field mt-1"
                placeholder="Ej. Error de captura — el folio asignado por CRE fue UIIE-545-2026 y se registró UIIE-454-2026."
                maxLength={500}
              />
              <p className="text-[11px] text-gray-400 mt-1">{justificacion.trim().length}/500</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                  : <>Aplicar cambio</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
