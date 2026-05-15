'use client'

import { useState, useRef, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentoTipo } from '@/lib/types'
import {
  UploadCloud, FileText, X, CheckCircle, AlertTriangle,
  Loader2, Sparkles, User, Users, Cpu, Plus, Gauge,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<DocumentoTipo, string> = {
  contrato:             'Contrato',
  plano:                'Diagrama Unifilar',
  memoria_tecnica:      'Memoria de Cálculo',
  dictamen:             'Dictamen UVIE',
  acta:                 'Acta de Inspección FO-12',
  lista_verificacion:   'Lista DACG',
  paquete_actas_listas: 'Paquete Actas y Listas (Acta + Lista + Cotización + Plan)',
  cotizacion:           'Cotización',
  plan_inspeccion:      'Plan de Inspección',
  resolutivo:           'Oficio Resolutivo CFE',
  ficha_pago:           'Ficha de Pago (Resolutivo)',
  comprobante_pago:     'Comprobante de Pago',
  recibo_cfe:           'Recibo CFE',
  fotografia:           'Fotografía',
  evidencia_visita:     'Foto Evidencia de Visita',
  foto_medidor:         'Foto del Medidor',
  certificado_cre:      'Certificado CNE',
  acuse_cre:            'Acuse CNE',
  otro:                 'Otro',
}

const IA_KEY_TIPOS: DocumentoTipo[] = ['resolutivo', 'dictamen', 'plano', 'memoria_tecnica']

const TIPOS_LISTA: DocumentoTipo[] = [
  'paquete_actas_listas',
  'acta', 'lista_verificacion', 'cotizacion', 'plan_inspeccion',
  'resolutivo', 'ficha_pago', 'comprobante_pago', 'recibo_cfe',
  'dictamen', 'plano', 'memoria_tecnica', 'contrato',
  'evidencia_visita', 'foto_medidor', 'fotografia',
  'certificado_cre', 'acuse_cre', 'otro',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type SpecialType = 'none' | 'ia_key' | 'ine' | 'inversor_cert' | 'recibo_cfe'
type ItemStatus  = 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
type INERole     = 'testigo_1' | 'testigo_2' | 'representante' | 'responsable' | 'atiende'

interface QueueFile {
  id: string
  file: File
  tipo: DocumentoTipo
  /** Nombre personalizado cuando tipo === 'otro' (obligatorio en ese caso) */
  customNombre?: string
  specialType: SpecialType
  status: ItemStatus
  error?: string
  preview?: string
  // IA key flow
  documentoId?: string
  applied?: boolean
  // Recibo CFE flow
  reciboProcessing?: boolean
  reciboNumero?: string | null
  reciboConfianza?: string
  reciboSaved?: boolean
  // INE flow
  ineRole?: INERole
  ineProcessing?: boolean
  ineData?: Record<string, any>
  ineStorageKey?: string
  ineTestigoSaved?: boolean
  // Inversor cert flow
  inversorAnalyzing?: boolean
  inversorData?: { extracted: Record<string, any>; existingMatch?: { id: string; marca: string; modelo: string } | null } | null
  inversorSelected?: boolean
}

interface Props {
  expedienteId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function smartTipo(file: File): DocumentoTipo {
  const name = file.name.toLowerCase()
  if (/paquete|actas.*listas|listas.*actas|acta.*lista.*cotiz|escaneo.*completo/.test(name)) return 'paquete_actas_listas'
  // Fotos específicas (van antes del fallback de fotografía genérica)
  if (file.type.startsWith('image/') && /selfie|evidencia|inspector|fachada/.test(name)) return 'evidencia_visita'
  if (file.type.startsWith('image/') && /medidor|kwh|cfe.*medidor/.test(name))           return 'foto_medidor'
  if (file.type.startsWith('image/')) return 'fotografia'
  if (name.includes('acta') || /fo.?12/.test(name))                  return 'acta'
  if (name.includes('cotiza'))                                       return 'cotizacion'
  if (/plan.*inspec|plan.*visita/.test(name))                        return 'plan_inspeccion'
  if (/recibo.*cfe|recibo.*luz|cfe.*recibo/.test(name))              return 'recibo_cfe'
  if (/comprob.*pago|deposito|pago.*cfe/.test(name))                 return 'comprobante_pago'
  if (name.includes('unifilar') || name.includes('diagrama')) return 'plano'
  if (name.includes('memoria') || name.includes('calculo') || name.includes('cálculo')) return 'memoria_tecnica'
  if (name.includes('plano'))                                 return 'plano'
  if (name.includes('contrato'))                              return 'contrato'
  if (name.includes('resolutivo'))                            return 'resolutivo'
  if (name.includes('dictamen') || name.includes('uvie'))     return 'dictamen'
  if (name.includes('lista') || name.includes('verificacion'))return 'lista_verificacion'
  return 'otro'
}

function detectSpecialType(file: File): SpecialType {
  const n = file.name.toLowerCase()
  if (/\b(ine|ife)\b|credencial|identificac|pasaporte/.test(n)) return 'ine'
  if (/\b(inversor|inverter|panel|modulo|módulo)\b|ficha.tecnica|datasheet|cert.inv/.test(n)) return 'inversor_cert'
  // Recibo CFE o foto/placa del medidor — ambos disparan el flujo de extracción de medidor
  if (/recibo|estado.cuenta|factura.*cfe|cfe.*factura|recibo.*luz|luz.*cfe|\bmedidor\b|placa.*medidor|medidor.*bidireccional|num.*serie.*medidor|n[ºo°.]?\s*medidor/.test(n)) return 'recibo_cfe'
  return 'none'
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (f: File[]) => void }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const uid = useId()
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(f) }}
      onClick={() => ref.current?.click()}
      className={`group cursor-pointer rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 py-10 px-6 text-center ${
        drag
          ? 'border-brand-green bg-brand-green-light scale-[1.01] shadow-md'
          : 'border-gray-300 hover:border-brand-green hover:bg-emerald-50/40 hover:shadow-sm'
      }`}
    >
      <input id={uid} ref={ref} type="file" multiple className="hidden"
        onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = '' }} />
      {/* Ícono más grande con animación al hover */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        drag
          ? 'bg-brand-green/20 scale-110'
          : 'bg-gray-100 group-hover:bg-brand-green/10 group-hover:scale-105'
      }`}>
        <UploadCloud className={`w-7 h-7 transition-colors ${
          drag ? 'text-brand-green' : 'text-gray-400 group-hover:text-brand-green'
        }`} />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-800">
          {drag ? '✋ Suelta para subir' : 'Arrastra archivos aquí'}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {drag ? 'Los archivos se cargarán automáticamente' : (
            <>o <span className="text-brand-green font-medium underline">haz clic para seleccionarlos</span></>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          PDF · Imágenes · Word · Excel · cualquier formato
        </p>
      </div>
    </div>
  )
}

// ─── INE item ─────────────────────────────────────────────────────────────────

const INE_ROLES: { role: INERole; label: string; Icon: React.ElementType; esTestigo: boolean }[] = [
  { role: 'representante', label: 'Representante legal',         Icon: User,  esTestigo: false },
  { role: 'testigo_1',     label: 'Testigo 1',                   Icon: Users, esTestigo: true  },
  { role: 'testigo_2',     label: 'Testigo 2',                   Icon: Users, esTestigo: true  },
  { role: 'responsable',   label: 'Responsable de la instalación', Icon: User, esTestigo: false },
  { role: 'atiende',       label: 'Quien atiende la instalación', Icon: User, esTestigo: false  },
]

function INEItem({ qf, onRemove, onUpdate }: {
  qf: QueueFile
  onRemove: () => void
  onUpdate: (u: Partial<QueueFile>) => void
}) {
  async function handleOCR() {
    onUpdate({ ineProcessing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('ines', qf.file)
      const res  = await fetch('/api/testigos/importar-ines', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar')
      // Backend responde con `participantes` (es) — soportar también `participants` por compat
      const p = (data.participantes ?? data.participants)?.[0]
      if (!p) throw new Error('No se pudo extraer información de la identificación')
      onUpdate({ ineProcessing: false, ineData: p, ineStorageKey: p._storageKey })
    } catch (err: any) {
      onUpdate({ ineProcessing: false, error: err.message })
    }
  }

  const rolConfig = INE_ROLES.find(r => r.role === qf.ineRole)

  async function handleGuardarTestigo() {
    if (!qf.ineData) return
    onUpdate({ ineProcessing: true })
    try {
      const res = await fetch('/api/testigos/importar-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El backend espera "participantes" (es), no "participants"
        body: JSON.stringify({ participantes: [{ ...qf.ineData, rol: 'testigo', _storageKey: qf.ineStorageKey }] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onUpdate({ ineProcessing: false, ineTestigoSaved: true, status: 'done' })
    } catch (err: any) {
      onUpdate({ ineProcessing: false, error: err.message })
    }
  }

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${qf.ineTestigoSaved ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white border border-gray-200 flex-shrink-0">
          {qf.preview ? <img src={qf.preview} alt="" className="w-full h-full object-cover rounded-md" /> : <FileText className="w-5 h-5 text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">{qf.file.name}</p>
          <p className="text-[10px] text-blue-600 font-medium">Identificación detectada</p>
        </div>
        {!qf.ineTestigoSaved
          ? <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
      </div>

      {/* Role selector */}
      {!qf.ineData && !qf.ineTestigoSaved && (
        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-1.5">¿Para quién es esta identificación?</p>
          <div className="flex gap-2 flex-wrap">
            {INE_ROLES.map(({ role, label, Icon, esTestigo: _ }) => (
              <button key={role} onClick={() => onUpdate({ ineRole: role })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  qf.ineRole === role ? 'border-brand-green bg-brand-green-light text-brand-green' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
          {qf.ineRole && (
            <button onClick={handleOCR} disabled={qf.ineProcessing}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {qf.ineProcessing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando con IA…</> : <><Sparkles className="w-3.5 h-3.5" /> Leer identificación con IA</>}
            </button>
          )}
        </div>
      )}

      {qf.error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{qf.error}</p>}

      {/* OCR result */}
      {qf.ineData && !qf.ineTestigoSaved && (
        <div className="rounded-lg bg-white border border-blue-200 p-2.5 space-y-2">
          <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Datos extraídos</p>
          <div className="text-xs space-y-0.5">
            {[
              `${qf.ineData.nombre ?? ''} ${qf.ineData.apellido_paterno ?? ''} ${qf.ineData.apellido_materno ?? ''}`.trim(),
              qf.ineData.curp,
            ].filter(Boolean).map((v, i) => <p key={i} className="text-gray-700 font-medium">{v}</p>)}
          </div>
          {rolConfig?.esTestigo ? (
            <button onClick={handleGuardarTestigo} disabled={qf.ineProcessing}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 disabled:opacity-50">
              {qf.ineProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Guardar como testigo
            </button>
          ) : (
            <p className="text-[10px] text-gray-500">
              Datos de <strong>{rolConfig?.label}</strong> disponibles — captúralos manualmente en los datos del cliente.
            </p>
          )}
        </div>
      )}
      {qf.ineTestigoSaved && (
        <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />Testigo guardado en el catálogo
        </p>
      )}
    </div>
  )
}

// ─── Inversor cert item ───────────────────────────────────────────────────────

function InversorItem({ qf, expedienteId, onRemove, onUpdate, onRefresh }: {
  qf: QueueFile
  expedienteId: string
  onRemove: () => void
  onUpdate: (u: Partial<QueueFile>) => void
  onRefresh: () => void
}) {
  async function handleAnalizar() {
    onUpdate({ inversorAnalyzing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('file', qf.file)
      const res  = await fetch('/api/inversores/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar')
      const inv = data.multiple ? data.models[0] : { extracted: data.extracted, existingMatch: data.existingMatch }
      onUpdate({ inversorAnalyzing: false, inversorData: inv })
    } catch (err: any) {
      onUpdate({ inversorAnalyzing: false, error: err.message })
    }
  }

  // Solo subir el archivo (saltar análisis con IA). Útil cuando la ficha técnica
  // tiene varios modelos y el inspector ya seleccionó el inversor manualmente.
  async function handleSubirSinIA() {
    onUpdate({ inversorAnalyzing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('file', qf.file)
      fd.append('tipo', 'otro')
      fd.append('nombre', qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name)
      fd.append('expediente_id', expedienteId)
      const res  = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo subir')
      onUpdate({ inversorAnalyzing: false, inversorSelected: true, status: 'done' })
      onRefresh()
    } catch (err: any) {
      onUpdate({ inversorAnalyzing: false, error: err.message, status: 'error' })
    }
  }

  async function handleSeleccionar(inversorId: string) {
    onUpdate({ inversorAnalyzing: true })
    try {
      const res = await fetch('/api/expedientes/guardar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId, inversor_id: inversorId }),
      })
      if (!res.ok) throw new Error('Error al seleccionar inversor')
      onUpdate({ inversorAnalyzing: false, inversorSelected: true, status: 'done' })
      onRefresh()
    } catch (err: any) {
      onUpdate({ inversorAnalyzing: false, error: err.message })
    }
  }

  async function handleDarDeAlta() {
    const ext = qf.inversorData?.extracted
    if (!ext) return
    onUpdate({ inversorAnalyzing: true })
    try {
      const fd = new FormData()
      if (ext.marca)       fd.append('marca',       String(ext.marca))
      if (ext.modelo)      fd.append('modelo',      String(ext.modelo))
      if (ext.potencia_kw) fd.append('potencia_kw', String(ext.potencia_kw))
      fd.append('fase',          String(ext.fase         ?? 'monofasico'))
      fd.append('tipo',          String(ext.tipo         ?? 'string'))
      fd.append('certificacion', String(ext.certificacion ?? 'ninguna'))
      fd.append('activo',        'true')
      if (ext.eficiencia)  fd.append('eficiencia',  String(ext.eficiencia))
      if (ext.tension_ac)  fd.append('tension_ac',  String(ext.tension_ac))
      if (ext.tipo_doc === 'certificado') fd.append('certificado',   qf.file)
      else                                fd.append('ficha_tecnica', qf.file)

      const res  = await fetch('/api/inversores/guardar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al dar de alta')
      await handleSeleccionar(data.id)
    } catch (err: any) {
      onUpdate({ inversorAnalyzing: false, error: err.message })
    }
  }

  const ext   = qf.inversorData?.extracted
  const match = qf.inversorData?.existingMatch

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${qf.inversorSelected ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white border border-gray-200 flex-shrink-0">
          <Cpu className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">{qf.file.name}</p>
          <p className="text-[10px] text-amber-600 font-medium">Certificado / Ficha técnica de inversor detectado</p>
        </div>
        {!qf.inversorSelected
          ? <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
      </div>

      {!qf.inversorData && !qf.inversorSelected && (
        <>
          <p className="text-[11px] text-amber-800/80">
            Si la ficha trae varios modelos y la IA podría confundirse, usa "Solo subir" y
            selecciona manualmente el inversor en Información Técnica.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleAnalizar} disabled={qf.inversorAnalyzing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50">
              {qf.inversorAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando…</> : <><Sparkles className="w-3.5 h-3.5" /> Analizar con IA</>}
            </button>
            <button onClick={handleSubirSinIA} disabled={qf.inversorAnalyzing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-amber-300 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-50 disabled:opacity-50">
              <FileText className="w-3.5 h-3.5" /> Solo subir
            </button>
          </div>
        </>
      )}

      {qf.error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{qf.error}</p>}

      {qf.inversorData && !qf.inversorSelected && (
        <div className="space-y-2">
          <div className="rounded-lg bg-white border border-amber-200 p-2.5">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Datos extraídos</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
              {ext?.marca      && <div><span className="text-gray-400">Marca: </span><span className="font-medium">{ext.marca}</span></div>}
              {ext?.modelo     && <div><span className="text-gray-400">Modelo: </span><span className="font-medium">{ext.modelo}</span></div>}
              {ext?.potencia_kw && <div><span className="text-gray-400">Potencia: </span><span className="font-medium">{ext.potencia_kw} kW</span></div>}
              {ext?.fase       && <div><span className="text-gray-400">Fase: </span><span className="font-medium">{ext.fase}</span></div>}
            </div>
          </div>

          {match ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold text-green-700">✓ Ya está en catálogo: {match.marca} {match.modelo}</p>
              <button onClick={() => handleSeleccionar(match.id)} disabled={qf.inversorAnalyzing}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 disabled:opacity-50">
                {qf.inversorAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Seleccionar para este expediente
              </button>
            </div>
          ) : ext?.marca && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold text-amber-700">No está en catálogo — se registrará como nuevo</p>
              <button onClick={handleDarDeAlta} disabled={qf.inversorAnalyzing}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50">
                {qf.inversorAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Dar de alta y seleccionar
              </button>
            </div>
          )}
        </div>
      )}

      {qf.inversorSelected && (
        <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />Inversor seleccionado para el expediente
        </p>
      )}
    </div>
  )
}

// ─── Recibo CFE item ──────────────────────────────────────────────────────────

function ReciboCFEItem({ qf, expedienteId, onRemove, onUpdate, onRefresh }: {
  qf: QueueFile
  expedienteId: string
  onRemove: () => void
  onUpdate: (u: Partial<QueueFile>) => void
  onRefresh: () => void
}) {
  async function handleOCR() {
    onUpdate({ reciboProcessing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('file', qf.file)
      fd.append('expediente_id', expedienteId)
      const res  = await fetch('/api/ocr/medidor', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo leer el medidor')
      // Mostramos la sugerencia editable; no marcamos saved hasta que el inspector confirme.
      onUpdate({
        reciboProcessing: false,
        reciboNumero:    data.numero_medidor ?? null,
        reciboConfianza: data.confianza ?? '',
        reciboSaved:     false,
        status:          'pending',
        error:           data.numero_medidor ? undefined : 'No se encontró número de medidor — captúralo manualmente',
      })
    } catch (err: any) {
      onUpdate({ reciboProcessing: false, error: err.message, status: 'error' })
    }
  }

  // Subir el archivo como documento normal (recibo_cfe), sin pedir extracción.
  // Útil si el recibo trae el medidor ANTERIOR (no bidireccional).
  async function handleSubirComoDocumento() {
    onUpdate({ reciboProcessing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('file', qf.file)
      fd.append('tipo', 'recibo_cfe')
      fd.append('nombre', qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name)
      fd.append('expediente_id', expedienteId)
      const res = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo subir')
      onUpdate({ reciboProcessing: false, reciboSaved: true, status: 'done' })
      onRefresh()
    } catch (err: any) {
      onUpdate({ reciboProcessing: false, error: err.message, status: 'error' })
    }
  }

  // Confirmar y guardar el número de medidor (editado manualmente o sugerido por IA)
  async function handleGuardarMedidor() {
    if (!qf.reciboNumero?.trim()) {
      onUpdate({ error: 'Captura el número de medidor antes de guardar' })
      return
    }
    onUpdate({ reciboProcessing: true, error: undefined })
    try {
      const r = await fetch('/api/expedientes/guardar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          numero_medidor: qf.reciboNumero.trim(),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'No se pudo guardar')

      // Adicionalmente, registrar el archivo como documento recibo_cfe
      const fd = new FormData()
      fd.append('file', qf.file)
      fd.append('tipo', 'recibo_cfe')
      fd.append('nombre', qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name)
      fd.append('expediente_id', expedienteId)
      await fetch('/api/documentos/subir', { method: 'POST', body: fd })

      onUpdate({ reciboProcessing: false, reciboSaved: true, status: 'done' })
      onRefresh()
    } catch (err: any) {
      onUpdate({ reciboProcessing: false, error: err.message, status: 'error' })
    }
  }

  const confianzaColor = {
    alta:  'text-green-600 bg-green-50 border-green-200',
    media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    baja:  'text-red-600 bg-red-50 border-red-200',
  }[qf.reciboConfianza ?? ''] ?? ''

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${qf.reciboSaved ? 'border-green-200 bg-green-50' : 'border-teal-200 bg-teal-50'}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white border border-gray-200 flex-shrink-0">
          <Gauge className="w-5 h-5 text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">{qf.file.name}</p>
          <p className="text-[10px] text-teal-600 font-medium">
            Recibo CFE / foto de medidor detectado — ¿extraer el número?
          </p>
        </div>
        {!qf.reciboSaved
          ? <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
      </div>

      {/* Estado inicial: ofrecer las dos vías + aviso sobre medidor anterior */}
      {!qf.reciboSaved && !qf.reciboProcessing && qf.reciboNumero == null && (
        <>
          <p className="text-[11px] text-teal-800/80">
            Ojo: en algunos recibos viene el medidor <strong>anterior</strong> (no bidireccional).
            Si dudas, sube solo el documento y captura el medidor manualmente en Información Técnica.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOCR}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
            >
              <Sparkles className="w-3.5 h-3.5" /> Extraer con IA
            </button>
            <button
              onClick={handleSubirComoDocumento}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-teal-300 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-50"
            >
              <FileText className="w-3.5 h-3.5" /> Solo subir
            </button>
          </div>
        </>
      )}

      {qf.reciboProcessing && (
        <div className="flex items-center gap-2 text-xs text-teal-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando…
        </div>
      )}

      {qf.error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />{qf.error}
        </p>
      )}

      {/* IA propuso un número — editable antes de confirmar */}
      {!qf.reciboSaved && qf.reciboNumero != null && !qf.reciboProcessing && (
        <div className="space-y-2">
          <p className="text-[11px] text-teal-800">
            La IA detectó un número. Verifícalo y edítalo si corresponde a otro medidor:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={qf.reciboNumero ?? ''}
              onChange={e => onUpdate({ reciboNumero: e.target.value, error: undefined })}
              className="flex-1 px-3 py-1.5 rounded-lg border border-teal-300 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Número de medidor"
            />
            {qf.reciboConfianza && (
              <span className={`text-[10px] font-medium px-1.5 py-1 rounded border ${confianzaColor}`}>
                IA: {qf.reciboConfianza}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGuardarMedidor}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Confirmar y guardar
            </button>
            <button
              onClick={handleSubirComoDocumento}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-teal-300 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-50"
            >
              Subir sin medidor
            </button>
          </div>
        </div>
      )}

      {qf.reciboSaved && qf.reciboNumero && (
        <div className="rounded-lg bg-emerald-100 border border-emerald-200 px-3 py-2 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-emerald-800 font-semibold">
              ✓ Aplicado a Información Técnica
            </p>
            <p className="text-emerald-700 mt-0.5">
              Número de medidor: <span className="font-mono">{qf.reciboNumero}</span>
            </p>
            <p className="text-emerald-600/80 text-[10px] mt-0.5">
              El checklist se actualizó. Puedes verlo en la sección "Información Técnica" del expediente.
            </p>
          </div>
        </div>
      )}

      {qf.reciboSaved && !qf.reciboNumero && (
        <p className="text-xs text-green-700 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Subido como documento (sin extracción)
        </p>
      )}
    </div>
  )
}

// ─── Normal / IA-key item ─────────────────────────────────────────────────────

function NormalItem({ qf, expedienteId, onChange, onCustomName, onRemove, onUpdate, onRefresh, onRetry }: {
  qf: QueueFile
  expedienteId: string
  onChange: (t: DocumentoTipo) => void
  onCustomName: (n: string) => void
  onRemove: () => void
  onUpdate: (u: Partial<QueueFile>) => void
  onRefresh: () => void
  onRetry: () => void
}) {
  const isKey = qf.specialType === 'ia_key'
  const requireCustomName = qf.tipo === 'otro'
  const customNameMissing = requireCustomName && !qf.customNombre?.trim()
  // Extracción de medidor opcional cuando es foto y se eligió evidencia/fotografia
  const ofrecerMedidor =
    qf.file.type.startsWith('image/') &&
    (qf.tipo === 'fotografia' || qf.tipo === 'evidencia_visita') &&
    qf.status === 'pending' && !qf.applied

  async function handleExtraerMedidor() {
    onUpdate({ reciboProcessing: true, error: undefined })
    try {
      const fd = new FormData()
      fd.append('file', qf.file)
      fd.append('expediente_id', expedienteId)
      const r = await fetch('/api/ocr/medidor', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'No se pudo extraer')
      onUpdate({
        reciboProcessing: false,
        reciboNumero:    data.numero_medidor ?? null,
        reciboConfianza: data.confianza ?? '',
        error: data.numero_medidor ? undefined : 'No se encontró número de medidor en la foto',
      })
    } catch (e: any) {
      onUpdate({ reciboProcessing: false, error: e.message })
    }
  }

  async function handleConfirmarMedidor() {
    if (!qf.reciboNumero?.trim()) return
    onUpdate({ reciboProcessing: true })
    try {
      const r = await fetch('/api/expedientes/guardar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          numero_medidor: qf.reciboNumero.trim(),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'No se pudo guardar')
      onUpdate({ reciboProcessing: false, reciboSaved: true })
      onRefresh()
    } catch (e: any) {
      onUpdate({ reciboProcessing: false, error: e.message })
    }
  }

  return (
    <div className={`py-2.5 px-3 rounded-xl border transition-colors ${
      qf.status === 'error'    ? 'border-red-200 bg-red-50' :
      qf.applied               ? 'border-green-200 bg-green-50' :
      qf.status === 'analyzing'? 'border-purple-200 bg-purple-50' :
      qf.status === 'uploading'? 'border-brand-green/30 bg-brand-green-light/30' :
      isKey                    ? 'border-blue-200 bg-blue-50' :
      customNameMissing        ? 'border-amber-200 bg-amber-50' :
                                 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-white border border-gray-200">
        {qf.preview ? <img src={qf.preview} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-gray-400" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-700 truncate leading-tight">{qf.file.name}</p>
        <p className="text-[10px] text-gray-400">{formatBytes(qf.file.size)}</p>
      </div>

      {/* Center: tipo selector or status label */}
      {qf.status === 'analyzing' ? (
        <span className="text-xs text-purple-600 font-medium flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />Analizando con IA…
        </span>
      ) : qf.applied ? (
        <span className="text-xs text-green-700 font-medium flex items-center gap-1 flex-shrink-0">
          <CheckCircle className="w-3.5 h-3.5" />Aplicado al expediente
        </span>
      ) : (
        <select value={qf.tipo} onChange={e => onChange(e.target.value as DocumentoTipo)}
          // Permitimos cambiar el tipo también en estado 'error' — al cambiarlo
          // el item regresa a 'pending' (changeTipo limpia el error).
          disabled={qf.status !== 'pending' && qf.status !== 'error'}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green disabled:opacity-50 flex-shrink-0 max-w-[165px]">
          {TIPOS_LISTA.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
      )}

      {/* Status icon */}
      <div className="flex-shrink-0 w-5 flex items-center justify-center">
        {(qf.status === 'pending' || qf.status === 'error') && !qf.applied && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400" title="Quitar de la lista">
            <X className="w-4 h-4" />
          </button>
        )}
        {qf.status === 'uploading'  && <Loader2 className="w-4 h-4 text-brand-green animate-spin" />}
        {(qf.status === 'done' || qf.applied) && <CheckCircle className="w-4 h-4 text-green-500" />}
        {qf.status === 'error' && qf.applied && (
          <span title={qf.error} className="cursor-help"><AlertTriangle className="w-4 h-4 text-red-500" /></span>
        )}
      </div>
      </div>

      {/* Saltar IA (solo cuando es tipo IA-key y aún no se ha subido) */}
      {isKey && qf.status === 'pending' && (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => onUpdate({ specialType: 'none' })}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-medium underline underline-offset-2"
            title="Subir sin que la IA analice este documento"
          >
            Saltar IA y solo subir
          </button>
        </div>
      )}

      {/* Campo custom para "Otro" — visible también en error para que el usuario
          pueda corregir el nombre faltante sin tener que quitar y re-agregar el archivo. */}
      {requireCustomName && (qf.status === 'pending' || qf.status === 'error') && !qf.applied && (
        <div className="mt-2">
          <input
            type="text"
            value={qf.customNombre ?? ''}
            onChange={e => onCustomName(e.target.value)}
            placeholder="Describe el documento (obligatorio para 'Otro')"
            className="w-full text-xs border border-amber-300 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            maxLength={120}
          />
          {customNameMissing && (
            <p className="text-[10px] text-amber-700 mt-1">
              Escribe un nombre descriptivo para este documento.
            </p>
          )}
        </div>
      )}

      {/* Mensaje de error inline con botón Reintentar — mucho más visible
          que el tooltip del icono triangular. */}
      {qf.status === 'error' && qf.error && (
        <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-white px-2.5 py-1.5">
          <p className="text-[11px] text-red-700 leading-tight">
            <strong>Error:</strong> {qf.error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-[11px] text-red-700 hover:text-red-900 underline underline-offset-2 font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Extracción opcional de medidor para fotos (fotografia / evidencia_visita) */}
      {ofrecerMedidor && !qf.reciboNumero && !qf.reciboSaved && !qf.reciboProcessing && (
        <button
          type="button"
          onClick={handleExtraerMedidor}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-100"
        >
          <Sparkles className="w-3.5 h-3.5" />
          ¿Es foto del medidor? Extraer número con IA
        </button>
      )}
      {qf.reciboProcessing && (
        <div className="mt-2 flex items-center gap-2 text-xs text-teal-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando…
        </div>
      )}
      {qf.reciboNumero && !qf.reciboSaved && !qf.reciboProcessing && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-teal-800">
            La IA detectó este número. Verifica y confirma para aplicarlo a Información Técnica:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={qf.reciboNumero ?? ''}
              onChange={e => onUpdate({ reciboNumero: e.target.value, error: undefined })}
              className="flex-1 px-3 py-1.5 rounded-lg border border-teal-300 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Número de medidor"
            />
            <button
              type="button"
              onClick={handleConfirmarMedidor}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Aplicar
            </button>
          </div>
        </div>
      )}
      {qf.reciboSaved && qf.reciboNumero && (
        <div className="mt-2 rounded-lg bg-emerald-100 border border-emerald-200 px-3 py-2 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-emerald-800 font-semibold">✓ Aplicado a Información Técnica</p>
            <p className="text-emerald-700 mt-0.5">
              Número de medidor: <span className="font-mono">{qf.reciboNumero}</span>
            </p>
          </div>
        </div>
      )}
      {qf.error && qf.reciboNumero === undefined && qf.reciboProcessing === false && qf.specialType === 'none' && (
        <p className="mt-2 text-[10px] text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {qf.error}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubirDocumentosMasivo({ expedienteId }: Props) {
  const router  = useRouter()
  const [queue, setQueue]       = useState<QueueFile[]>([])
  const [uploading, setUploading] = useState(false)

  function updateItem(id: string, update: Partial<QueueFile>) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, ...update } : q))
  }

  const addFiles = useCallback((files: File[]) => {
    const nuevos: QueueFile[] = files.map(file => {
      const specialType = detectSpecialType(file)
      const baseTipo    = specialType === 'none' ? smartTipo(file) : 'otro'
      const isKey       = IA_KEY_TIPOS.includes(baseTipo as DocumentoTipo)
      return {
        id:          `${Date.now()}-${Math.random()}`,
        file,
        tipo:        baseTipo,
        specialType: specialType === 'none' && isKey ? 'ia_key' : specialType,
        status:      'pending',
        preview:     file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }
    })
    setQueue(prev => [...prev, ...nuevos])
  }, [])

  function removeItem(id: string) {
    setQueue(prev => {
      const item = prev.find(q => q.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter(q => q.id !== id)
    })
  }

  function changeTipo(id: string, tipo: DocumentoTipo) {
    const isKey = IA_KEY_TIPOS.includes(tipo)
    setQueue(prev => prev.map(q => q.id === id
      ? {
          ...q, tipo,
          specialType: isKey ? 'ia_key' : 'none',
          // Si estaba en error por tipo/nombre, limpiamos para que pueda
          // reintentarse al cambiar el tipo.
          ...(q.status === 'error' ? { status: 'pending' as const, error: undefined } : {}),
        }
      : q))
  }

  async function uploadOne(qf: QueueFile): Promise<void> {
    // Si tipo='otro' requiere customNombre obligatorio
    if (qf.tipo === 'otro' && !qf.customNombre?.trim()) {
      updateItem(qf.id, { status: 'error', error: 'Falta el nombre del documento' })
      return
    }
    const fd = new FormData()
    const nombreFinal = qf.tipo === 'otro' && qf.customNombre?.trim()
      ? qf.customNombre.trim()
      : qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name
    fd.append('file',          qf.file)
    fd.append('tipo',          qf.tipo)
    fd.append('nombre',        nombreFinal)
    fd.append('expediente_id', expedienteId)

    let documentoId: string | undefined
    try {
      const res  = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      documentoId = data.documento_id
    } catch (err: any) {
      updateItem(qf.id, { status: 'error', error: err.message })
      return
    }

    // For key IA types: auto-analyze then auto-apply
    if (qf.specialType === 'ia_key' && documentoId) {
      updateItem(qf.id, { status: 'analyzing', documentoId })
      try {
        const anaRes  = await fetch('/api/documentos/analizar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documento_id: documentoId }),
        })
        const anaData = await anaRes.json()
        if (!anaRes.ok) throw new Error(anaData.error ?? 'Error en análisis')

        const appRes = await fetch('/api/documentos/aplicar-ia', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documento_id: documentoId, tipo: qf.tipo, expediente_id: expedienteId }),
        })
        if (!appRes.ok) {
          const appData = await appRes.json()
          throw new Error(appData.error ?? 'Error al aplicar')
        }
        updateItem(qf.id, { status: 'done', applied: true })
      } catch (err: any) {
        // File was uploaded — mark done but note IA issue
        updateItem(qf.id, { status: 'done', error: `Subido, pero análisis IA falló: ${err.message}` })
      }
    } else {
      updateItem(qf.id, { status: 'done' })
    }
  }

  async function handleUploadAll() {
    const pending = queue.filter(q =>
      q.status === 'pending' && q.specialType !== 'ine' && q.specialType !== 'inversor_cert' && q.specialType !== 'recibo_cfe'
    )
    if (!pending.length) return

    setUploading(true)
    setQueue(prev => prev.map(q =>
      pending.some(p => p.id === q.id) ? { ...q, status: 'uploading' } : q
    ))

    for (let i = 0; i < pending.length; i += 3) {
      await Promise.all(pending.slice(i, i + 3).map(qf => uploadOne(qf)))
    }

    setUploading(false)
    setTimeout(() => {
      setQueue(prev => {
        prev.forEach(q => { if (q.preview && q.status === 'done') URL.revokeObjectURL(q.preview) })
        // Keep special items and error items; remove done normals
        return prev.filter(q =>
          q.specialType === 'ine' || q.specialType === 'inversor_cert' || q.specialType === 'recibo_cfe' || q.status !== 'done'
        )
      })
      router.refresh()
    }, 2500)
  }

  const pendingCount = queue.filter(q => q.status === 'pending' && q.specialType !== 'ine' && q.specialType !== 'inversor_cert' && q.specialType !== 'recibo_cfe').length
  const errorCount   = queue.filter(q => q.status === 'error').length
  const specialItems = queue.filter(q => q.specialType === 'ine' || q.specialType === 'inversor_cert' || q.specialType === 'recibo_cfe')
  const normalItems  = queue.filter(q => q.specialType === 'none' || q.specialType === 'ia_key')

  return (
    <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-brand-green" />
        Subir documentos
      </h4>

      <DropZone onFiles={addFiles} />

      {queue.length > 0 && (
        <div className="space-y-4">

          {/* Special items — INE / inversor */}
          {specialItems.length > 0 && (
            <div className="space-y-2">
              {specialItems.map(qf =>
                qf.specialType === 'ine'
                  ? <INEItem key={qf.id} qf={qf} onRemove={() => removeItem(qf.id)} onUpdate={u => updateItem(qf.id, u)} />
                  : qf.specialType === 'recibo_cfe'
                  ? <ReciboCFEItem key={qf.id} qf={qf} expedienteId={expedienteId} onRemove={() => removeItem(qf.id)} onUpdate={u => updateItem(qf.id, u)} onRefresh={() => router.refresh()} />
                  : <InversorItem key={qf.id} qf={qf} expedienteId={expedienteId} onRemove={() => removeItem(qf.id)} onUpdate={u => updateItem(qf.id, u)} onRefresh={() => router.refresh()} />
              )}
            </div>
          )}

          {/* Normal + IA-key items */}
          {normalItems.length > 0 && (
            <div className="space-y-2">
              {pendingCount > 0 && (
                <p className="text-xs text-gray-500">
                  {pendingCount} archivo{pendingCount !== 1 ? 's' : ''} — ajusta el tipo antes de subir
                  {normalItems.some(q => q.specialType === 'ia_key') && (
                    <span className="ml-1.5 text-blue-500 font-medium">· Los resaltados en azul se analizarán con IA y rellenarán el expediente</span>
                  )}
                </p>
              )}
              <div className="space-y-2">
                {normalItems.map(qf => (
                  <NormalItem
                    key={qf.id}
                    qf={qf}
                    expedienteId={expedienteId}
                    onChange={t => changeTipo(qf.id, t)}
                    onCustomName={n => {
                      // Si estaba en error porque faltaba el nombre, al captura
                      // lo regresamos a 'pending' para que pueda subir.
                      const limpiarError = qf.status === 'error' && n.trim().length > 0
                      updateItem(qf.id, {
                        customNombre: n,
                        ...(limpiarError ? { status: 'pending', error: undefined } : {}),
                      })
                    }}
                    onRemove={() => removeItem(qf.id)}
                    onUpdate={u => updateItem(qf.id, u)}
                    onRefresh={() => router.refresh()}
                    onRetry={() => updateItem(qf.id, { status: 'pending', error: undefined })}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleUploadAll} disabled={uploading || pendingCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</>
                    : <><UploadCloud className="w-4 h-4" /> Subir {pendingCount} archivo{pendingCount !== 1 ? 's' : ''}</>}
                </button>
                {errorCount > 0 && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />{errorCount} con error
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
