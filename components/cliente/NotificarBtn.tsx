'use client'

import { useState } from 'react'
import { Bell, BellRing, CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  expedienteId: string
  notificadoAt: string | null   // cli_completado_at
  porcentaje:   number
  disabled?:    boolean
}

export default function NotificarBtn({ expedienteId, notificadoAt, porcentaje, disabled }: Props) {
  const [loading,   setLoading]   = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [yaFecha,   setYaFecha]   = useState(notificadoAt)
  const [error,     setError]     = useState<string | null>(null)

  // Bloquear si ya fue notificado (o si el padre lo deshabilita)
  const yaNotificado = !!yaFecha
  const bloqueado    = disabled || loading

  async function notificar(e: React.MouseEvent) {
    e.preventDefault()   // evitar que el Link padre navegue
    e.stopPropagation()

    if (bloqueado || yaNotificado) return

    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/cliente/expediente/notificar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ expediente_id: expedienteId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar notificación')
      } else {
        setEnviado(true)
        setYaFecha(data.notificado_at ?? new Date().toISOString())
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Ya notificado anteriormente
  if (yaFecha && !enviado) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 font-medium"
        onClick={e => { e.preventDefault(); e.stopPropagation() }}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Inspector notificado · {new Date(yaFecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
      </div>
    )
  }

  // Recién enviado en esta sesión
  if (enviado) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 font-medium"
        onClick={e => { e.preventDefault(); e.stopPropagation() }}
      >
        <BellRing className="w-3.5 h-3.5 shrink-0" />
        ¡Inspector notificado!
      </div>
    )
  }

  return (
    <div
      onClick={e => { e.preventDefault(); e.stopPropagation() }}
      className="flex flex-col gap-1"
    >
      <button
        type="button"
        onClick={notificar}
        disabled={bloqueado || porcentaje === 0}
        className={[
          'inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors',
          porcentaje === 0 || bloqueado
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-brand-green text-white hover:bg-brand-green/90 cursor-pointer',
        ].join(' ')}
        title={porcentaje === 0 ? 'Sube información antes de notificar' : 'Avisar al inspector que ya subiste tu información'}
      >
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando…</>
          : <><Bell className="w-3.5 h-3.5" /> Notificar al Inspector</>
        }
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
