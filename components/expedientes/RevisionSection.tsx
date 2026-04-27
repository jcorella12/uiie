'use client'

import { useState } from 'react'
import {
  Send, CheckCircle2, XCircle, Brain, Loader2, AlertTriangle,
  Info, ChevronDown, ChevronUp, Eye, FileCheck, FileX, RotateCcw,
  ClipboardCheck, Award, Copy, Check,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Documento {
  id: string
  nombre: string
  tipo: string
  publicUrl: string | null
  revisado?: boolean
  nota_revision?: string | null
  analisis_ia?: any
}

interface EnvioRevision {
  id: string
  enviado_en: string
  notas_envio?: string | null
  decision?: 'aprobado' | 'rechazado' | null
  notas_revision?: string | null
  revisado_en?: string | null
  revision_ia?: any | null
}

interface Props {
  expedienteId: string
  expedienteStatus: string
  documentos: Documento[]
  ultimoEnvio: EnvioRevision | null
  esAdmin: boolean
  folio?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  contrato:        'Contrato',
  plano:           'Plano',
  memoria_tecnica: 'Memoria Técnica',
  dictamen:        'Dictamen',
  acta:            'Acta',
  fotografia:      'Fotografía',
  certificado_cre: 'Certificado CNE',
  acuse_cre:       'Acuse CNE',
  otro:            'Otro',
}

function AlertNivel({ nivel }: { nivel: string }) {
  if (nivel === 'error')
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><XCircle className="w-3 h-3" />Error</span>
  if (nivel === 'advertencia')
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" />Advertencia</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"><Info className="w-3 h-3" />Info</span>
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function RevisionSection({
  expedienteId,
  expedienteStatus,
  documentos,
  ultimoEnvio: ultimoEnvioInicial,
  esAdmin,
  folio,
}: Props) {
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingDecision, setLoadingDecision] = useState<'aprobado' | 'rechazado' | null>(null)
  const { show: showToast, ToastEl } = useToast()
  const [loadingCerrar, setLoadingCerrar] = useState(false)
  const [confirmCerrar, setConfirmCerrar] = useState(false)
  const [cerradoInfo, setCerradoInfo] = useState<{
    cerrado_en: string
    inspector: { nombre: string | null; correo: string | null }
    cliente: { nombre: string | null; correo: string | null }
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ultimoEnvio, setUltimoEnvio] = useState<EnvioRevision | null>(ultimoEnvioInicial)
  const [status, setStatus] = useState(expedienteStatus)
  const [iaResult, setIaResult] = useState<any>(ultimoEnvioInicial?.revision_ia ?? null)
  const [iaOpen, setIaOpen] = useState(false)
  const [docsRevisados, setDocsRevisados] = useState<Record<string, boolean>>(
    Object.fromEntries(documentos.map(d => [d.id, d.revisado ?? false]))
  )

  // ── Inspector: enviar para revisión ───────────────────────────────────────
  async function handleEnviar() {
    setError(null)
    setLoading(true)
    try {
      const r = await fetch('/api/expedientes/enviar-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId, notas_envio: notas }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Error al enviar')
      setStatus('revision')
      setUltimoEnvio(data.envio)
      showToast('Expediente enviado para revisión correctamente.')
      setNotas('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Admin: aprobar o rechazar ─────────────────────────────────────────────
  async function handleDecision(decision: 'aprobado' | 'rechazado') {
    setError(null)
    setLoadingDecision(decision)
    try {
      const r = await fetch('/api/expedientes/revisar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          envio_id: ultimoEnvio?.id,
          decision,
          notas_revision: notas,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Error')
      setStatus(data.nuevoStatus)
      setUltimoEnvio(prev => prev ? { ...prev, decision, notas_revision: notas } : prev)
      showToast(
        decision === 'aprobado'
          ? 'Paquete aprobado — expediente en estado Aprobado.'
          : 'Paquete devuelto al inspector para correcciones.',
        decision === 'aprobado' ? 'success' : 'info'
      )
      setNotas('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingDecision(null)
    }
  }

  // ── Admin: emitir certificado y cerrar expediente ────────────────────────
  async function handleCerrar() {
    setError(null)
    setLoadingCerrar(true)
    try {
      const r = await fetch('/api/expedientes/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Error al cerrar el expediente')
      setStatus('cerrado')
      setConfirmCerrar(false)
      setCerradoInfo({
        cerrado_en: data.cerrado_en,
        inspector: data.inspector,
        cliente: data.cliente,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingCerrar(false)
    }
  }

  // ── Admin: marcar documento como revisado ─────────────────────────────────
  async function toggleDocRevisado(docId: string, actual: boolean) {
    const nuevo = !actual
    setDocsRevisados(prev => ({ ...prev, [docId]: nuevo }))
    try {
      await fetch('/api/expedientes/revisar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_id: docId, revisado: nuevo }),
      })
    } catch {
      // revertir en caso de error
      setDocsRevisados(prev => ({ ...prev, [docId]: actual }))
    }
  }

  // ── Admin: análisis IA cruzado ────────────────────────────────────────────
  async function handleRevisionIA() {
    setError(null)
    setLoadingIA(true)
    try {
      const r = await fetch('/api/expedientes/revision-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Error en análisis IA')
      setIaResult(data.resultado)
      setIaOpen(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingIA(false)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const docsRevisadosCount = Object.values(docsRevisados).filter(Boolean).length
  const todosRevisados = documentos.length > 0 && docsRevisadosCount === documentos.length

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA INSPECTOR
  // ─────────────────────────────────────────────────────────────────────────
  if (!esAdmin) {
    // Certificado emitido — proceso terminado
    if (status === 'cerrado') {
      return (
        <div className="rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-base">¡Certificado emitido!</h3>
              <p className="text-xs text-emerald-600">Proceso completado exitosamente</p>
            </div>
          </div>
          <p className="text-sm text-emerald-800">
            Tu expediente fue revisado, aprobado y el certificado fue emitido por administración.
            El proceso de inspección está cerrado.
          </p>
          {ultimoEnvio?.notas_revision && (
            <p className="mt-3 text-sm text-emerald-900 bg-white rounded-lg p-3 border border-emerald-200">
              <span className="font-medium">Nota del revisor:</span> {ultimoEnvio.notas_revision}
            </p>
          )}
        </div>
      )
    }

    // Ya aprobado (pendiente de emitir certificado)
    if (status === 'aprobado') {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Expediente Aprobado</h3>
          </div>
          <p className="text-sm text-green-700">
            El paquete documental fue revisado y aprobado. Administración emitirá el certificado en breve.
          </p>
          {ultimoEnvio?.notas_revision && (
            <p className="mt-2 text-sm text-green-800 bg-white rounded-lg p-3 border border-green-200">
              <span className="font-medium">Nota del revisor:</span> {ultimoEnvio.notas_revision}
            </p>
          )}
        </div>
      )
    }

    // En revisión
    if (status === 'revision') {
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">En Revisión</h3>
          </div>
          <p className="text-sm text-blue-700">
            Enviaste el expediente para revisión
            {ultimoEnvio?.enviado_en
              ? ` el ${new Date(ultimoEnvio.enviado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : '.'}
          </p>
          <p className="text-xs text-blue-600 mt-1">Tu responsable está revisando los documentos.</p>
          {ultimoEnvio?.notas_envio && (
            <p className="mt-2 text-xs text-blue-700">
              <span className="font-medium">Nota enviada:</span> {ultimoEnvio.notas_envio}
            </p>
          )}
        </div>
      )
    }

    // Rechazado — mostrar nota y permitir reenviar
    const fueRechazado = ultimoEnvio?.decision === 'rechazado'

    return (
      <div className="space-y-4">
        {fueRechazado && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-sm text-red-800">Paquete devuelto para correcciones</span>
            </div>
            {ultimoEnvio.notas_revision && (
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Motivo:</span> {ultimoEnvio.notas_revision}
              </p>
            )}
          </div>
        )}

        {/* Lista de documentos actuales */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Documentos a enviar ({documentos.length})
          </p>
          {documentos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              Sin documentos subidos. Sube los archivos en la sección "Documentos" antes de enviar.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {documentos.map(doc => (
                <li key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <FileCheck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs font-medium text-gray-500 w-28 shrink-0">
                    {TIPO_LABEL[doc.tipo] ?? doc.tipo}
                  </span>
                  <span className="truncate">{doc.nombre}</span>
                  {doc.publicUrl && (
                    <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-auto text-xs text-brand-green hover:underline shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nota y botón enviar */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nota para el revisor (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Indica algo relevante para quien revisará el paquete…"
            className="input-field text-sm w-full resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleEnviar}
          disabled={loading || documentos.length === 0}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {fueRechazado ? 'Reenviar para revisión' : 'Enviar para revisión'}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA ADMIN
  // ─────────────────────────────────────────────────────────────────────────
  const yaDecidido = status === 'aprobado' || (ultimoEnvio?.decision != null && status !== 'revision')

  return (
    <div className="space-y-5">

      {/* Estado del envío */}
      {ultimoEnvio ? (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          ultimoEnvio.decision === 'aprobado'
            ? 'bg-green-50 border-green-200'
            : ultimoEnvio.decision === 'rechazado'
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          {ultimoEnvio.decision === 'aprobado'
            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            : ultimoEnvio.decision === 'rechazado'
            ? <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            : <ClipboardCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {ultimoEnvio.decision === 'aprobado'
                ? 'Paquete aprobado'
                : ultimoEnvio.decision === 'rechazado'
                ? 'Paquete rechazado'
                : 'Pendiente de revisión'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Enviado el {new Date(ultimoEnvio.enviado_en).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
              {ultimoEnvio.notas_envio && ` · "${ultimoEnvio.notas_envio}"`}
            </p>
            {ultimoEnvio.notas_revision && (
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-medium">Nota de revisión:</span> {ultimoEnvio.notas_revision}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          El inspector aún no ha enviado este expediente para revisión.
        </div>
      )}

      {/* Tabla de documentos */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Documentos del expediente — {docsRevisadosCount}/{documentos.length} revisados
          </span>
          {todosRevisados && (
            <span className="text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
              ✓ Todos revisados
            </span>
          )}
        </div>
        {documentos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin documentos subidos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 font-medium text-gray-500">Documento</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-500">Tipo</th>
                <th className="text-center py-2.5 px-4 font-medium text-gray-500">Ver</th>
                <th className="text-center py-2.5 px-4 font-medium text-gray-500">Revisado</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => {
                const revisado = docsRevisados[doc.id] ?? false
                return (
                  <tr key={doc.id} className={`border-b border-gray-50 transition-colors ${
                    revisado ? 'bg-green-50/40' : 'hover:bg-gray-50'
                  }`}>
                    <td className="py-2.5 px-4 font-medium text-gray-800 max-w-[220px] truncate">
                      {doc.nombre}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="badge-en_revision text-xs">
                        {TIPO_LABEL[doc.tipo] ?? doc.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {doc.publicUrl ? (
                        <a
                          href={doc.publicUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => toggleDocRevisado(doc.id, revisado)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                          revisado
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400 bg-white'
                        }`}
                        title={revisado ? 'Marcar como no revisado' : 'Marcar como revisado'}
                      >
                        {revisado && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Botón revisión IA */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRevisionIA}
          disabled={loadingIA || documentos.length === 0}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
        >
          {loadingIA
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Brain className="w-4 h-4" />}
          {loadingIA ? 'Analizando…' : 'Revisión IA del paquete'}
        </button>
        <span className="text-xs text-gray-400">
          Claude analiza todos los documentos y detecta inconsistencias
        </span>
      </div>

      {/* Resultado IA */}
      {iaResult && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
          <button
            onClick={() => setIaOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-100/60 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">
                Resultado de Revisión IA —&nbsp;
                <span className={
                  iaResult.resultado === 'aprobado' ? 'text-green-700'
                  : iaResult.resultado === 'rechazado' ? 'text-red-700'
                  : 'text-orange-700'
                }>
                  {iaResult.resultado === 'aprobado' ? 'Sin observaciones'
                    : iaResult.resultado === 'rechazado' ? 'Requiere correcciones'
                    : 'Con observaciones'}
                </span>
              </span>
            </div>
            {iaOpen ? <ChevronUp className="w-4 h-4 text-purple-500" /> : <ChevronDown className="w-4 h-4 text-purple-500" />}
          </button>

          {iaOpen && (
            <div className="p-4 space-y-4">
              {/* Resumen */}
              <p className="text-sm text-purple-900">{iaResult.resumen}</p>

              {/* Alertas */}
              {iaResult.alertas?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                    Alertas ({iaResult.alertas.length})
                  </p>
                  {iaResult.alertas.map((a: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg border border-purple-100 p-3 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertNivel nivel={a.nivel} />
                        <span className="text-xs font-medium text-gray-500 capitalize">{a.categoria}</span>
                      </div>
                      <p className="text-sm text-gray-800">{a.descripcion}</p>
                      {a.accion_requerida && (
                        <p className="text-xs text-gray-500 italic">→ {a.accion_requerida}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Puntos OK */}
              {iaResult.puntos_ok?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                    Puntos correctos
                  </p>
                  <ul className="space-y-1">
                    {iaResult.puntos_ok.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documentos faltantes */}
              {iaResult.documentos_faltantes?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                    Documentos faltantes
                  </p>
                  <ul className="space-y-1">
                    {iaResult.documentos_faltantes.map((d: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                        <FileX className="w-3.5 h-3.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendación final */}
              {iaResult.recomendacion_final && (
                <div className="bg-purple-100 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Recomendación final</p>
                  <p className="text-sm text-purple-900">{iaResult.recomendacion_final}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Panel de decisión */}
      {!yaDecidido && status === 'revision' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Decisión de revisión</p>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Notas para el inspector (obligatorio si rechazas, opcional si apruebas)…"
            className="input-field text-sm w-full resize-none"
          />
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleDecision('aprobado')}
              disabled={!!loadingDecision}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loadingDecision === 'aprobado'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              Aprobar paquete
            </button>
            <button
              onClick={() => handleDecision('rechazado')}
              disabled={!!loadingDecision || !notas.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              title={!notas.trim() ? 'Escribe una nota antes de rechazar' : undefined}
            >
              {loadingDecision === 'rechazado'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RotateCcw className="w-4 h-4" />}
              Devolver para correcciones
            </button>
          </div>
          <p className="text-xs text-gray-400">Para rechazar debes escribir una nota explicando el motivo.</p>
        </div>
      )}

      {/* ── Bloque: Certificado emitido (solo admin, solo cuando aprobado) ── */}
      {esAdmin && status === 'aprobado' && !cerradoInfo && (
        <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Último paso: emitir el certificado</p>
              <p className="text-xs text-emerald-600">
                El paquete fue aprobado. Una vez emitido el certificado, el proceso queda cerrado.
              </p>
            </div>
          </div>

          {!confirmCerrar ? (
            <button
              onClick={() => setConfirmCerrar(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Award className="w-4 h-4" />
              Marcar certificado emitido
            </button>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                ¿Confirmas que el certificado fue emitido para el folio <span className="font-mono text-emerald-700">{folio}</span>?
              </p>
              <p className="text-xs text-gray-500">
                Esta acción cierra el expediente definitivamente y notifica al inspector y al cliente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCerrar}
                  disabled={loadingCerrar}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loadingCerrar
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  Sí, confirmar
                </button>
                <button
                  onClick={() => setConfirmCerrar(false)}
                  disabled={loadingCerrar}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Estado: certificado ya emitido ── */}
      {(status === 'cerrado' || cerradoInfo) && esAdmin && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Certificado emitido — expediente cerrado</p>
              {cerradoInfo?.cerrado_en && (
                <p className="text-xs text-emerald-600">
                  {new Date(cerradoInfo.cerrado_en).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Avisos de notificación */}
          {cerradoInfo && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avisar a:</p>

              {cerradoInfo.inspector.correo && (
                <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Inspector</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {cerradoInfo.inspector.nombre} &bull; {cerradoInfo.inspector.correo}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cerradoInfo.inspector.correo!)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-xs text-gray-400 hover:text-brand-green transition-colors flex items-center gap-1"
                    title="Copiar correo"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {cerradoInfo.cliente.correo && (
                <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {cerradoInfo.cliente.nombre} &bull; {cerradoInfo.cliente.correo}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cerradoInfo.cliente.correo!)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-xs text-gray-400 hover:text-brand-green transition-colors flex items-center gap-1"
                    title="Copiar correo"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {!cerradoInfo.inspector.correo && !cerradoInfo.cliente.correo && (
                <p className="text-xs text-gray-400 italic">
                  No hay correos registrados para este expediente.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {ToastEl}
    </div>
  )
}
