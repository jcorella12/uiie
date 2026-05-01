'use client'

import { useState } from 'react'
import { Archive, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  expedienteId: string
  numeroFolio: string
  /** Status del expediente — solo se renderiza si cerrado/aprobado */
  status: string
  /** ISO date — null si nunca se descargó */
  respaldoDescargadoAt?: string | null
  /** ISO date — null si no se ha confirmado archivado */
  respaldoArchivadoAt?: string | null
  /** ISO date — si los archivos ya se borraron del server */
  respaldoBorradoAt?: string | null
}

const DIAS_AUTO_BORRADO = 20

export default function BotonZipCompacto({
  expedienteId, numeroFolio, status, respaldoDescargadoAt, respaldoArchivadoAt, respaldoBorradoAt,
}: Props) {
  const [loading, setLoading] = useState(false)

  // No mostrar si el expediente no está aprobado/cerrado
  if (!['aprobado', 'cerrado'].includes(status)) return null

  // Caso 1: ya se borraron los archivos del servidor
  if (respaldoBorradoAt) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-gray-100 text-gray-500"
        title="Los archivos ya se borraron del servidor"
      >
        <Trash2 className="w-3 h-3" />
        Borrado
      </span>
    )
  }

  // Calcular días restantes si está archivado
  let diasRestantes: number | null = null
  if (respaldoArchivadoAt) {
    const fechaBorrado = new Date(respaldoArchivadoAt).getTime() + DIAS_AUTO_BORRADO * 24 * 60 * 60 * 1000
    diasRestantes = Math.ceil((fechaBorrado - Date.now()) / (1000 * 60 * 60 * 24))
  }

  // Determinar color según días restantes
  // - Sin descargar / sin archivar: neutro (verde)
  // - Más de 10 días: verde
  // - 5-10 días: naranja
  // - Menos de 5 días: rojo
  let bgClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
  let icon: React.ReactNode = <Archive className="w-3 h-3" />
  let titleAttr = 'Descargar respaldo del expediente'

  if (respaldoArchivadoAt && diasRestantes !== null) {
    if (diasRestantes <= 5) {
      bgClass = 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300 animate-pulse'
      icon = <AlertTriangle className="w-3 h-3" />
      titleAttr = `⚠️ Se borrará en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`
    } else if (diasRestantes <= 10) {
      bgClass = 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300'
      icon = <AlertTriangle className="w-3 h-3" />
      titleAttr = `Se borrará en ${diasRestantes} días`
    } else {
      bgClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
      icon = <Check className="w-3 h-3" />
      titleAttr = `Archivado · ${diasRestantes} días para auto-borrado`
    }
  } else if (respaldoDescargadoAt) {
    // Descargado pero no confirmado archivado — gris/ámbar
    bgClass = 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
    icon = <AlertTriangle className="w-3 h-3" />
    titleAttr = 'Descargado · falta confirmar archivado'
  }

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/zip`)
      if (!res.ok) {
        let msg = 'Error generando el respaldo'
        try { const body = await res.json(); msg = body.error ?? msg } catch {}
        alert(msg)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${numeroFolio}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={titleAttr}
      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md border transition-all disabled:opacity-50 ${bgClass}`}
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : icon}
      ZIP
      {diasRestantes !== null && diasRestantes >= 0 && (
        <span className="text-[9px] opacity-80">{diasRestantes}d</span>
      )}
    </button>
  )
}
