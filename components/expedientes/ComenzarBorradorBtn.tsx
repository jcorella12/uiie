'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FilePlus, FolderOpen } from 'lucide-react'

interface Props {
  solicitudId:        string
  expedienteExistente?: string | null  // si ya hay expediente (con o sin folio), lo pasamos
}

export default function ComenzarBorradorBtn({ solicitudId, expedienteExistente }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya existe expediente, link directo (no API call)
  if (expedienteExistente) {
    return (
      <a
        href={`/dashboard/inspector/expedientes/${expedienteExistente}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-brand-green bg-brand-green-light hover:bg-brand-green hover:text-white transition-colors"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Abrir expediente
      </a>
    )
  }

  async function handleClick() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/expedientes/crear-borrador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitud_id: solicitudId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      router.push(`/dashboard/inspector/expedientes/${data.expediente_id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors disabled:opacity-50"
        title="Crea un expediente borrador para ir adelantando la info técnica antes de tener el folio"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus className="w-3.5 h-3.5" />}
        {loading ? 'Creando…' : 'Comenzar info técnica'}
      </button>
      {error && <span className="text-[10px] text-red-600 max-w-[200px] truncate">{error}</span>}
    </div>
  )
}
