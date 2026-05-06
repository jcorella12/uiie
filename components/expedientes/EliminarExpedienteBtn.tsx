'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react'

interface Props {
  expedienteId: string
  numeroFolio: string
  clienteNombre: string
  status: string
  numDocumentos: number
}

export default function EliminarExpedienteBtn({
  expedienteId,
  numeroFolio,
  clienteNombre,
  status,
  numDocumentos,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [eliminarFolio, setEliminarFolio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expectedConfirm = numeroFolio.toUpperCase()

  function reset() {
    setOpen(false)
    setConfirm('')
    setJustificacion('')
    setEliminarFolio(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (confirm.trim().toUpperCase() !== expectedConfirm) {
      return setError(`Captura exactamente "${expectedConfirm}" para confirmar`)
    }
    if (justificacion.trim().length < 10) {
      return setError('La justificación debe tener al menos 10 caracteres')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/expedientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          justificacion: justificacion.trim(),
          eliminar_folio: eliminarFolio,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al eliminar')
        return
      }
      // Redirigir al listado — la página actual ya no existe
      router.push('/dashboard/inspector/expedientes')
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const statusCritico = ['aprobado', 'cerrado'].includes(status)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        title="Eliminar expediente (admin)"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Eliminar expediente
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
                  <h3 className="text-lg font-bold text-gray-900">Eliminar expediente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Operación auditada e <strong>irreversible</strong>.
                  </p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
              <p className="text-sm font-semibold text-red-900">Esto borrará permanentemente:</p>
              <ul className="text-xs text-red-800 space-y-0.5 ml-4 list-disc">
                <li>El expediente <span className="font-mono font-semibold">{numeroFolio}</span> ({clienteNombre})</li>
                <li>{numDocumentos} documento{numDocumentos !== 1 ? 's' : ''} (PDFs, fichas, evidencia)</li>
                <li>Inspecciones agendadas, dictamen UVIE, hallazgos y checklist</li>
                <li>Archivos físicos en almacenamiento</li>
              </ul>
              {statusCritico && (
                <p className="text-xs text-red-900 font-bold mt-2 pt-2 border-t border-red-300">
                  ⚠ El expediente está <strong>{status}</strong>. Considera si realmente debe borrarse —
                  pierdes evidencia de un trabajo terminado.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">
                Para confirmar, escribe <span className="font-mono bg-gray-100 px-1 rounded">{expectedConfirm}</span>
              </label>
              <input
                type="text"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
                className="input-field font-mono mt-1"
                placeholder={expectedConfirm}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">
                Justificación * <span className="text-gray-400 font-normal">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                value={justificacion}
                onChange={e => setJustificacion(e.target.value)}
                disabled={loading}
                rows={3}
                className="input-field mt-1"
                placeholder="Ej. Expediente de prueba creado durante demo del 5 de mayo."
                maxLength={500}
              />
              <p className="text-[11px] text-gray-400 mt-1">{justificacion.trim().length}/500</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eliminarFolio}
                  onChange={e => setEliminarFolio(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-gray-700">
                  <span className="font-semibold">También borrar el folio</span> <span className="font-mono">{numeroFolio}</span> del catálogo.
                  <br />
                  <span className="text-gray-500">
                    Si NO marcas esta casilla, el folio queda liberado en el catálogo
                    para reutilizarse en otra solicitud.
                  </span>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
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
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2 transition-colors"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</>
                  : <><Trash2 className="w-4 h-4" /> Sí, eliminar permanentemente</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
