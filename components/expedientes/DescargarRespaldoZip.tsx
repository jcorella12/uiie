'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Download, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

interface Props {
  expedienteId: string
  /** Número de folio interno del expediente (ej: UIIE-NNN-YYYY) — se usa para el nombre del ZIP */
  folioInterno: string | null
  yaDescargadoEn?: string | null
  /** ISO string — cuando el usuario confirmó que lo archivó localmente */
  yaArchivadoEn?: string | null
}

const DIAS_AUTO_BORRADO = 20

export default function DescargarRespaldoZip({
  expedienteId, folioInterno, yaDescargadoEn, yaArchivadoEn,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  // Si ya descargó pero no ha confirmado, mostrar prompt de confirmación
  const [showConfirm, setShowConfirm] = useState(!!yaDescargadoEn && !yaArchivadoEn)
  const [confirmando, setConfirmando] = useState(false)
  const [archivadoLocal, setArchivadoLocal] = useState(yaArchivadoEn)

  // Calcular días restantes hasta auto-borrado
  let diasRestantes: number | null = null
  if (archivadoLocal) {
    const fechaBorrado = new Date(archivadoLocal).getTime() + DIAS_AUTO_BORRADO * 24 * 60 * 60 * 1000
    diasRestantes = Math.ceil((fechaBorrado - Date.now()) / (1000 * 60 * 60 * 24))
  }

  async function handleDownload() {
    setLoading(true)
    setError(null)
    setProgress('Empaquetando archivos…')

    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/zip`)
      if (!res.ok) {
        let msg = 'Error al generar el respaldo'
        try { const body = await res.json(); msg = body.error ?? msg } catch {}
        throw new Error(msg)
      }
      setProgress('Descargando…')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${folioInterno ?? 'expediente'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setProgress('✓ Descargado')
      // Mostrar prompt para confirmar archivado
      setTimeout(() => {
        setProgress(null)
        setShowConfirm(true)
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }

  async function confirmarArchivado(archivado: boolean) {
    setConfirmando(true)
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/respaldo-archivado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivado }),
      })
      if (!res.ok) throw new Error('No se pudo guardar la confirmación')

      if (archivado) {
        setArchivadoLocal(new Date().toISOString())
      } else {
        setArchivadoLocal(null)
      }
      setShowConfirm(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Card principal */}
      <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base">Respaldo del expediente</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Descarga todos los archivos en un ZIP organizado por carpetas (Resolutivo, Acta, Dictamen, INEs, etc.)
            </p>

            {/* Estado de archivado */}
            {archivadoLocal ? (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Archivado el {new Date(archivadoLocal).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
                {diasRestantes !== null && diasRestantes > 0 && (
                  <span className="text-emerald-600">· auto-borrado en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</span>
                )}
              </div>
            ) : yaDescargadoEn ? (
              <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Descargado pero pendiente de confirmar archivado
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress ?? 'Generando…'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {yaDescargadoEn ? 'Volver a descargar' : 'Descargar ZIP'}
                  {folioInterno && (
                    <span className="text-xs opacity-80 font-normal hidden sm:inline">
                      · {folioInterno}.zip
                    </span>
                  )}
                </>
              )}
            </button>

            {progress && !loading && (
              <p className="text-xs text-emerald-600 mt-2">{progress}</p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-2">⚠️ {error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Prompt de confirmación de archivado */}
      {showConfirm && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-sm mb-1">
                ¿Ya guardaste el ZIP en tus carpetas locales?
              </h4>
              <p className="text-xs text-amber-800 mb-3 leading-relaxed">
                Confirma para que arranque el contador de <strong>{DIAS_AUTO_BORRADO} días</strong>.
                Pasado ese plazo, los archivos se borrarán automáticamente del servidor para
                liberar espacio. Tú mantendrás tu copia local intacta.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => confirmarArchivado(true)}
                  disabled={confirmando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {confirmando
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Sí, ya lo archivé localmente
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={confirmando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-amber-800 text-sm font-medium rounded-lg border border-amber-300 hover:bg-amber-100"
                >
                  Aún no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
