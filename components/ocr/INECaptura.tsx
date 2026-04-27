'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ScanLine, Upload, CheckCircle2, AlertTriangle,
  Loader2, Eye, RotateCcw, Save, CreditCard, FileText,
  Download, ExternalLink,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface OCRResult {
  nombre: string | null
  curp: string | null
  clave_elector: string | null
  vigencia: string | null
  domicilio_calle: string | null
  domicilio_colonia: string | null
  domicilio_cp: string | null
  domicilio_municipio: string | null
  domicilio_estado: string | null
  numero_ine: string | null
}

interface Props {
  entityType: 'cliente' | 'testigo'
  entityId?: string                    // opcional: si falta, solo OCR sin guardar
  savedData?: {
    ine_url_frente?: string | null
    ine_url_reverso?: string | null
    ocr_nombre?: string | null
    ocr_curp?: string | null
    ocr_clave_elector?: string | null
    ocr_vigencia?: string | null
    ocr_domicilio?: string | null
    ocr_numero_ine?: string | null
  }
  onSaved?: (data: OCRResult) => void
}

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

// ─── Visor de INE guardada en Storage ────────────────────────────────────────

function INEViewer({ pathFrente, pathReverso }: { pathFrente?: string | null; pathReverso?: string | null }) {
  const supabase = createClient()
  const [urlFrente,  setUrlFrente]  = useState<string | null>(null)
  const [urlReverso, setUrlReverso] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'inline' | 'nueva-pestana'>('inline')

  // ¿Son el mismo archivo? (PDF con ambas caras)
  const mismoPDF = pathFrente && pathReverso && pathFrente === pathReverso
  const esPDFFrente  = pathFrente?.endsWith('.pdf')
  const esPDFReverso = pathReverso?.endsWith('.pdf')

  useEffect(() => {
    async function fetchUrls() {
      setLoading(true)
      const BUCKET = 'documentos'
      const TTL = 60 * 60 // 1 hora

      if (pathFrente) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(pathFrente, TTL)
        if (data?.signedUrl) setUrlFrente(data.signedUrl)
      }
      if (pathReverso && !mismoPDF) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(pathReverso, TTL)
        if (data?.signedUrl) setUrlReverso(data.signedUrl)
      } else if (mismoPDF) {
        // misma URL para ambos lados
        setUrlReverso(urlFrente)
      }
      setLoading(false)
    }
    fetchUrls()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathFrente, pathReverso])

  if (!pathFrente && !pathReverso) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando archivo guardado…
      </div>
    )
  }

  // ── Determinar qué mostrar ───────────────────────────────────────────────────
  const archivos: { label: string; url: string; esPDF: boolean }[] = []
  if (urlFrente) {
    archivos.push({
      label: mismoPDF ? 'INE (frente y reverso)' : 'Frente',
      url: urlFrente,
      esPDF: !!(esPDFFrente || mismoPDF),
    })
  }
  if (urlReverso && !mismoPDF && urlReverso !== urlFrente) {
    archivos.push({ label: 'Reverso', url: urlReverso, esPDF: !!esPDFReverso })
  }

  if (!archivos.length) return null

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-brand-green" />
          Archivo INE guardado
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVistaActiva(v => v === 'inline' ? 'nueva-pestana' : 'inline')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {vistaActiva === 'inline' ? 'Abrir en pestaña' : 'Ver aquí'}
          </button>
        </div>
      </div>

      {archivos.map(({ label, url, esPDF }) => (
        <div key={label}>
          {archivos.length > 1 && (
            <p className="px-4 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
          )}

          {vistaActiva === 'inline' ? (
            esPDF ? (
              <div className="relative">
                <embed
                  src={url}
                  type="application/pdf"
                  className="w-full"
                  style={{ height: '480px' }}
                />
                {/* Fallback si el browser bloquea embed */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 to-transparent pt-6 pb-3 px-4 flex justify-center">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-green hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir PDF en nueva pestaña
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <img
                  src={url}
                  alt={label}
                  className="w-full rounded-lg object-contain max-h-64 bg-white border border-gray-100"
                />
              </div>
            )
          ) : (
            /* Vista pestaña: solo botones */
            <div className="flex items-center gap-3 px-4 py-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 btn-secondary text-xs py-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir {label}
              </a>
              <a
                href={url}
                download
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── DropZone individual (imagen o PDF) ──────────────────────────────────────
function DropZone({
  label, file, onFile, disabled, scanning,
}: {
  label: string
  file: File | null
  onFile: (f: File) => void
  disabled: boolean
  scanning: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function accept(f: File) {
    if (f.type.startsWith('image/') || f.type === 'application/pdf') onFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) accept(f)
  }

  const isPDF = file?.type === 'application/pdf'
  const preview = file && !isPDF ? URL.createObjectURL(file) : null

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
      <div
        onClick={() => !disabled && ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={[
          'relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          drag ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-brand-green hover:bg-brand-green-light/30',
        ].join(' ')}
      >
        {scanning && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl z-10">
            <Loader2 className="w-5 h-5 text-brand-green animate-spin mb-1" />
            <span className="text-xs text-brand-green font-medium">Leyendo…</span>
          </div>
        )}
        {preview ? (
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
        ) : isPDF ? (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center">
            <FileText className="w-8 h-8 text-brand-green" />
            <span className="text-xs text-gray-600 font-medium truncate w-full text-center">{file!.name}</span>
            <span className="text-xs text-gray-400">PDF listo para escanear</span>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
            <span className="text-xs text-gray-400 text-center px-2">Arrastra o haz clic</span>
            <span className="text-xs text-gray-300 mt-0.5">JPG · PNG · WEBP · PDF</span>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f) }}
        />
      </div>
    </div>
  )
}

// ─── Zona especial PDF ambas caras ────────────────────────────────────────────
function PDFZone({
  onFile, disabled,
}: {
  onFile: (f: File) => void
  disabled: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function accept(f: File) {
    if (f.type === 'application/pdf') onFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) accept(f)
  }

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={[
        'w-full rounded-xl border-2 border-dashed flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        drag ? 'border-brand-orange bg-orange-50' : 'border-gray-200 hover:border-brand-orange hover:bg-orange-50/40',
      ].join(' ')}
    >
      <FileText className="w-5 h-5 text-brand-orange shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-700">Subir PDF con ambas caras</p>
        <p className="text-xs text-gray-400">La IA detecta automáticamente frente y reverso · Se escanea al instante</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f) }}
      />
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function INECaptura({ entityType, entityId, savedData, onSaved }: Props) {
  const supabase = createClient()

  const [frente,  setFrente]  = useState<File | null>(null)
  const [reverso, setReverso] = useState<File | null>(null)

  // Qué zona está escaneando actualmente
  const [scanningFrente,  setScanningFrente]  = useState(false)
  const [scanningReverso, setScanningReverso] = useState(false)
  const [scanningPDF,     setScanningPDF]     = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)

  const hasSaved = !!(savedData?.ocr_nombre || savedData?.ocr_curp)

  const [ocr, setOcr] = useState<OCRResult>({
    nombre:              savedData?.ocr_nombre        ?? null,
    curp:                savedData?.ocr_curp          ?? null,
    clave_elector:       savedData?.ocr_clave_elector ?? null,
    vigencia:            savedData?.ocr_vigencia      ?? null,
    domicilio_calle:     null,
    domicilio_colonia:   null,
    domicilio_cp:        null,
    domicilio_municipio: null,
    domicilio_estado:    null,
    numero_ine:          savedData?.ocr_numero_ine    ?? null,
  })

  const isScanning = scanningFrente || scanningReverso || scanningPDF

  // ── Helper: headers con token de sesión ──────────────────────────────────
  async function authHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  // ── Escanear imagen (un lado) ─────────────────────────────────────────────
  async function scanImagen(file: File, lado: 'frente' | 'reverso') {
    lado === 'frente' ? setScanningFrente(true) : setScanningReverso(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entity_type', entityType)
      fd.append('lado', lado)
      if (entityId) fd.append('entity_id', entityId)

      const res  = await fetch('/api/ocr/ine', { method: 'POST', body: fd, headers: await authHeaders() })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al escanear.')
        return
      }

      const r = data.ocr ?? {}
      setOcr(prev => ({
        nombre:              r.nombre              ?? prev.nombre,
        curp:                r.curp                ?? prev.curp,
        clave_elector:       r.clave_elector       ?? prev.clave_elector,
        vigencia:            r.vigencia            ?? prev.vigencia,
        domicilio_calle:     r.domicilio_calle     ?? prev.domicilio_calle,
        domicilio_colonia:   r.domicilio_colonia   ?? prev.domicilio_colonia,
        domicilio_cp:        r.domicilio_cp        ?? prev.domicilio_cp,
        domicilio_municipio: r.domicilio_municipio ?? prev.domicilio_municipio,
        domicilio_estado:    r.domicilio_estado    ?? prev.domicilio_estado,
        numero_ine:          r.numero_ine          ?? prev.numero_ine,
      }))
      setScanned(true)
    } catch {
      setError('Error de conexión.')
    } finally {
      lado === 'frente' ? setScanningFrente(false) : setScanningReverso(false)
    }
  }

  // ── Escanear PDF (auto-detecta cara(s)) ──────────────────────────────────
  async function scanPDF(file: File) {
    setScanningPDF(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entity_type', entityType)
      // Sin 'lado' — el API lo auto-detecta
      if (entityId) fd.append('entity_id', entityId)

      const res  = await fetch('/api/ocr/ine', { method: 'POST', body: fd, headers: await authHeaders() })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar el PDF.')
        return
      }

      const { lado, ocr: ocrData } = data

      // Asignar el PDF a la zona correspondiente
      if (lado === 'ambas' || lado === 'frente') setFrente(file)
      if (lado === 'reverso') setReverso(file)
      if (lado === 'ambas') { setFrente(file); setReverso(file) }

      setOcr(prev => ({
        nombre:              ocrData?.nombre              ?? prev.nombre,
        curp:                ocrData?.curp                ?? prev.curp,
        clave_elector:       ocrData?.clave_elector       ?? prev.clave_elector,
        vigencia:            ocrData?.vigencia            ?? prev.vigencia,
        domicilio_calle:     ocrData?.domicilio_calle     ?? prev.domicilio_calle,
        domicilio_colonia:   ocrData?.domicilio_colonia   ?? prev.domicilio_colonia,
        domicilio_cp:        ocrData?.domicilio_cp        ?? prev.domicilio_cp,
        domicilio_municipio: ocrData?.domicilio_municipio ?? prev.domicilio_municipio,
        domicilio_estado:    ocrData?.domicilio_estado    ?? prev.domicilio_estado,
        numero_ine:          ocrData?.numero_ine          ?? prev.numero_ine,
      }))
      setScanned(true)
    } catch {
      setError('Error de conexión.')
    } finally {
      setScanningPDF(false)
    }
  }

  // ── Guardar correcciones ──────────────────────────────────────────────────
  async function handleSave() {
    if (!entityId) return
    setSaving(true)
    setError(null)
    const table = entityType === 'cliente' ? 'clientes' : 'testigos'

    // Combinar partes de domicilio para guardar en el campo de texto
    const domParts = [
      ocr.domicilio_calle,
      ocr.domicilio_colonia ? `COL ${ocr.domicilio_colonia}` : null,
      ocr.domicilio_cp,
      ocr.domicilio_municipio,
      ocr.domicilio_estado,
    ].filter(Boolean)
    const domicilioCombinado = domParts.length ? domParts.join(', ') : null

    const { error: err } = await supabase
      .from(table)
      .update({
        ocr_nombre:        ocr.nombre        || null,
        ocr_curp:          ocr.curp          || null,
        ocr_clave_elector: ocr.clave_elector || null,
        ocr_vigencia:      ocr.vigencia      || null,
        ocr_domicilio:     domicilioCombinado,
        ocr_numero_ine:    ocr.numero_ine    || null,
      })
      .eq('id', entityId)

    setSaving(false)
    if (err) { setError(`No se pudo guardar: ${err.message}`); return }
    onSaved?.(ocr)
    setScanned(false)
  }

  // ── Campos editables ──────────────────────────────────────────────────────
  function OCRField({ field, label }: { field: keyof OCRResult; label: string }) {
    return (
      <div>
        <label className="label">{label}</label>
        <input
          type="text"
          className="input-field font-mono text-sm"
          value={ocr[field] ?? ''}
          onChange={(e) => setOcr(prev => ({ ...prev, [field]: e.target.value || null }))}
          placeholder="—"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-brand-green" />
        <h3 className="font-semibold text-gray-800">Credencial INE / IFE</h3>
        {hasSaved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" />
            Datos guardados
          </span>
        )}
      </div>

      {/* Archivo INE guardado (respaldo) */}
      {(savedData?.ine_url_frente || savedData?.ine_url_reverso) && (
        <INEViewer
          pathFrente={savedData.ine_url_frente}
          pathReverso={savedData.ine_url_reverso}
        />
      )}

      {/* Zona PDF ambas caras */}
      <PDFZone onFile={scanPDF} disabled={isScanning} />

      {scanningPDF && (
        <div className="flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-lg px-4 py-3 text-sm text-brand-orange-dark">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Analizando PDF con IA — detectando caras de la credencial…
        </div>
      )}

      {/* Separador */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200" />
        <span>o sube cada cara por separado</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Zonas frente / reverso */}
      <div className="flex gap-4">
        <DropZone
          label="Frente"
          file={frente}
          onFile={(f) => { setFrente(f); scanImagen(f, 'frente') }}
          disabled={isScanning}
          scanning={scanningFrente}
        />
        <DropZone
          label="Reverso"
          file={reverso}
          onFile={(f) => { setReverso(f); scanImagen(f, 'reverso') }}
          disabled={isScanning}
          scanning={scanningReverso}
        />
      </div>

      {/* Botón escanear manual (solo si hay archivos y aún no se ha escaneado) */}
      {(frente || reverso) && !scanned && !isScanning && (
        <button
          type="button"
          onClick={() => {
            if (frente) scanImagen(frente, 'frente')
            if (reverso) scanImagen(reverso, 'reverso')
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <ScanLine className="w-4 h-4" /> Escanear con IA
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Resultados OCR */}
      {(scanned || hasSaved) && (
        <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-green" />
              Datos extraídos — revisa y corrige si es necesario
            </p>
            {scanned && (
              <button
                type="button"
                onClick={() => { setFrente(null); setReverso(null); setScanned(false); setError(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Volver a escanear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OCRField field="nombre"        label="Nombre completo" />
            <OCRField field="curp"          label="CURP" />
            <OCRField field="clave_elector" label="Clave de elector" />
            <OCRField field="numero_ine"    label="Número de INE" />
            <OCRField field="vigencia"      label="Vigencia (año)" />
          </div>

          {/* Dirección desglosada */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Domicilio en INE</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <OCRField field="domicilio_calle"     label="Calle y número" />
              </div>
              <OCRField field="domicilio_colonia"   label="Colonia" />
              <OCRField field="domicilio_cp"        label="Código postal" />
              <OCRField field="domicilio_municipio" label="Municipio / Ciudad" />
              <OCRField field="domicilio_estado"    label="Estado" />
            </div>
          </div>

          {entityId && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                ) : (
                  <><Save className="w-4 h-4" /> Confirmar y guardar</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
