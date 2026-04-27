'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

export default function RecrerarExpedienteBtn({ solicitudId }: { solicitudId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRecrear() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/folios/recrear-expediente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitud_id: solicitudId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al crear expediente')
        return
      }
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-800">Expediente no generado</p>
          <p className="text-xs text-orange-700 mt-0.5">
            El folio fue asignado pero el expediente no se creó. Usa este botón para recuperarlo.
          </p>
        </div>
      </div>

      <button
        onClick={handleRecrear}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</>
          : <><RefreshCw className="w-4 h-4" /> Crear expediente ahora</>
        }
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
