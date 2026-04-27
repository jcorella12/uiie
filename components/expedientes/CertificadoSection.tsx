'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award, Pencil, CheckCircle, X, Loader2, Eye, Sparkles, AlertTriangle,
  Download, ExternalLink,
} from 'lucide-react'
import SubirDocumentoForm from './SubirDocumentoForm'
import { formatDate } from '@/lib/utils'

interface DocumentoCert {
  id: string
  nombre: string
  tipo: string
  created_at: string
  tamano_bytes: number | null
  publicUrl: string | null
}

// Certificado registrado en la sección CNE del admin
interface CertCNE {
  id: string
  numero_certificado: string
  fecha_emision: string | null
  url_cre: string
  url_acuse: string | null
}

interface Props {
  expedienteId: string
  numeroCertificado: string | null
  fechaEmision: string | null       // "YYYY-MM-DD"
  documentosCert: DocumentoCert[]   // tipo='certificado_cre' o 'acuse_cre'
  canEdit: boolean
  certificadosCNE?: CertCNE[]       // de la tabla certificados_cre
}

export default function CertificadoSection({
  expedienteId,
  numeroCertificado,
  fechaEmision,
  documentosCert,
  canEdit,
  certificadosCNE = [],
}: Props) {
  const router       = useRouter()
  const fileIARef    = useRef<HTMLInputElement>(null)

  const [editando,   setEditando]   = useState(false)
  const [numero,     setNumero]     = useState(numeroCertificado ?? '')
  const [fecha,      setFecha]      = useState(fechaEmision ?? '')
  const [saving,     setSaving]     = useState(false)
  const [leyendo,    setLeyendo]    = useState(false)
  const [msg,        setMsg]        = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [iaPreview,  setIaPreview]  = useState<Record<string, string> | null>(null)

  // ── Leer certificado con IA ──────────────────────────────────────────────────
  async function leerConIA(file: File) {
    setLeyendo(true)
    setMsg(null)
    setIaPreview(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/expedientes/certificado/leer', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: json.error ?? 'Error al leer el PDF' }); return }

      const d = json.data
      // Pre-fill the form fields
      if (d.numero_certificado) setNumero(d.numero_certificado)
      if (d.fecha_emision)      setFecha(d.fecha_emision)
      setIaPreview(d)
      setEditando(true)
    } catch {
      setMsg({ type: 'err', text: 'Error inesperado al analizar el certificado.' })
    } finally {
      setLeyendo(false)
      if (fileIARef.current) fileIARef.current.value = ''
    }
  }

  // ── Guardar datos ────────────────────────────────────────────────────────────
  async function guardar() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/expedientes/certificado', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id:             expedienteId,
          numero_certificado:        numero.trim() || null,
          fecha_emision_certificado: fecha || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Error al guardar' }); return }
      setMsg({ type: 'ok', text: 'Guardado correctamente.' })
      setEditando(false)
      setIaPreview(null)
      router.refresh()
    } catch {
      setMsg({ type: 'err', text: 'Error inesperado.' })
    } finally {
      setSaving(false)
    }
  }

  function cancelar() {
    setNumero(numeroCertificado ?? '')
    setFecha(fechaEmision ?? '')
    setEditando(false)
    setIaPreview(null)
    setMsg(null)
  }

  const certDocs  = documentosCert.filter(d => d.tipo === 'certificado_cre')
  const acuseDocs = documentosCert.filter(d => d.tipo === 'acuse_cre')
  const tieneCert = !!numeroCertificado

  return (
    <div className="space-y-6">

      {/* ── Certificados registrados en la bóveda CNE ── */}
      {certificadosCNE.length > 0 && (
        <div className="space-y-3">
          {certificadosCNE.map(cert => (
            <div key={cert.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-green/5 border border-brand-green/20 rounded-xl px-4 py-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-green shrink-0" />
                  <span className="font-mono text-sm font-bold text-brand-green tracking-wide">
                    {cert.numero_certificado}
                  </span>
                </div>
                {cert.fecha_emision && (
                  <p className="text-xs text-gray-500 ml-6">
                    Emitido el {formatDate(cert.fecha_emision)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-6 sm:ml-0">
                <a
                  href={cert.url_cre}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Certificado
                </a>
                {cert.url_acuse && (
                  <a
                    href={cert.url_acuse}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Acuse
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Datos del certificado ── */}
      <div className="space-y-4">

        {/* Botones de acción (vista normal) */}
        {canEdit && !editando && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Leer con IA */}
            <label className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors border
              ${leyendo
                ? 'bg-purple-50 text-purple-400 border-purple-200 cursor-not-allowed'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              {leyendo
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando…</>
                : <><Sparkles className="w-3.5 h-3.5" /> Leer PDF con IA</>
              }
              <input
                ref={fileIARef}
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={leyendo}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) leerConIA(f)
                }}
              />
            </label>

            {/* Editar manual */}
            <button
              onClick={() => setEditando(true)}
              className="btn-outline flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <Pencil className="w-3.5 h-3.5" />
              {tieneCert ? 'Editar' : 'Ingresar manualmente'}
            </button>
          </div>
        )}

        {/* Preview de datos extraídos por IA */}
        {iaPreview && editando && (
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-xs text-purple-700">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Datos extraídos por IA — revisa y confirma:</p>
              <ul className="space-y-0.5">
                {iaPreview.numero_certificado && <li>• Certificado: <span className="font-mono font-bold">{iaPreview.numero_certificado}</span></li>}
                {iaPreview.fecha_emision      && <li>• Fecha: <span className="font-semibold">{iaPreview.fecha_emision}</span></li>}
                {iaPreview.folio_interno      && <li>• Folio interno: <span className="font-mono">{iaPreview.folio_interno}</span></li>}
                {iaPreview.solicitante        && <li>• Solicitante: {iaPreview.solicitante}</li>}
                {iaPreview.ciudad             && <li>• Ciudad: {iaPreview.ciudad}, {iaPreview.estado}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Formulario de edición */}
        {editando ? (
          <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Número de certificado CNE (CC)</label>
                <input
                  type="text"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  placeholder="Ej. UIIE-CC-00040-2026"
                  className="input-field font-mono"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="label">Fecha de emisión</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {msg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                msg.type === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {msg.type === 'ok'
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                {msg.text}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={guardar} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                  : <><CheckCircle className="w-4 h-4" /> Guardar</>}
              </button>
              <button onClick={cancelar} disabled={saving} className="btn-outline flex items-center gap-1.5 text-sm py-1.5">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Vista de solo lectura */
          <div className="divide-y divide-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-3 border-b border-gray-50">
              <span className="text-xs font-medium text-gray-500 sm:w-44 shrink-0 pt-0.5">
                Núm. certificado CNE (CC)
              </span>
              {numeroCertificado ? (
                <span className="font-mono text-sm font-semibold text-brand-green tracking-wide">
                  {numeroCertificado}
                </span>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin registrar</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-3">
              <span className="text-xs font-medium text-gray-500 sm:w-44 shrink-0 pt-0.5">
                Fecha de emisión
              </span>
              {fechaEmision ? (
                <span className="text-sm text-gray-800">{formatDate(fechaEmision)}</span>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin registrar</span>
              )}
            </div>
          </div>
        )}

        {/* Feedback fuera de edición */}
        {!editando && msg?.type === 'ok' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {msg.text}
          </div>
        )}
      </div>

      {/* ── Archivos del certificado ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Archivos del certificado
        </p>

        {/* Certificado CNE */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Certificado CNE
            </p>
          </div>
          {certDocs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {certDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-gray-400 italic">Sin archivo subido</p>
          )}
        </div>

        {/* Acuse CNE */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Acuse CNE
            </p>
          </div>
          {acuseDocs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {acuseDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-gray-400 italic">Sin archivo subido</p>
          )}
        </div>
      </div>

      {/* ── Subir archivos ── */}
      {canEdit && (
        <SubirDocumentoForm
          expedienteId={expedienteId}
          tiposPermitidos={['certificado_cre', 'acuse_cre']}
          tipoDefecto="certificado_cre"
          tituloSeccion="Subir certificado o acuse"
        />
      )}
    </div>
  )
}

function DocRow({ doc }: { doc: DocumentoCert }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 font-medium truncate">{doc.nombre}</p>
        <p className="text-xs text-gray-400">
          {doc.created_at
            ? new Date(doc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''}
          {doc.tamano_bytes != null && ` · ${(doc.tamano_bytes / 1024).toFixed(0)} KB`}
        </p>
      </div>
      {doc.publicUrl && (
        <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium flex-shrink-0"
        >
          <Eye className="w-3.5 h-3.5" /> Ver
        </a>
      )}
    </div>
  )
}
