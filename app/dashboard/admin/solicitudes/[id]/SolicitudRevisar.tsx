'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'

interface Props {
  solicitudId: string
  currentStatus: string
  currentNotas: string
}

export default function SolicitudRevisar({ solicitudId, currentStatus, currentNotas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notas, setNotas] = useState(currentNotas)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleAction(nuevoStatus: string) {
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/solicitudes/revisar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solicitudId, nuevoStatus, notas_responsable: notas }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Error al actualizar')
          return
        }
        setSuccess(`Solicitud marcada como: ${STATUS_LABEL[nuevoStatus] ?? nuevoStatus}`)
        router.refresh()
      } catch {
        setError('Error de conexión')
      }
    })
  }

  const STATUS_LABEL: Record<string, string> = {
    en_revision: 'En Revisión',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">Acciones</h2>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Notas del responsable</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones, condiciones especiales, etc."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        {/* Marcar en revisión (from pendiente) */}
        {currentStatus === 'pendiente' && (
          <button
            onClick={() => handleAction('en_revision')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Marcar en revisión
          </button>
        )}

        {/* Aprobar */}
        {['pendiente', 'en_revision'].includes(currentStatus) && (
          <button
            onClick={() => handleAction('aprobada')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Aprobar solicitud
          </button>
        )}

        {/* Rechazar */}
        {['pendiente', 'en_revision'].includes(currentStatus) && (
          <button
            onClick={() => handleAction('rechazada')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rechazar solicitud
          </button>
        )}

        {/* Re-open from aprobada */}
        {currentStatus === 'aprobada' && (
          <button
            onClick={() => handleAction('en_revision')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Regresar a revisión
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-brand-green bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
      )}
    </div>
  )
}
