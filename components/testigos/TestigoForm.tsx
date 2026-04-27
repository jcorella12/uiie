'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, ScanLine, Loader2, CheckCircle2, RotateCcw,
  AlertTriangle, ChevronDown, FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima',
  'Durango','Estado de México','Guanajuato','Guerrero','Hidalgo',
  'Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca',
  'Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa',
  'Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]

// Abreviaturas que aparecen en la INE → nombre completo del select
const ABREV_ESTADO: Record<string, string> = {
  'AGS': 'Aguascalientes', 'AGS.': 'Aguascalientes',
  'BC': 'Baja California', 'B.C.': 'Baja California',
  'BCS': 'Baja California Sur', 'B.C.S.': 'Baja California Sur',
  'CAMP': 'Campeche', 'CAMP.': 'Campeche',
  'CHIS': 'Chiapas', 'CHIS.': 'Chiapas',
  'CHIH': 'Chihuahua', 'CHIH.': 'Chihuahua',
  'CDMX': 'Ciudad de México', 'D.F.': 'Ciudad de México', 'DF': 'Ciudad de México',
  'COAH': 'Coahuila', 'COAH.': 'Coahuila',
  'COL': 'Colima', 'COL.': 'Colima',
  'DGO': 'Durango', 'DGO.': 'Durango',
  'MEX': 'Estado de México', 'MÉX': 'Estado de México', 'EDO. MÉX.': 'Estado de México', 'EDO.MEX.': 'Estado de México',
  'GTO': 'Guanajuato', 'GTO.': 'Guanajuato',
  'GRO': 'Guerrero', 'GRO.': 'Guerrero',
  'HGO': 'Hidalgo', 'HGO.': 'Hidalgo',
  'JAL': 'Jalisco', 'JAL.': 'Jalisco',
  'MICH': 'Michoacán', 'MICH.': 'Michoacán',
  'MOR': 'Morelos', 'MOR.': 'Morelos',
  'NAY': 'Nayarit', 'NAY.': 'Nayarit',
  'NL': 'Nuevo León', 'N.L.': 'Nuevo León',
  'OAX': 'Oaxaca', 'OAX.': 'Oaxaca',
  'PUE': 'Puebla', 'PUE.': 'Puebla',
  'QRO': 'Querétaro', 'QRO.': 'Querétaro',
  'QROO': 'Quintana Roo', 'Q.ROO': 'Quintana Roo', 'Q.R.': 'Quintana Roo',
  'SLP': 'San Luis Potosí', 'S.L.P.': 'San Luis Potosí',
  'SIN': 'Sinaloa', 'SIN.': 'Sinaloa',
  'SON': 'Sonora', 'SON.': 'Sonora',
  'TAB': 'Tabasco', 'TAB.': 'Tabasco',
  'TAMPS': 'Tamaulipas', 'TAMPS.': 'Tamaulipas',
  'TLAX': 'Tlaxcala', 'TLAX.': 'Tlaxcala',
  'VER': 'Veracruz', 'VER.': 'Veracruz',
  'YUC': 'Yucatán', 'YUC.': 'Yucatán',
  'ZAC': 'Zacatecas', 'ZAC.': 'Zacatecas',
}

/** Normaliza el estado devuelto por OCR al valor exacto del select */
function normalizarEstado(raw: string | null | undefined): string {
  if (!raw) return ''
  const limpio = raw.trim().replace(/\.$/g, '') // quitar punto final
  // 1. Match exacto (case-insensitive)
  const exacto = ESTADOS_MX.find(e => e.toLowerCase() === limpio.toLowerCase())
  if (exacto) return exacto
  // 2. Abreviatura conocida (uppercase)
  const abrev = ABREV_ESTADO[limpio.toUpperCase()]
  if (abrev) return abrev
  // 3. Buscar si el raw está contenido en algún nombre (ej: "SONORA" contiene "Sonora")
  const parcial = ESTADOS_MX.find(e => e.toLowerCase().includes(limpio.toLowerCase()) || limpio.toLowerCase().includes(e.toLowerCase()))
  return parcial ?? ''
}

const ROLES = [
  { value: 'testigo',         label: 'Testigo' },
  { value: 'representante',   label: 'Representante' },
  { value: 'firmante',        label: 'Quien firma el contrato' },
  { value: 'atiende',         label: 'Quien atiende la visita' },
  { value: 'otro',            label: 'Otro' },
]

const ACCEPT_INE = 'image/jpeg,image/png,image/webp,application/pdf'

// ─── Zona de drop (imagen o PDF) ─────────────────────────────────────────────
function DropZone({
  label, file, onFile, disabled, scanning,
}: { label: string; file: File | null; onFile: (f: File) => void; disabled: boolean; scanning?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const isPDF = file?.type === 'application/pdf'
  const preview = file && !isPDF ? URL.createObjectURL(file) : null

  function accept(f: File) {
    if (f.type.startsWith('image/') || f.type === 'application/pdf') onFile(f)
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</p>
      <div
        onClick={() => !disabled && ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) accept(f) }}
        className={[
          'relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          drag ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-brand-green hover:bg-brand-green-light/30',
        ].join(' ')}
      >
        {scanning && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl z-10">
            <Loader2 className="w-4 h-4 text-brand-green animate-spin mb-1" />
            <span className="text-xs text-brand-green font-medium">Leyendo…</span>
          </div>
        )}
        {preview ? (
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
        ) : isPDF ? (
          <div className="flex flex-col items-center gap-1 px-3 text-center">
            <FileText className="w-7 h-7 text-brand-green" />
            <span className="text-xs text-gray-600 font-medium truncate w-full text-center">{file!.name}</span>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400 text-center px-2">Arrastra o haz clic</span>
            <span className="text-xs text-gray-300">JPG · PNG · PDF</span>
          </>
        )}
        <input ref={ref} type="file" accept={ACCEPT_INE} className="hidden"
          disabled={disabled} onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f) }} />
      </div>
    </div>
  )
}

// ─── Zona PDF ambas caras ─────────────────────────────────────────────────────
function PDFZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onFile(f) }}
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
      <input ref={ref} type="file" accept="application/pdf" className="hidden"
        disabled={disabled} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  testigo?: any
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const _supabase = createClient()

export default function TestigoForm({ testigo }: Props) {
  const router = useRouter()
  const supabase = _supabase
  const esEdicion = Boolean(testigo?.id)

  // Form fields
  const [form, setForm] = useState({
    nombre:        testigo?.nombre        ?? '',
    apellidos:     testigo?.apellidos     ?? '',
    empresa:       testigo?.empresa       ?? '',
    email:         testigo?.email         ?? '',
    telefono:      testigo?.telefono      ?? '',
    rol:           testigo?.rol           ?? 'testigo',
    curp:          testigo?.curp          ?? '',
    numero_ine:    testigo?.numero_ine    ?? '',
    clave_elector: testigo?.clave_elector ?? '',
    domicilio:     testigo?.domicilio     ?? '',
    colonia:       testigo?.colonia       ?? '',
    cp:            testigo?.cp            ?? '',
    ciudad:        testigo?.ciudad        ?? '',
    estado:        testigo?.estado        ?? '',
    activo:        testigo?.activo        ?? true,
  })

  // OCR state
  const [frente,          setFrente]          = useState<File | null>(null)
  const [reverso,         setReverso]         = useState<File | null>(null)
  const [scanningFrente,  setScanningFrente]  = useState(false)
  const [scanningReverso, setScanningReverso] = useState(false)
  const [scanningPDF,     setScanningPDF]     = useState(false)
  const [scanned,         setScanned]         = useState(false)
  const [ocrData,         setOcrData]         = useState<Record<string, string | null>>({})
  const [ocrError,        setOcrError]        = useState<string | null>(null)

  const isScanning = scanningFrente || scanningReverso || scanningPDF

  // Submit state
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function setField(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Helper: aplicar OCR al form ─────────────────────────────────────────────
  function applyOCR(combined: Record<string, string | null>) {
    setOcrData(combined)
    // Pre-llenar campos del form con datos extraídos
    if (combined.nombre) {
      const partes = combined.nombre.trim().split(/\s+/)
      if (partes.length >= 3) {
        setField('nombre',    partes.slice(0, -2).join(' '))
        setField('apellidos', partes.slice(-2).join(' '))
      } else if (partes.length === 2) {
        setField('nombre',    partes[0])
        setField('apellidos', partes[1])
      } else {
        setField('nombre', combined.nombre)
      }
    }
    if (combined.curp)               setField('curp',          combined.curp)
    if (combined.clave_elector)      setField('clave_elector', combined.clave_elector)
    if (combined.numero_ine)         setField('numero_ine',    combined.numero_ine)
    if (combined.domicilio_calle)    setField('domicilio',     combined.domicilio_calle)
    if (combined.domicilio_colonia)  setField('colonia',       combined.domicilio_colonia)
    if (combined.domicilio_cp)       setField('cp',            combined.domicilio_cp)
    if (combined.domicilio_municipio) setField('ciudad',       combined.domicilio_municipio)
    if (combined.domicilio_estado) {
      const estadoNorm = normalizarEstado(combined.domicilio_estado)
      if (estadoNorm) setField('estado', estadoNorm)
    }
    setScanned(true)
  }

  // ── Helper: headers con token de sesión ─────────────────────────────────────
  async function authHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  // ── Escanear imagen individual ───────────────────────────────────────────────
  async function scanImagen(file: File, lado: 'frente' | 'reverso') {
    lado === 'frente' ? setScanningFrente(true) : setScanningReverso(true)
    setOcrError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entity_type', 'testigo')
      fd.append('lado', lado)
      const res  = await fetch('/api/ocr/ine', { method: 'POST', body: fd, headers: await authHeaders() })
      const data = await res.json()
      if (!res.ok) { setOcrError(data.error ?? 'Error al escanear'); return }
      const r = data.ocr ?? {}
      const filtered = Object.fromEntries(
        Object.entries(r).filter(([, v]) => v != null)
      ) as Record<string, string | null>
      applyOCR({ ...ocrData, ...filtered })
    } catch { setOcrError('Error de conexión.') }
    finally { lado === 'frente' ? setScanningFrente(false) : setScanningReverso(false) }
  }

  // ── Escanear PDF (auto-detecta caras) ────────────────────────────────────────
  async function scanPDF(file: File) {
    setScanningPDF(true)
    setOcrError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entity_type', 'testigo')
      // Sin 'lado' → auto-detecta
      const res  = await fetch('/api/ocr/ine', { method: 'POST', body: fd, headers: await authHeaders() })
      const data = await res.json()
      if (!res.ok) { setOcrError(data.error ?? 'Error al procesar PDF'); return }
      const { lado, ocr: r } = data
      if (lado === 'ambas' || lado === 'frente') setFrente(file)
      if (lado === 'reverso') setReverso(file)
      if (lado === 'ambas')   setReverso(file)
      applyOCR(r ?? {})
    } catch { setOcrError('Error de conexión.') }
    finally { setScanningPDF(false) }
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body: any = {
        ...form,
        // Incluir datos OCR si se escaneó (se guardarán con el insert/update)
        ...(scanned ? {
          ocr_nombre:        ocrData.nombre        ?? null,
          ocr_curp:          ocrData.curp          ?? null,
          ocr_clave_elector: ocrData.clave_elector ?? null,
          ocr_vigencia:      ocrData.vigencia      ?? null,
          ocr_domicilio:     ocrData.domicilio     ?? null,
          ocr_numero_ine:    ocrData.numero_ine    ?? null,
        } : {}),
      }
      if (esEdicion) body.id = testigo.id

      const res = await fetch('/api/testigos/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Error al guardar')
      }

      router.push('/dashboard/admin/testigos')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

      {/* ── Escanear INE primero ── */}
      <div className="card space-y-4 border-2 border-dashed border-brand-green/30 bg-brand-green-light/20">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-brand-green" />
          <h2 className="text-base font-semibold text-gray-800">
            Identificación oficial
          </h2>
          <span className="text-xs text-gray-400 font-normal">— Sube la INE para rellenar los datos automáticamente</span>
        </div>

        {/* PDF ambas caras */}
        <PDFZone onFile={scanPDF} disabled={isScanning} />

        {scanningPDF && (
          <div className="flex items-center gap-2 text-sm text-brand-orange">
            <Loader2 className="w-4 h-4 animate-spin" /> Analizando PDF — detectando caras…
          </div>
        )}

        {/* Separador */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          <span>o sube cada cara por separado</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

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

        {scanned && (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Datos rellenados automáticamente
            <button
              type="button"
              onClick={() => { setFrente(null); setReverso(null); setScanned(false); setOcrData({}) }}
              className="ml-1 text-gray-400 hover:text-gray-600"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </span>
        )}

        {ocrError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {ocrError}
          </div>
        )}
      </div>

      {/* ── Rol ── */}
      <div className="card space-y-3">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Rol en la inspección
        </h2>
        <div className="relative">
          <select
            value={form.rol}
            onChange={(e) => setField('rol', e.target.value)}
            className="input-field appearance-none pr-9 w-full"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Datos personales ── */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Datos personales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre(s) <span className="text-red-500">*</span></label>
            <input
              type="text" required value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              className="input-field" placeholder="Juan"
            />
          </div>
          <div>
            <label className="label">Apellidos <span className="text-red-500">*</span></label>
            <input
              type="text" required value={form.apellidos}
              onChange={(e) => setField('apellidos', e.target.value)}
              className="input-field" placeholder="Pérez García"
            />
          </div>
        </div>

        <div>
          <label className="label">Empresa <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input
            type="text" value={form.empresa}
            onChange={(e) => setField('empresa', e.target.value)}
            className="input-field" placeholder="Nombre de la empresa u organización"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email" value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className="input-field" placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              type="tel" value={form.telefono}
              onChange={(e) => setField('telefono', e.target.value)}
              className="input-field" placeholder="55 1234 5678"
            />
          </div>
        </div>
      </div>

      {/* ── Datos de identificación ── */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Datos de identificación
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">CURP</label>
            <input
              type="text" value={form.curp} maxLength={18}
              onChange={(e) => setField('curp', e.target.value.toUpperCase())}
              className="input-field font-mono uppercase tracking-widest"
              placeholder="ABCD123456HXXXXXX00"
            />
          </div>
          <div>
            <label className="label">Número INE / pasaporte</label>
            <input
              type="text" value={form.numero_ine}
              onChange={(e) => setField('numero_ine', e.target.value)}
              className="input-field" placeholder="Número al reverso"
            />
          </div>
          <div>
            <label className="label">Clave de elector</label>
            <input
              type="text" value={form.clave_elector}
              onChange={(e) => setField('clave_elector', e.target.value)}
              className="input-field" placeholder="Clave de elector del INE"
            />
          </div>
        </div>
      </div>

      {/* ── Domicilio ── */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          Domicilio
        </h2>

        <div>
          <label className="label">Calle y número</label>
          <input
            type="text" value={form.domicilio}
            onChange={(e) => setField('domicilio', e.target.value)}
            className="input-field" placeholder="Av. Ejemplo 123"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Colonia</label>
            <input
              type="text" value={form.colonia}
              onChange={(e) => setField('colonia', e.target.value)}
              className="input-field" placeholder="Colonia"
            />
          </div>
          <div>
            <label className="label">Código postal</label>
            <input
              type="text" value={form.cp} maxLength={5}
              onChange={(e) => setField('cp', e.target.value)}
              className="input-field" placeholder="00000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ciudad</label>
            <input
              type="text" value={form.ciudad}
              onChange={(e) => setField('ciudad', e.target.value)}
              className="input-field" placeholder="Ciudad"
            />
          </div>
          <div>
            <label className="label">Estado</label>
            <div className="relative">
              <select
                value={form.estado}
                onChange={(e) => setField('estado', e.target.value)}
                className="input-field appearance-none pr-9"
              >
                <option value="">Selecciona un estado</option>
                {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Estado (solo edición) ── */}
      {esEdicion && (
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox" checked={form.activo}
              onChange={(e) => setField('activo', e.target.checked)}
              className="w-4 h-4 rounded accent-brand-green"
            />
            <span className="text-sm font-medium text-gray-700">
              Activo — aparece en la lista de selección para nuevas inspecciones
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear participante'}
        </button>
        <a href="/dashboard/admin/testigos" className="btn-outline">Cancelar</a>
      </div>
    </form>
  )
}
