'use client'

import { useState, useRef } from 'react'
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle, QrCode,
  Trash2, Shield, Upload, ChevronUp, ChevronDown,
  ChevronsUpDown, FileText, Download, Link2,
} from 'lucide-react'

// ─── Constante de la bóveda CRE ──────────────────────────────────────────────
const CRE_BOVEDA = 'https://cre-boveda.azurewebsites.net/Api/Documento'

function creUrl(uuid: string): string {
  const u = uuid.trim()
  if (!u) return ''
  return `${CRE_BOVEDA}/${u}?nuevoNombre=${u}.pdf`
}

function extractUuid(url: string | null): string {
  if (!url) return ''
  const m = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  return m ? m[1] : ''
}

function isValidUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim())
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Certificado {
  id: string
  numero_certificado: string
  titulo: string | null
  url_cre: string
  url_acuse: string | null
  url_qr: string | null
  resumen_acta: string | null
  fecha_emision: string | null
  created_at: string
  expediente: {
    id: string
    numero_folio: string
    ciudad: string | null
    estado_mx: string | null
    nombre_cliente_final: string | null
    inspector: { nombre: string; apellidos: string | null } | null
    cliente: { nombre: string } | null
  } | null
}

type SortKey = 'numero_folio' | 'numero_certificado' | 'cliente_final' | 'cliente' | 'inspector' | 'fecha' | 'ciudad'
type SortDir = 'asc' | 'desc'

interface Props {
  certificados: Certificado[]
  esStaff: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function inspectorNombre(insp: { nombre: string; apellidos: string | null } | null) {
  if (!insp) return '—'
  return [insp.nombre, insp.apellidos].filter(Boolean).join(' ')
}

function getCellValue(cert: Certificado, key: SortKey): string {
  switch (key) {
    case 'numero_folio':       return cert.expediente?.numero_folio ?? ''
    case 'numero_certificado': return cert.numero_certificado ?? ''
    case 'cliente_final':      return cert.expediente?.nombre_cliente_final ?? ''
    case 'cliente':            return cert.expediente?.cliente?.nombre ?? ''
    case 'inspector':          return inspectorNombre(cert.expediente?.inspector ?? null)
    case 'fecha':              return cert.fecha_emision ?? cert.created_at ?? ''
    case 'ciudad':             return [cert.expediente?.ciudad, cert.expediente?.estado_mx].filter(Boolean).join(', ')
    default: return ''
  }
}

// ─── Formulario de nuevo certificado ─────────────────────────────────────────
type Step = 'choose' | 'uuid' | 'reading' | 'review' | 'saving'

const EMPTY_FORM = {
  numero_certificado: '',
  titulo:             '',
  uuid_cert:          '',
  uuid_acuse:         '',
  url_cre:            '',   // URL final resuelta (bóveda o storage)
  url_acuse:          '',
  url_qr:             '',
  resumen_acta:       '',
  fecha_emision:      '',
  expediente_id:      '',
  // Campos leídos por IA — solo para mostrar en UI, no van a la DB directamente
  ai_folio_interno:   '',
  ai_inspector:       '',
  ai_razon_social:    '',
  ai_expediente_folio: '',   // folio del expediente encontrado en DB
}

function SubirCertificadoForm({ onAdded }: { onAdded: (cert: Certificado) => void }) {
  const [open,     setOpen]     = useState(false)
  const [step,     setStep]     = useState<Step>('choose')
  const [loading,  setLoading]  = useState<string | null>(null)  // mensaje de carga
  const [error,    setError]    = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))
  const setFV = (k: keyof typeof form) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  function close() {
    setOpen(false)
    setStep('choose')
    setError(null)
    setLoading(null)
    setForm(EMPTY_FORM)
  }

  // ── Descarga + lectura IA desde UUID ───────────────────────────────────────
  async function descargarYLeer() {
    const uuid = form.uuid_cert.trim()
    if (!uuid) { setError('Ingresa el UUID del certificado'); return }
    if (!isValidUuid(uuid)) { setError('El UUID no tiene el formato correcto'); return }

    setError(null)
    setLoading('Descargando PDF desde la bóveda CRE…')
    setStep('reading')

    try {
      const res  = await fetch('/api/cre/certificados/descargar-leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, tipo: 'certificado' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al descargar')

      const d        = json.data ?? {}
      const finalUrl = json.url_storage ?? json.url_boveda ?? creUrl(uuid)

      setForm(prev => ({
        ...prev,
        numero_certificado:  d.numero_certificado  ?? prev.numero_certificado,
        titulo:              d.razon_social         ? `Certificado — ${d.razon_social}` : prev.titulo,
        fecha_emision:       d.fecha_emision        ?? prev.fecha_emision,
        url_cre:             finalUrl,
        expediente_id:       json.expediente_id     ?? prev.expediente_id,
        ai_folio_interno:    d.folio_interno        ?? '',
        ai_inspector:        d.inspector            ?? '',
        ai_razon_social:     d.razon_social         ?? '',
        ai_expediente_folio: json.expediente_folio  ?? '',
      }))
      setStep('review')
    } catch (err: any) {
      setError(err.message ?? 'Error')
      setStep('uuid')
    } finally {
      setLoading(null)
    }
  }

  // ── También descargar acuse si se puso UUID ─────────────────────────────────
  async function descargarAcuse() {
    const uuid = form.uuid_acuse.trim()
    if (!uuid || !isValidUuid(uuid)) { setError('UUID del acuse no válido'); return }

    setError(null)
    setLoading('Descargando acuse…')
    try {
      const res  = await fetch('/api/cre/certificados/descargar-leer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, tipo: 'acuse' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al descargar acuse')
      const finalUrl = json.url_storage ?? json.url_boveda ?? creUrl(uuid)
      setFV('url_acuse')(finalUrl)
    } catch (err: any) {
      setError(err.message ?? 'Error')
    } finally {
      setLoading(null)
    }
  }

  // ── Lectura desde PDF subido manualmente ───────────────────────────────────
  async function handleFile(file: File) {
    if (!file || file.type !== 'application/pdf') { setError('Solo se aceptan archivos PDF'); return }
    setError(null)
    setLoading('Leyendo PDF con IA…')
    setStep('reading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/expedientes/certificado/leer', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al leer PDF')
      const d           = json.data ?? {}
      const extractedId = extractUuid(d.url_verificacion ?? '')
      setForm(prev => ({
        ...prev,
        numero_certificado:  d.numero_certificado  ?? prev.numero_certificado,
        titulo:              d.razon_social         ? `Certificado — ${d.razon_social}` : prev.titulo,
        fecha_emision:       d.fecha_emision        ?? prev.fecha_emision,
        uuid_cert:           extractedId             || prev.uuid_cert,
        url_cre:             extractedId ? creUrl(extractedId) : (d.url_verificacion ?? prev.url_cre),
        expediente_id:       json.expediente_id     ?? prev.expediente_id,
        ai_folio_interno:    d.folio_interno        ?? '',
        ai_inspector:        d.inspector            ?? '',
        ai_razon_social:     d.razon_social         ?? '',
        ai_expediente_folio: json.expediente_folio  ?? '',
      }))
      setStep('review')
    } catch (err: any) {
      setError(err.message ?? 'Error')
      setStep('choose')
    } finally {
      setLoading(null)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Resolver URL final: si hay uuid_cert y url_cre vacía, generarla
    const url_cre   = form.url_cre.trim()   || creUrl(form.uuid_cert)
    const url_acuse = form.url_acuse.trim() || creUrl(form.uuid_acuse) || null

    if (!form.numero_certificado.trim() || !url_cre) {
      setError('El número de certificado y el UUID/URL del certificado son obligatorios')
      return
    }
    setStep('saving')
    setError(null)
    try {
      const res = await fetch('/api/cre/certificados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_certificado: form.numero_certificado.trim(),
          titulo:             form.titulo.trim()        || null,
          url_cre,
          url_acuse,
          url_qr:             form.url_qr.trim()        || null,
          resumen_acta:       form.resumen_acta.trim()  || null,
          fecha_emision:      form.fecha_emision        || null,
          expediente_id:      form.expediente_id.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onAdded(data.certificado)
      close()
    } catch (err: any) {
      setError(err.message ?? 'Error de conexión')
      setStep('review')
    }
  }

  // ── Render trigger ─────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 btn-primary text-sm">
        <Plus className="w-4 h-4" /> Agregar certificado
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg">Nuevo certificado CNE</h3>
          <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── CHOOSE: 2 opciones ───────────────────────────────────────── */}
          {step === 'choose' && (
            <>
              <p className="text-sm text-gray-500">¿Cómo quieres agregar el certificado?</p>
              <div className="grid grid-cols-2 gap-3">

                {/* Subir PDF */}
                <div
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors text-center ${
                    dragOver ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-brand-green/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Subir PDF</p>
                    <p className="text-xs text-gray-400 mt-0.5">La IA extrae los datos del archivo</p>
                  </div>
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                </div>

                {/* Agregar UUID */}
                <button type="button" onClick={() => setStep('uuid')}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6 cursor-pointer transition-colors text-center hover:border-blue-400/60 hover:bg-blue-50/40"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Agregar UUID</p>
                    <p className="text-xs text-gray-400 mt-0.5">Descarga y lee desde la bóveda CRE</p>
                  </div>
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </>
          )}

          {/* ── UUID: pegar UUID y descargar ──────────────────────────────── */}
          {step === 'uuid' && (
            <div className="space-y-4">
              <button type="button" onClick={() => { setStep('choose'); setError(null) }}
                className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>

              <div>
                <label className="label">UUID del certificado *</label>
                <p className="text-xs text-gray-400 mb-1.5">
                  Pega el identificador del certificado en la bóveda CRE
                </p>
                <input
                  className="input-field font-mono text-xs"
                  value={form.uuid_cert}
                  onChange={e => setFV('uuid_cert')(e.target.value.trim())}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  autoFocus
                />
                {form.uuid_cert && !isValidUuid(form.uuid_cert) && (
                  <p className="text-xs text-amber-500 mt-1">Formato de UUID inválido</p>
                )}
                {form.uuid_cert && isValidUuid(form.uuid_cert) && (
                  <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                    → {creUrl(form.uuid_cert)}
                  </p>
                )}
              </div>

              <div>
                <label className="label">UUID del acuse <span className="font-normal text-gray-400">(opcional)</span></label>
                <input
                  className="input-field font-mono text-xs"
                  value={form.uuid_acuse}
                  onChange={e => setFV('uuid_acuse')(e.target.value.trim())}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <button
                type="button"
                onClick={descargarYLeer}
                disabled={!form.uuid_cert || !isValidUuid(form.uuid_cert)}
                className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Descargar y leer
              </button>
            </div>
          )}

          {/* ── READING: spinner ─────────────────────────────────────────── */}
          {step === 'reading' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
              <p className="text-sm text-gray-600 font-medium">{loading ?? 'Procesando…'}</p>
              <p className="text-xs text-gray-400">Esto puede tardar unos segundos</p>
            </div>
          )}

          {/* ── REVIEW: formulario completo ───────────────────────────────── */}
          {(step === 'review' || step === 'saving') && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Éxito lectura */}
              {form.numero_certificado && (
                <div className="flex items-center gap-2 text-sm text-brand-green bg-brand-green/5 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Datos leídos. Revisa y completa antes de guardar.</span>
                </div>
              )}

              {/* Datos extraídos por IA */}
              {(form.ai_folio_interno || form.ai_inspector || form.ai_razon_social) && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Datos leídos del certificado</p>

                  {form.ai_folio_interno && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400 w-28 shrink-0">Folio interno</span>
                      {form.ai_expediente_folio && form.expediente_id ? (
                        <a
                          href={`/dashboard/inspector/expedientes/${form.expediente_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                        >
                          {form.ai_expediente_folio}
                          <CheckCircle2 className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-gray-700">{form.ai_folio_interno}
                          <span className="ml-1 text-amber-500 font-normal">(expediente no encontrado)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {form.ai_razon_social && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400 w-28 shrink-0">Cliente final</span>
                      <span className="text-xs text-gray-700">{form.ai_razon_social}</span>
                    </div>
                  )}

                  {form.ai_inspector && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400 w-28 shrink-0">Inspector</span>
                      <span className="text-xs text-gray-700">{form.ai_inspector}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Número + Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Número de certificado *</label>
                  <input className="input-field font-mono" value={form.numero_certificado}
                    onChange={setF('numero_certificado')} placeholder="UIIE-CC-02311-2026" required />
                </div>
                <div>
                  <label className="label">Fecha de emisión</label>
                  <input className="input-field" type="date" value={form.fecha_emision} onChange={setF('fecha_emision')} />
                </div>
                <div>
                  <label className="label">
                    Expediente
                    {form.ai_expediente_folio && form.expediente_id && (
                      <span className="ml-2 text-brand-green font-normal text-xs">✓ vinculado</span>
                    )}
                  </label>
                  <input className="input-field font-mono text-xs" value={form.expediente_id}
                    onChange={setF('expediente_id')} placeholder="UUID del expediente" />
                </div>
              </div>

              <div>
                <label className="label">Título / Descripción</label>
                <input className="input-field" value={form.titulo} onChange={setF('titulo')}
                  placeholder="Ej. Certificado — Nombre del cliente" />
              </div>

              {/* URL resuelta del certificado */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificado</p>
                <div className="flex items-start gap-1.5">
                  <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {form.url_cre || creUrl(form.uuid_cert) || '—'}
                  </span>
                </div>
                {form.url_cre && form.url_cre.includes('supabase') && (
                  <p className="text-xs text-brand-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Copia guardada en nuestro storage
                  </p>
                )}
              </div>

              {/* Acuse */}
              {(form.uuid_acuse || form.url_acuse) && (
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Acuse</p>
                    {form.uuid_acuse && !form.url_acuse && (
                      <button type="button" onClick={descargarAcuse}
                        disabled={!!loading}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Descargar acuse
                      </button>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-300" />
                    <span className="font-mono text-xs text-gray-600 break-all">
                      {form.url_acuse || creUrl(form.uuid_acuse) || '—'}
                    </span>
                  </div>
                  {form.url_acuse && form.url_acuse.includes('supabase') && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Copia guardada en nuestro storage
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Notas / Resumen del acta</label>
                <textarea className="input-field resize-none" rows={3} value={form.resumen_acta}
                  onChange={setF('resumen_acta')} placeholder="Resumen del acta o notas relevantes…" />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={step === 'saving'}
                  className="btn-primary flex items-center gap-2 text-sm">
                  {step === 'saving'
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
                    : <><CheckCircle2 className="w-4 h-4" />Guardar certificado</>
                  }
                </button>
                <button type="button" onClick={() => { setStep('choose'); setError(null) }}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  ← Volver
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Sort header ──────────────────────────────────────────────────────────────
function SortTh({
  label, sortKey, current, dir, onClick,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onClick: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-gray-800 group"
      onClick={() => onClick(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? (dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-brand-green" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-green" />)
          : <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60" />
        }
      </span>
    </th>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CertificadosCRE({ certificados: initial, esStaff }: Props) {
  const [certs,      setCerts]      = useState<Certificado[]>(initial)
  const [sortKey,    setSortKey]    = useState<SortKey>('fecha')
  const [sortDir,    setSortDir]    = useState<SortDir>('desc')
  const [search,     setSearch]     = useState('')
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  function handleAdded(cert: Certificado) { setCerts(prev => [cert, ...prev]) }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleDelete(id: string) {
    if (confirmDel !== id) { setConfirmDel(id); return }
    setDeleting(id)
    try {
      const res = await fetch('/api/cre/certificados', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { setCerts(prev => prev.filter(c => c.id !== id)); setConfirmDel(null) }
    } finally { setDeleting(null) }
  }

  const q        = search.toLowerCase().trim()
  const filtered = q
    ? certs.filter(c =>
        c.numero_certificado?.toLowerCase().includes(q) ||
        c.expediente?.numero_folio?.toLowerCase().includes(q) ||
        c.expediente?.nombre_cliente_final?.toLowerCase().includes(q) ||
        c.expediente?.cliente?.nombre?.toLowerCase().includes(q) ||
        inspectorNombre(c.expediente?.inspector ?? null).toLowerCase().includes(q) ||
        c.expediente?.ciudad?.toLowerCase().includes(q)
      )
    : certs

  const sorted = [...filtered].sort((a, b) => {
    const cmp = getCellValue(a, sortKey).localeCompare(getCellValue(b, sortKey), 'es', { sensitivity: 'base' })
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="p-6 sm:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados CNE</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comisión Nacional de Energía · {certs.length} certificado{certs.length !== 1 ? 's' : ''} registrado{certs.length !== 1 ? 's' : ''}
          </p>
        </div>
        {esStaff && <SubirCertificadoForm onAdded={handleAdded} />}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por folio, número, cliente, inspector…"
          className="input-field max-w-sm text-sm" />
        {search && (
          <span className="text-xs text-gray-400">
            {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="font-medium text-gray-600">
            {search ? 'Sin resultados para esta búsqueda' : 'Sin certificados registrados'}
          </p>
          {esStaff && !search && (
            <p className="text-sm mt-1">Agrega el primer certificado con el botón de arriba.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortTh label="Folio interno"    sortKey="numero_folio"       current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Núm. certificado" sortKey="numero_certificado" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Cliente Final"    sortKey="cliente_final"      current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Cliente (EPC)"    sortKey="cliente"            current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Inspector"        sortKey="inspector"          current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Fecha generación" sortKey="fecha"              current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortTh label="Ciudad y Estado"  sortKey="ciudad"             current={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descargas</th>
                {esStaff && <th className="px-3 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sorted.map(cert => {
                const isDel     = deleting   === cert.id
                const isConf    = confirmDel === cert.id
                const ciudadEst = [cert.expediente?.ciudad, cert.expediente?.estado_mx].filter(Boolean).join(', ')

                return (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-3 py-3 whitespace-nowrap">
                      {cert.expediente
                        ? <a href={`/dashboard/inspector/expedientes/${cert.expediente.id}`}
                            className="font-mono text-xs font-bold text-brand-green hover:underline">
                            {cert.expediente.numero_folio}
                          </a>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-800">{cert.numero_certificado}</span>
                    </td>

                    <td className="px-3 py-3 max-w-[180px]">
                      <span className="text-gray-700 text-xs leading-tight line-clamp-2">
                        {cert.expediente?.nombre_cliente_final || <span className="text-gray-300">—</span>}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-gray-600 text-xs">
                        {cert.expediente?.cliente?.nombre || <span className="text-gray-300">—</span>}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-gray-600 text-xs">{inspectorNombre(cert.expediente?.inspector ?? null)}</span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                      {fmtDate(cert.fecha_emision ?? cert.created_at)}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                      {ciudadEst || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Descargas */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <a href={cert.url_cre} target="_blank" rel="noopener noreferrer"
                          title="Descargar certificado"
                          className="flex items-center gap-1 px-2 py-1 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors">
                          <Download className="w-3 h-3" /> Cert.
                        </a>
                        {cert.url_acuse && (
                          <a href={cert.url_acuse} target="_blank" rel="noopener noreferrer"
                            title="Descargar acuse de recibo"
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            <Download className="w-3 h-3" /> Acuse
                          </a>
                        )}
                        {cert.url_qr && (
                          <a href={cert.url_qr} target="_blank" rel="noopener noreferrer"
                            title="Link del QR"
                            className="p-1 rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-green/10 transition-colors">
                            <QrCode className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {cert.resumen_acta && (
                          <span title={cert.resumen_acta}
                            className="p-1 rounded-lg text-gray-300 hover:text-gray-500 cursor-help">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {esStaff && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button type="button" onClick={() => handleDelete(cert.id)} disabled={isDel}
                          title={isConf ? 'Clic para confirmar eliminación' : 'Eliminar'}
                          className={`p-1 rounded-lg transition-colors ${
                            isConf ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                          }`}>
                          {isDel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
