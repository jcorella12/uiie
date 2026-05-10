'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send, CheckCircle2, XCircle, Brain, Loader2, AlertTriangle,
  Info, ChevronDown, ChevronUp, Eye, FileCheck, FileX, RotateCcw,
  ClipboardCheck, Award, Copy, Check, Paperclip, Sparkles, ArrowDown,
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
  /** Si ya hay un certificado registrado en la sección Certificado CNE */
  certificadoEmitido?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  contrato:        'Contrato',
  plano:           'Plano',
  memoria_tecnica: 'Memoria Técnica',
  dictamen:        'Dictamen',
  acta:            'Acta',
  resolutivo:      'Resolutivo CFE',
  ficha_pago:      'Ficha de Pago',
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

const PRIORIDAD_LABEL: Record<number, string> = {
  1: 'P1 — Documentos faltantes',
  2: 'P2 — Razón social',
  3: 'P3 — Dirección',
  4: 'P4 — Capacidad',
  5: 'P5 — Lista DACG',
  6: 'P6 — Firmas',
  7: 'P7 — Ficha de pago',
  8: 'P8 — Aguas',
}

interface HallazgosBlockProps {
  titulo:    string
  color:     'red' | 'orange' | 'gray'
  hallazgos: any[]
  expedienteId: string
}

function HallazgosBlock({ titulo, color, hallazgos, expedienteId }: HallazgosBlockProps) {
  const colorMap = {
    red:    { box: 'bg-red-50 border-red-200',       text: 'text-red-900',    pill: 'bg-red-100 text-red-700' },
    orange: { box: 'bg-orange-50 border-orange-200', text: 'text-orange-900', pill: 'bg-orange-100 text-orange-700' },
    gray:   { box: 'bg-gray-50 border-gray-200',     text: 'text-gray-700',   pill: 'bg-gray-100 text-gray-600' },
  }[color]

  return (
    <div className="space-y-2">
      <p className={`text-xs font-bold uppercase tracking-wider ${colorMap.text}`}>{titulo}</p>
      <div className="space-y-2">
        {hallazgos.map((h, i) => (
          <div key={i} className={`rounded-lg border p-3 space-y-1 ${colorMap.box}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorMap.pill}`}>
                {PRIORIDAD_LABEL[h.prioridad] ?? `P${h.prioridad}`}
              </span>
              {h.documento_afectado && h.documento_afectado !== '—' && (
                <span className="text-[10px] font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {h.documento_afectado}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800">{h.descripcion}</p>
            {h.detalle && (h.detalle.valor_esperado || h.detalle.valor_encontrado) && (
              <div className="text-xs text-gray-600 bg-white/70 rounded px-2 py-1 mt-1 font-mono">
                {h.detalle.valor_esperado && <div>Esperado: <strong>{h.detalle.valor_esperado}</strong></div>}
                {h.detalle.valor_encontrado && <div>Encontrado: <strong>{h.detalle.valor_encontrado}</strong></div>}
              </div>
            )}
            {h.accion_requerida && (
              <p className="text-xs text-gray-600 italic">→ {h.accion_requerida}</p>
            )}
            {h.notificar_inspector && (
              <NotificarInspectorBtn expedienteId={expedienteId} hallazgo={h} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Botón funcional para notificar al inspector ──────────────────────────────
// Manda la pregunta vía email con botones de respuesta. El inspector
// responde sin necesidad de loguearse, y la respuesta queda registrada
// en la tabla expediente_notificaciones_inspector.

const TIPO_DEFAULT_PARA_CATEGORIA: Record<string, string> = {
  direccion:           'direccion',
  razon_social:        'razon_social',
  capacidad:           'capacidad',
  firmas:              'firmas',
  ficha_pago:          'ficha_pago',
  documentos_faltantes:'otro',
  dacg:                'otro',
  aguas:               'otro',
}

const PREGUNTA_DEFAULT: Record<string, string> = {
  direccion:    '¿La dirección que está actualmente en el expediente es correcta?',
  razon_social: '¿La razón social del expediente es la correcta?',
  capacidad:    '¿La capacidad del sistema en el expediente es la correcta?',
  firmas:       '¿Vas a obtener las firmas faltantes o procedemos sin ellas?',
  ficha_pago:   '¿El monto de la ficha de pago es el correcto?',
  otro:         '¿Cómo procedemos con este hallazgo?',
}

function NotificarInspectorBtn({ expedienteId, hallazgo }: { expedienteId: string; hallazgo: any }) {
  const [busy, setBusy]   = useState(false)
  const [done, setDone]   = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destino, setDestino] = useState<string | null>(null)

  async function notificar() {
    setBusy(true); setError(null)
    try {
      const tipo = TIPO_DEFAULT_PARA_CATEGORIA[hallazgo.categoria] ?? 'otro'
      const pregunta = PREGUNTA_DEFAULT[tipo] ?? 'Necesitamos tu confirmación.'
      const res = await fetch('/api/expedientes/notificar-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id:         expedienteId,
          tipo,
          prioridad:             hallazgo.prioridad,
          hallazgo_descripcion:  hallazgo.descripcion,
          pregunta_al_inspector: pregunta,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setDone(true)
      setDestino(data.destino?.nombre ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mt-1 inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3 h-3" />
        Notificación enviada{destino ? ` a ${destino}` : ''}
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <button
        type="button"
        onClick={notificar}
        disabled={busy}
        className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-3 py-1 disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        📨 Notificar al inspector
      </button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function RevisionSection({
  expedienteId,
  expedienteStatus,
  documentos,
  ultimoEnvio: ultimoEnvioInicial,
  esAdmin,
  folio,
  certificadoEmitido = false,
}: Props) {
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingDecision, setLoadingDecision] = useState<'aprobado' | 'rechazado' | null>(null)
  const { show: showToast, ToastEl } = useToast()
  const [loadingCerrar, setLoadingCerrar] = useState(false)
  const [confirmCerrar, setConfirmCerrar] = useState(false)
  // Datos del certificado al momento de emitir
  const [uuidCert,      setUuidCert     ] = useState('')
  const [uuidAcuse,     setUuidAcuse    ] = useState('')
  const [numCert,       setNumCert      ] = useState('')
  const [fechaCert,     setFechaCert    ] = useState('')
  const [archivoCert,   setArchivoCert  ] = useState<File | null>(null)
  const [archivoAcuse,  setArchivoAcuse ] = useState<File | null>(null)
  const fileCertRef  = useRef<HTMLInputElement>(null)
  const fileAcuseRef = useRef<HTMLInputElement>(null)
  // Lectura automática de PDF
  const [leyendoCert,    setLeyendoCert   ] = useState(false)
  const [certLeido,      setCertLeido     ] = useState(false)
  const [urlVerificacion, setUrlVerificacion] = useState<string | null>(null)
  const [cerradoInfo, setCerradoInfo] = useState<{
    cerrado_en: string
    inspector: { nombre: string | null; correo: string | null }
    cliente: { nombre: string | null; correo: string | null }
  } | null>(null)
  const [copiedId, setCopiedId] = useState<'inspector' | 'cliente' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ultimoEnvio, setUltimoEnvio] = useState<EnvioRevision | null>(ultimoEnvioInicial)
  const [status, setStatus] = useState(expedienteStatus)
  const [iaResult, setIaResult] = useState<any>(ultimoEnvioInicial?.revision_ia ?? null)
  const [iaOpen, setIaOpen] = useState(false)
  const [docsRevisados, setDocsRevisados] = useState<Record<string, boolean>>(
    Object.fromEntries(documentos.map(d => [d.id, d.revisado ?? false]))
  )

  // ── Auto-leer PDF del certificado cuando se sube ────────────────────────
  useEffect(() => {
    if (!archivoCert) {
      setCertLeido(false)
      setUrlVerificacion(null)
      return
    }
    if (!archivoCert.name.toLowerCase().endsWith('.pdf')) return

    let cancelled = false
    ;(async () => {
      setLeyendoCert(true)
      setCertLeido(false)
      setUrlVerificacion(null)
      try {
        const fd = new FormData()
        fd.append('file', archivoCert)
        const res = await fetch('/api/expedientes/certificado/leer', { method: 'POST', body: fd })
        if (cancelled) return
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        // Extraer UUID de url_verificacion si viene
        const urlCre: string | undefined = data.url_verificacion
        if (urlCre) {
          setUrlVerificacion(urlCre)
          const match = urlCre.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
          if (match && !uuidCert) setUuidCert(match[0])
        }
        if (data.numero_certificado && !numCert) setNumCert(data.numero_certificado)
        if (data.fecha_emision && !fechaCert) {
          // Convertir a yyyy-mm-dd si viene en otro formato
          const d = new Date(data.fecha_emision)
          if (!isNaN(d.getTime())) {
            setFechaCert(d.toISOString().split('T')[0])
          }
        }
        setCertLeido(true)
      } catch {
        // no bloqueamos
      } finally {
        if (!cancelled) setLeyendoCert(false)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivoCert])

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
  const CRE_BOVEDA = 'https://cre-boveda.azurewebsites.net/Api/Documento'
  function isValidUuid(s: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim())
  }
  function creUrl(uuid: string) {
    const u = uuid.trim()
    return `${CRE_BOVEDA}/${u}?nuevoNombre=${u}.pdf`
  }

  async function handleCerrar() {
    setError(null)
    setLoadingCerrar(true)
    try {
      // 1. Subir archivos PRIMERO para tener su storage_path
      async function subirArchivo(file: File, tipo: string): Promise<string | null> {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('tipo', tipo)
        fd.append('nombre', file.name)
        fd.append('expediente_id', expedienteId)
        const res = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
        if (!res.ok) return null
        const data = await res.json()
        return data.storage_path ?? null
      }
      const storagePathCert  = archivoCert  ? await subirArchivo(archivoCert,  'certificado_cre') : null
      const storagePathAcuse = archivoAcuse ? await subirArchivo(archivoAcuse, 'acuse_cre')       : null

      // 2. Registrar el certificado — acepta URL externa O archivo subido
      const tieneAlgo = uuidCert.trim() || certLeido || storagePathCert
      if (tieneAlgo) {
        const certRes = await fetch('/api/cre/certificados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero_certificado: numCert.trim() || uuidCert.trim() || folio || '—',
            url_cre:            urlVerificacion ?? (uuidCert.trim() ? creUrl(uuidCert) : null),
            url_acuse:          uuidAcuse.trim() ? creUrl(uuidAcuse) : null,
            storage_path_cert:  storagePathCert,
            storage_path_acuse: storagePathAcuse,
            fecha_emision:      fechaCert || null,
            expediente_id:      expedienteId,
          }),
        })
        const certData = await certRes.json()
        if (!certRes.ok) throw new Error(certData.error ?? 'Error al registrar el certificado')
      }

      // 3. Cerrar el expediente
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

      {/* Resultado IA — soporta el nuevo schema (SKILL UIIE) y el viejo */}
      {iaResult && (() => {
        // Normalizamos para detectar formato nuevo vs viejo
        const esFormatoNuevo = Array.isArray(iaResult.hallazgos)
        const recomendacion = iaResult.recomendacion_final ?? iaResult.resultado
        const recomendacionLabel =
          recomendacion === 'aprobar' || recomendacion === 'aprobado' ? 'Listo para aprobar'
          : recomendacion === 'rechazar' || recomendacion === 'rechazado' ? 'Requiere correcciones'
          : 'Con observaciones'
        const recomendacionColor =
          recomendacion === 'aprobar' || recomendacion === 'aprobado' ? 'text-green-700'
          : recomendacion === 'rechazar' || recomendacion === 'rechazado' ? 'text-red-700'
          : 'text-orange-700'

        // Bucketizar hallazgos por nivel (formato nuevo) o usar alertas (viejo)
        const hallazgos: any[] = esFormatoNuevo
          ? iaResult.hallazgos
          : (iaResult.alertas ?? []).map((a: any) => ({
              prioridad: a.nivel === 'error' ? 1 : a.nivel === 'advertencia' ? 4 : 8,
              categoria: a.categoria,
              nivel: a.nivel === 'error' ? 'critico' : a.nivel === 'advertencia' ? 'atencion' : 'aguas',
              descripcion: a.descripcion,
              accion_requerida: a.accion_requerida,
            }))

        const criticos = hallazgos.filter(h => h.nivel === 'critico').sort((a,b) => a.prioridad - b.prioridad)
        const atencion = hallazgos.filter(h => h.nivel === 'atencion').sort((a,b) => a.prioridad - b.prioridad)
        const aguas    = hallazgos.filter(h => h.nivel === 'aguas').sort((a,b) => a.prioridad - b.prioridad)

        return (
          <div className="rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
            <button
              onClick={() => setIaOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-purple-100/60 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-left">
                <Brain className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-sm font-semibold text-purple-800">
                  Resultado de Revisión IA —&nbsp;
                  <span className={recomendacionColor}>{recomendacionLabel}</span>
                </span>
                {hallazgos.length > 0 && (
                  <span className="text-xs text-purple-600">
                    · {criticos.length > 0 && `${criticos.length} críticos`}
                    {criticos.length > 0 && atencion.length > 0 && ', '}
                    {atencion.length > 0 && `${atencion.length} atención`}
                    {(criticos.length + atencion.length) > 0 && aguas.length > 0 && ', '}
                    {aguas.length > 0 && `${aguas.length} aguas`}
                  </span>
                )}
              </div>
              {iaOpen ? <ChevronUp className="w-4 h-4 text-purple-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-purple-500 shrink-0" />}
            </button>

            {iaOpen && (
              <div className="p-4 space-y-4">
                {/* Header datos del expediente (si vienen del nuevo formato) */}
                {esFormatoNuevo && (iaResult.folio || iaResult.cliente) && (
                  <div className="text-xs text-purple-700 font-mono bg-white/70 rounded-lg px-3 py-2 border border-purple-100">
                    {iaResult.folio && <span>Folio: <strong>{iaResult.folio}</strong></span>}
                    {iaResult.cliente && <span> · Cliente: <strong>{iaResult.cliente}</strong></span>}
                    {iaResult.fecha_visita && <span> · Visita: {iaResult.fecha_visita}</span>}
                  </div>
                )}

                {/* Resumen */}
                {iaResult.resumen && <p className="text-sm text-purple-900">{iaResult.resumen}</p>}

                {/* 🔴 Críticos (P1, P2, P5) */}
                {criticos.length > 0 && (
                  <HallazgosBlock
                    titulo="🔴 Prioridad alta"
                    color="red"
                    hallazgos={criticos}
                    expedienteId={expedienteId}
                  />
                )}

                {/* 🟡 Atención (P3, P4, P6, P7) */}
                {atencion.length > 0 && (
                  <HallazgosBlock
                    titulo="🟡 Requiere atención"
                    color="orange"
                    hallazgos={atencion}
                    expedienteId={expedienteId}
                  />
                )}

                {/* ⚠️ Aguas (P8) */}
                {aguas.length > 0 && (
                  <HallazgosBlock
                    titulo="⚠️ Aguas (alertas menores)"
                    color="gray"
                    hallazgos={aguas}
                    expedienteId={expedienteId}
                  />
                )}

                {/* Documentos */}
                {iaResult.documentos_faltantes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                      📂 Documentos faltantes
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

                {/* Puntos OK */}
                {iaResult.puntos_ok?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                      ✅ Sin observaciones
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
              </div>
            )}
          </div>
        )
      })()}

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

      {/* ── Bloque: Cerrar expediente (solo admin, solo cuando aprobado) ── */}
      {esAdmin && status === 'aprobado' && !cerradoInfo && (() => {
        // Detecta si el admin ya subió el archivo del certificado/acuse en
        // la sección "Documentos" (eso NO equivale a registrarlo — necesita
        // pasar por la sección "Certificado CNE" con número oficial).
        const docsCertSubidos = documentos.filter(d =>
          d.tipo === 'certificado_cre' || d.tipo === 'acuse_cre',
        )
        const subidoComoDoc = !certificadoEmitido && docsCertSubidos.length > 0

        return (
          <div className={`rounded-xl border-2 ${
            certificadoEmitido
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-300 bg-amber-50'
          } p-5 space-y-3`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                certificadoEmitido ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <Award className={`w-5 h-5 ${certificadoEmitido ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                {certificadoEmitido ? (
                  <>
                    <p className="font-semibold text-emerald-900 text-sm">Certificado registrado — listo para cerrar</p>
                    <p className="text-xs text-emerald-700">
                      El certificado ya está en la sección "Certificado CNE". Cierra el expediente para finalizar el proceso.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-900 text-sm">Falta registrar el certificado oficial</p>
                    <p className="text-xs text-amber-800 mt-1">
                      {subidoComoDoc ? (
                        <>
                          Detecté que ya subiste {docsCertSubidos.length === 1 ? 'un archivo' : `${docsCertSubidos.length} archivos`}{' '}
                          de tipo <strong>{docsCertSubidos.map(d => TIPO_LABEL[d.tipo]).join(' / ')}</strong>{' '}
                          en la sección Documentos. Eso es un respaldo, pero el sistema necesita el{' '}
                          <strong>número oficial CNE</strong> registrado en la sección Certificado CNE para
                          poder cerrar el expediente.
                        </>
                      ) : (
                        <>
                          Para cerrar el expediente hay que registrar el certificado con su <strong>número
                          oficial CNE</strong> en la sección Certificado CNE (no basta con subirlo como
                          documento de respaldo).
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>

            {!certificadoEmitido && (
              <a
                href="#certificado"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
              >
                <ArrowDown className="w-4 h-4" />
                Ir a registrar certificado
              </a>
            )}

            {certificadoEmitido && (
              <button
                onClick={handleCerrar}
                disabled={loadingCerrar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingCerrar
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Cerrando…</>
                  : <><CheckCircle2 className="w-4 h-4" /> Cerrar expediente</>}
              </button>
            )}
          </div>
        )
      })()}

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
                      setCopiedId('inspector')
                      setTimeout(() => setCopiedId(null), 2000)
                    }}
                    className="text-xs text-gray-400 hover:text-brand-green transition-colors flex items-center gap-1"
                    title="Copiar correo"
                  >
                    {copiedId === 'inspector' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
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
                      setCopiedId('cliente')
                      setTimeout(() => setCopiedId(null), 2000)
                    }}
                    className="text-xs text-gray-400 hover:text-brand-green transition-colors flex items-center gap-1"
                    title="Copiar correo"
                  >
                    {copiedId === 'cliente' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
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
