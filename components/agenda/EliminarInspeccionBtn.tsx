'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

type Props = {
  inspeccionId: string
  /** Si true, no se puede borrar (cert emitido o realizada). Muestra tooltip explicativo. */
  bloqueado?: boolean
  bloqueadoMotivo?: string
  size?: 'xs' | 'sm'
}

/**
 * Botón para borrar una inspección agendada — solo permitido cuando:
 *   - El expediente NO tiene certificado emitido (no está en CNE)
 *   - La inspección NO está marcada como 'realizada'
 *
 * El backend valida lo mismo; este botón solo da feedback temprano.
 */
export default function EliminarInspeccionBtn({
  inspeccionId, bloqueado, bloqueadoMotivo, size = 'sm',
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const { show: showToast, ToastEl } = useToast()

  if (bloqueado) {
    return (
      <span
        title={bloqueadoMotivo ?? 'No se puede borrar — la inspección ya está cerrada'}
        className={`inline-flex items-center gap-1 ${size === 'xs' ? 'text-[10px]' : 'text-xs'} text-gray-300 cursor-not-allowed`}
      >
        <Trash2 className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </span>
    )
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/inspecciones/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspeccion_id: inspeccionId }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Error al borrar' }))
        showToast(error || 'No se pudo borrar la inspección', 'error')
        return
      }
      showToast('Inspección borrada', 'success')
      router.refresh()
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        aria-label="Borrar inspección"
        className={`inline-flex items-center gap-1 ${size === 'xs' ? 'text-[10px]' : 'text-xs'} text-red-400 hover:text-red-600 font-medium disabled:opacity-50 transition-colors`}
      >
        {loading
          ? <Loader2 className={size === 'xs' ? 'w-3 h-3 animate-spin' : 'w-3.5 h-3.5 animate-spin'} />
          : <Trash2 className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Borrar inspección agendada"
        message="Esta acción borra la programación de la visita. Solo puede hacerse antes de que el certificado se emita en CNE — si ya fue emitido, esta acción quedará bloqueada."
        confirmText="Borrar"
        variant="danger"
      />
      {ToastEl}
    </>
  )
}
