'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Error boundary global. Se activa si una page o layout crashea en runtime.
 * IMPORTANTE: este archivo DEBE ser 'use client' (requisito de Next.js).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log del error a tu servicio de observabilidad (cuando lo tengas).
  // Por ahora solo a console — Sentry, Datadog, etc. iría aquí.
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="card max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          Ocurrió un error inesperado al cargar esta sección.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-4">
            Código: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center mt-6">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </button>
          <a href="/dashboard" className="btn-outline inline-flex items-center">
            Volver al inicio
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Si el problema persiste, contacta a soporte.
        </p>
      </div>
    </div>
  )
}
