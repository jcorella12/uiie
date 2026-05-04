'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

export default function EliminarDocumentoBtn({ documentoId }: { documentoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { show: showToast, ToastEl } = useToast()

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/documentos/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_id: documentoId }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Error al eliminar' }))
        showToast(error || 'No se pudo eliminar el documento', 'error')
        return
      }
      showToast('Documento eliminado', 'success')
      router.refresh()
    } catch {
      showToast('Error de conexión al eliminar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        aria-label="Eliminar documento"
        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Eliminar
      </button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar documento"
        message="Esta acción no se puede deshacer. El documento se eliminará permanentemente del expediente."
        confirmText="Eliminar"
        variant="danger"
      />

      {ToastEl}
    </>
  )
}
