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
  contrato:           'Contrato',
  plano:              'Diagrama Unifilar',
  memoria_tecnica:    'Memoria de Cálculo',
  dictamen:           'Dictamen UVIE',
  acta:               'Acta de Inspección',
  lista_verificacion: 'Lista de Verificación',
  resolutivo:         'Resolutivo CFE',
  fotografia:         'Fotografía',
  certificado_cre:    'Certificado CNE',
  acuse_cre:          'Acuse CNE',
  evidencia_visita:   'Evidencia de Visita',
  otro:               'Otro',
}

const IA_KEY_TIPOS: DocumentoTipo[] = ['resolutivo', 'dictamen', 'plano', 'memoria_tecnica']

const TIPOS_LISTA: DocumentoTipo[] = [
  'acta', 'lista_verificacion', 'resolutivo', 'dictamen',
  'plano', 'memoria_tecnica', 'contrato', 'fotografia',
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
  if (file.type.startsWith('image/')) return 'fotografia'
  if (name.includes('acta'))                                  return 'acta'
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
  if (/recibo|estado.cuenta|factura.*cfe|cfe.*factura|recibo.*luz|luz.*cfe/.test(n)) return 'recibo_cfe'
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
      className={`cursor-pointer rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 py-8 px-6 text-center ${drag ? 'border-brand-green bg-brand-green-light scale-[1.01]' : 'border-gray-300 hover:border-brand-green/50 hover:bg-gray-50'}`}
    >
      <input id={uid} ref={ref} type="file" multiple className="hidden"
        onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = '' }} />
      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${drag ? 'bg-brand-green/20' : 'bg-gray-100'}`}>
        <UploadCloud className={`w-5 h-5 ${drag ? 'text-brand-green' : 'text-gray-400'}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{drag ? 'Suelta los archivos aquí' : 'Arrastra múltiples archivos o haz clic para seleccionar'}</p>
        <p className="text-xs text-gray-400 mt-0.5">PDFs, imágenes, Word, Excel — cualquier tipo · Sin límite</p>
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
      const p = data.participants?.[0]
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
        body: JSON.stringify({ participants: [{ ...qf.ineData, rol: 'testigo', _storageKey: qf.ineStorageKey }] }),
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
        <button onClick={handleAnalizar} disabled={qf.inversorAnalyzing}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50">
          {qf.inversorAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando con IA…</> : <><Sparkles className="w-3.5 h-3.5" /> Analizar inversor con IA</>}
        </button>
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
      onUpdate({
        reciboProcessing: false,
        reciboNumero:    data.numero_medidor ?? null,
        reciboConfianza: data.confianza ?? '',
        reciboSaved:     !!data.numero_medidor,
        status:          data.numero_medidor ? 'done' : 'error',
        error:           data.numero_medidor ? undefined : 'No se encontró número de medidor en el documento',
      })
      if (data.numero_medidor) onRefresh()
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
          <p className="text-[10px] text-teal-600 font-medium">Recibo CFE detectado — se extraerá el número de medidor</p>
        </div>
        {!qf.reciboSaved
          ? <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
      </div>

      {!qf.reciboSaved && !qf.reciboProcessing && (
        <button
          onClick={handleOCR}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
        >
          <Sparkles className="w-3.5 h-3.5" /> Extraer número de medidor con IA
        </button>
      )}

      {qf.reciboProcessing && (
        <div className="flex items-center gap-2 text-xs text-teal-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Leyendo recibo…
        </div>
      )}

      {qf.error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />{qf.error}
        </p>
      )}

      {qf.reciboSaved && qf.reciboNumero && (
        <div className="flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-green-700 font-semibold">
              Número de medidor guardado: <span className="font-mono">{qf.reciboNumero}</span>
            </p>
            {qf.reciboConfianza && (
              <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${confianzaColor}`}>
                Confianza: {qf.reciboConfianza}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Normal / IA-key item ─────────────────────────────────────────────────────

function NormalItem({ qf, onChange, onRemove }: {
  qf: QueueFile
  onChange: (t: DocumentoTipo) => void
  onRemove: () => void
}) {
  const isKey = qf.specialType === 'ia_key'

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
      qf.status === 'error'    ? 'border-red-200 bg-red-50' :
      qf.applied               ? 'border-green-200 bg-green-50' :
      qf.status === 'analyzing'? 'border-purple-200 bg-purple-50' :
      qf.status === 'uploading'? 'border-brand-green/30 bg-brand-green-light/30' :
      isKey                    ? 'border-blue-200 bg-blue-50' :
                                 'border-gray-200 bg-gray-50'
    }`}>
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
          disabled={qf.status !== 'pending'}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green disabled:opacity-50 flex-shrink-0 max-w-[165px]">
          {TIPOS_LISTA.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
      )}

      {/* Status icon */}
      <div className="flex-shrink-0 w-5 flex items-center justify-center">
        {qf.status === 'pending' && !qf.applied && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
        )}
        {qf.status === 'uploading'  && <Loader2 className="w-4 h-4 text-brand-green animate-spin" />}
        {(qf.status === 'done' || qf.applied) && <CheckCircle className="w-4 h-4 text-green-500" />}
        {qf.status === 'error' && <span title={qf.error} className="cursor-help"><AlertTriangle className="w-4 h-4 text-red-500" /></span>}
      </div>
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
      ? { ...q, tipo, specialType: isKey ? 'ia_key' : 'none' }
      : q))
  }

  async function uploadOne(qf: QueueFile): Promise<void> {
    const fd = new FormData()
    fd.append('file',          qf.file)
    fd.append('tipo',          qf.tipo)
    fd.append('nombre',        qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name)
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
                  <NormalItem key={qf.id} qf={qf} onChange={t => changeTipo(qf.id, t)} onRemove={() => removeItem(qf.id)} />
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
