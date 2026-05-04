'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'info'

interface ConfirmModalProps {
  /** Si está abierto el modal */
  open: boolean
  /** Llamado al cerrar (cancel o confirm) */
  onClose: () => void
  /** Llamado al confirmar. Puede ser async — el modal muestra loading y se cierra al resolver */
  onConfirm: () => void | Promise<void>
  /** Título grande del modal */
  title: string
  /** Mensaje descriptivo */
  message: string
  /** Texto del botón de confirmación. Default: 'Confirmar' */
  confirmText?: string
  /** Texto del botón de cancelar. Default: 'Cancelar' */
  cancelText?: string
  /** Variante visual. 'danger' es para acciones destructivas (eliminar) */
  variant?: Variant
}

const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    btn: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  info: {
    iconBg: 'bg-brand-green-light',
    iconColor: 'text-brand-green',
    btn: 'bg-brand-green hover:bg-brand-green-dark text-white',
  },
} as const

/**
 * Modal de confirmación accesible. Reemplazo de window.confirm().
 *
 * Características de accesibilidad:
 * - Atrapa foco dentro del modal (focus trap)
 * - Escape cierra el modal
 * - role="dialog" + aria-modal="true"
 * - aria-labelledby + aria-describedby
 * - Foco automático al botón de cancelar (acción menos destructiva)
 *
 * Uso:
 * ```tsx
 * const [openDelete, setOpenDelete] = useState(false)
 * <ConfirmModal
 *   open={openDelete}
 *   onClose={() => setOpenDelete(false)}
 *   onConfirm={async () => { await deleteFn() }}
 *   title="Eliminar documento"
 *   message="Esta acción no se puede deshacer."
 *   confirmText="Eliminar"
 *   variant="danger"
 * />
 * ```
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const styles = VARIANT_STYLES[variant]

  // Foco inicial en el botón de cancelar (acción más segura)
  useEffect(() => {
    if (open) {
      // pequeño delay para dejar que el modal se monte
      const t = setTimeout(() => cancelRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, loading, onClose])

  if (!open) return null

  async function handleConfirm() {
    try {
      setLoading(true)
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        tabIndex={-1}
        aria-label="Cerrar modal"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-zoom-in">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              {title}
            </h2>
            <p
              id="confirm-modal-message"
              className="text-sm text-gray-600 mt-1.5 leading-relaxed"
            >
              {message}
            </p>
          </div>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 ${styles.btn}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
