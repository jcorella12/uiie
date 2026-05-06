'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  id: string
  marca: string
  modelo: string
}

export default function EliminarInversorButton({ id, marca, modelo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    const ok = window.confirm(
      `¿Eliminar el inversor "${marca} ${modelo}" del catálogo?\n\n` +
      `Solo se pueden eliminar inversores que no estén siendo usados en expedientes activos. ` +
      `Los expedientes cerrados conservarán la referencia histórica.`
    )
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch('/api/inversores/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.expedientes?.length
          ? `${data.error}\n\nExpedientes que lo usan:\n${data.expedientes.join(', ')}`
          : (data.error ?? 'Error al eliminar')
        alert(msg)
        return
      }
      router.refresh()
    } catch (e: any) {
      alert(e?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title="Eliminar del catálogo"
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Eliminar inversor"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}
