'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onClose, duration = 3500 }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [duration, onClose])

  const cfg = {
    success: { bg: 'bg-emerald-600', Icon: CheckCircle2 },
    error:   { bg: 'bg-red-600',     Icon: XCircle },
    info:    { bg: 'bg-blue-600',    Icon: Info },
  }[type]

  const Icon = cfg.Icon

  return (
    <div className={[
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3',
      'rounded-xl shadow-xl text-white text-sm font-medium max-w-sm',
      'transition-all duration-300',
      cfg.bg,
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
    ].join(' ')}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const [item, setItem] = useState<{ message: string; type: ToastType; id: number } | null>(null)

  function show(message: string, type: ToastType = 'success') {
    setItem({ message, type, id: Date.now() })
  }

  const ToastEl = item ? (
    <Toast
      key={item.id}
      message={item.message}
      type={item.type}
      onClose={() => setItem(null)}
    />
  ) : null

  return { show, ToastEl }
}
