'use client'
import { useState } from 'react'
import { Send, Loader2, AlertTriangle, ChevronRight } from 'lucide-react'

type Props = {
  expedienteId:    string
  status:          string
  checklistPct:    number | null
  numDocumentos:   number
  esAdmin:         boolean
  esInspector:     boolean   // dueño o ejecutor
  fueRechazado?:   boolean
}

/**
 * CTA visible al tope del expediente que permite al inspector (o admin) enviar
 * el expediente a revisión sin tener que scrollear hasta la sección final.
 *
 * Se muestra cuando:
 *  - status ∈ {borrador, en_proceso, devuelto}
 *  - el usuario es el inspector dueño/ejecutor o admin
 *  - hay al menos 1 documento subido
 *
 * Si el checklist NO está al 100% se muestra un aviso ámbar pero el botón
 * sigue habilitado (algunos campos pueden completarse en revisión).
 */
export default function EnviarRevisionCTA({
  expedienteId, status, checklistPct, numDocumentos, esAdmin, esInspector, fueRechazado,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notas, setNotas]   = useState('')
  const [error, setError]   = useState<string | null>(null)

  const enviable = ['borrador', 'en_proceso', 'devuelto'].includes(status)
  if (!enviable) return null
  if (!esAdmin && !esInspector) return null

  const sinDocs        = numDocumentos === 0
  const checklistBajo  = (checklistPct ?? 0) < 100

  async function handleEnviar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/expedientes/enviar-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId, notas_envio: notas.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo enviar')
      // Recargar para que la UI refleje el nuevo status
      window.location.reload()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (confirmOpen) {
    return (
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Send className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">
              {fueRechazado ? 'Reenviar para revisión' : 'Enviar para revisión'}
            </p>
            <p className="text-xs text-amber-800 mt-1">
              El expediente cambiará a estado "En revisión" y será evaluado por administración.
              Una vez enviado no podrás editar campos hasta recibir la decisión.
            </p>
          </div>
        </div>

        {checklistBajo && (
          <div className="flex items-start gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              El checklist está al <strong>{checklistPct ?? 0}%</strong>. Si confirmas el envío,
              el revisor verá los puntos pendientes y puede devolver el expediente.
            </span>
          </div>
        )}

        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          placeholder="Nota opcional para el revisor…"
          className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 resize-none bg-white"
        />

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleEnviar}
            disabled={loading || sinDocs}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirmar envío
          </button>
          <button
            onClick={() => { setConfirmOpen(false); setError(null) }}
            disabled={loading}
            className="text-sm text-amber-900 hover:underline px-2 py-1"
          >
            Cancelar
          </button>
          {sinDocs && (
            <span className="text-xs text-red-700 ml-auto">
              Sube al menos un documento antes de enviar
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${
      sinDocs
        ? 'border-gray-200 bg-gray-50'
        : checklistBajo
        ? 'border-amber-300 bg-amber-50'
        : 'border-emerald-300 bg-emerald-50'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        sinDocs ? 'bg-gray-300'
          : checklistBajo ? 'bg-amber-500'
          : 'bg-emerald-500'
      }`}>
        <Send className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${
          sinDocs ? 'text-gray-700'
            : checklistBajo ? 'text-amber-900'
            : 'text-emerald-900'
        }`}>
          {sinDocs
            ? 'Listo para empezar'
            : checklistBajo
            ? `Checklist al ${checklistPct ?? 0}% — Puedes enviar de todos modos`
            : '¡Checklist al 100% — Listo para enviar a revisión!'}
        </p>
        <p className={`text-xs mt-0.5 ${
          sinDocs ? 'text-gray-500'
            : checklistBajo ? 'text-amber-800'
            : 'text-emerald-800'
        }`}>
          {sinDocs
            ? 'Sube los documentos del expediente y completa la información técnica.'
            : fueRechazado
            ? 'El paquete fue devuelto. Corrige y reenvía cuando esté listo.'
            : 'El revisor evaluará el paquete completo y aprobará o devolverá con observaciones.'}
        </p>
      </div>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={sinDocs}
        className="btn-primary text-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {fueRechazado ? 'Reenviar' : 'Enviar a revisión'}
        <ChevronRight className="w-4 h-4 -mr-1" />
      </button>
    </div>
  )
}
