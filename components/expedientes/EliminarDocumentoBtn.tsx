'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function EliminarDocumentoBtn({ documentoId }: { documentoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
    setLoading(true)
    try {
      await fetch('/api/documentos/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_id: documentoId }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar documento"
      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      Eliminar
    </button>
  )
}
