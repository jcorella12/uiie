'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, PenLine, Loader2, CheckCircle2,
  AlertCircle, Zap, FileText, FilePlus2, Link2,
  ChevronDown, ChevronUp, RefreshCw, X, Save,
} from 'lucide-react'

// ─── Shared types / opts ──────────────────────────────────────────────────────
interface Extracted {
  marca: string
  modelo: string
  potencia_kw: number | null
  fase: string
  tipo: string
  certificacion: string
  eficiencia: number | null
  tension_ac: number | null
  corriente_max: number | null
  tipo_doc: 'ficha_tecnica' | 'certificado'
}

const FASE_OPTS = [
  { value: 'monofasico', label: 'Monofásico' },
  { value: 'bifasico',   label: 'Bifásico' },
  { value: 'trifasico',  label: 'Trifásico' },
]
const TIPO_OPTS = [
  { value: 'string',        label: 'String' },
  { value: 'microinversor', label: 'Microinversor' },
  { value: 'hibrido',       label: 'Híbrido' },
]
const CERT_OPTS = [
  { value: 'ul1741',   label: 'UL 1741' },
  { value: 'ieee1547', label: 'IEEE 1547' },
  { value: 'ninguna',  label: 'Sin certificación' },
]
const DOC_OPTS = [
  { value: 'ficha_tecnica', label: 'Ficha técnica' },
  { value: 'certificado',   label: 'Certificado' },
]

// ─── Manual form ──────────────────────────────────────────────────────────────
function ManualForm({ onSaved }: { onSaved: (marca: string, modelo: string) => void }) {
  const empty = {
    marca: '', modelo: '', potencia_kw: '', fase: 'trifasico',
    tipo: 'string', certificacion: 'ninguna',
    eficiencia: '', tension_ac: '', corriente_max: '',
  }
  const [form, setForm] = useState(empty)
  const [fichaTecnica, setFichaTecnica] = useState<File | null>(null)
  const [certificado, setCertificado]   = useState<File | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.marca.trim() || !form.modelo.trim() || !form.potencia_kw) {
      setError('Marca, modelo y potencia son obligatorios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('marca',         form.marca.trim())
      fd.append('modelo',        form.modelo.trim())
      fd.append('potencia_kw',   form.potencia_kw)
      fd.append('fase',          form.fase)
      fd.append('tipo',          form.tipo)
      fd.append('certificacion', form.certificacion)
      if (form.eficiencia)    fd.append('eficiencia',    form.eficiencia)
      if (form.tension_ac)    fd.append('tension_ac',    form.tension_ac)
      if (form.corriente_max) fd.append('corriente_max', form.corriente_max)
      fd.append('activo', 'true')
      if (fichaTecnica) fd.append('ficha_tecnica', fichaTecnica)
      if (certificado)  fd.append('certificado',   certificado)

      const res = await fetch('/api/inversores/guardar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      setForm(empty)
      setFichaTecnica(null)
      setCertificado(null)
      onSaved(data.marca, data.modelo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Marca */}
        <div>
          <label className="label">Marca *</label>
          <input className="input-field" placeholder="Ej. SMA" value={form.marca} onChange={set('marca')} required />
        </div>
        {/* Modelo */}
        <div>
          <label className="label">Modelo *</label>
          <input className="input-field" placeholder="Ej. Sunny Boy 5.0" value={form.modelo} onChange={set('modelo')} required />
        </div>
        {/* Potencia */}
        <div>
          <label className="label">Potencia (kW) *</label>
          <input className="input-field" type="number" step="0.01" min="0" placeholder="Ej. 5.0"
            value={form.potencia_kw} onChange={set('potencia_kw')} required />
        </div>
        {/* Fase */}
        <div>
          <label className="label">Fase</label>
          <select className="input-field" value={form.fase} onChange={set('fase')}>
            {FASE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* Tipo */}
        <div>
          <label className="label">Tipo</label>
          <select className="input-field" value={form.tipo} onChange={set('tipo')}>
            {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* Certificación */}
        <div>
          <label className="label">Certificación</label>
          <select className="input-field" value={form.certificacion} onChange={set('certificacion')}>
            {CERT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* Eficiencia */}
        <div>
          <label className="label">Eficiencia (%)</label>
          <input className="input-field" type="number" step="0.1" min="0" max="100"
            placeholder="Ej. 97.5" value={form.eficiencia} onChange={set('eficiencia')} />
        </div>
        {/* Tensión AC */}
        <div>
          <label className="label">Tensión AC (V)</label>
          <input className="input-field" type="number" step="1"
            placeholder="Ej. 220" value={form.tension_ac} onChange={set('tension_ac')} />
        </div>
        {/* Corriente máx */}
        <div>
          <label className="label">Corriente máx. (A)</label>
          <input className="input-field" type="number" step="0.1"
            placeholder="Ej. 23" value={form.corriente_max} onChange={set('corriente_max')} />
        </div>
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Ficha técnica (PDF)</label>
          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${fichaTecnica ? 'border-brand-green bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
            <FileText className={`w-4 h-4 shrink-0 ${fichaTecnica ? 'text-brand-green' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600 truncate">
              {fichaTecnica ? fichaTecnica.name : 'Seleccionar PDF…'}
            </span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => setFichaTecnica(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div>
          <label className="label">Certificado (PDF)</label>
          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${certificado ? 'border-brand-green bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
            <FileText className={`w-4 h-4 shrink-0 ${certificado ? 'text-brand-green' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600 truncate">
              {certificado ? certificado.name : 'Seleccionar PDF…'}
            </span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => setCertificado(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : <><CheckCircle2 className="w-4 h-4" /> Guardar inversor</>
          }
        </button>
      </div>
    </form>
  )
}

// ─── AI upload tab (copy of CargaMasivaInversores logic, trimmed) ─────────────
type FileStatus = 'pendiente' | 'escaneando' | 'listo' | 'guardando' | 'guardado' | 'error'

interface FileEntry {
  localId: string
  file: File
  status: FileStatus
  extracted: Extracted | null
  existingMatch: { id: string; marca: string; modelo: string } | null
  errorMsg: string | null
  savedId: string | null
  expanded: boolean
}

const STATUS_COLOR: Record<FileStatus, string> = {
  pendiente: 'text-gray-400', escaneando: 'text-blue-500', listo: 'text-amber-600',
  guardando: 'text-blue-500', guardado:   'text-green-600', error: 'text-red-500',
}
const STATUS_LABEL: Record<FileStatus, string> = {
  pendiente: 'Pendiente', escaneando: 'Analizando con IA…', listo: 'Listo para guardar',
  guardando: 'Guardando…', guardado: 'Guardado ✓', error: 'Error',
}

function uid() { return Math.random().toString(36).slice(2) }

function AIUpload({ onSaved }: { onSaved: (marca: string, modelo: string) => void }) {
  const [entries,   setEntries]   = useState<FileEntry[]>([])
  const [saving,    setSaving]    = useState(false)
  const [globalMsg, setGlobalMsg] = useState<string | null>(null)

  const update = (localId: string, patch: Partial<FileEntry>) =>
    setEntries(prev => prev.map(e => e.localId === localId ? { ...e, ...patch } : e))

  const updateExtracted = (localId: string, field: keyof Extracted, value: unknown) =>
    setEntries(prev => prev.map(e =>
      e.localId !== localId || !e.extracted ? e : { ...e, extracted: { ...e.extracted, [field]: value } }
    ))

  async function scanFile(entry: FileEntry) {
    update(entry.localId, { status: 'escaneando', errorMsg: null })
    try {
      const fd = new FormData()
      fd.append('file', entry.file)
      const res  = await fetch('/api/inversores/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar')

      if (data.multiple && Array.isArray(data.models)) {
        // Multi-model certificate: expand into one entry per model
        const expanded: FileEntry[] = data.models.map((m: { extracted: Extracted; existingMatch: any }) => ({
          localId:       uid(),
          file:          entry.file,
          status:        'listo' as FileStatus,
          extracted:     m.extracted,
          existingMatch: m.existingMatch ?? null,
          errorMsg:      null,
          savedId:       null,
          expanded:      true,
        }))
        // Replace the placeholder entry with all expanded entries
        setEntries(prev => {
          const idx = prev.findIndex(e => e.localId === entry.localId)
          if (idx === -1) return [...prev, ...expanded]
          return [...prev.slice(0, idx), ...expanded, ...prev.slice(idx + 1)]
        })
      } else {
        update(entry.localId, { status: 'listo', extracted: data.extracted, existingMatch: data.existingMatch ?? null })
      }
    } catch (e: any) {
      update(entry.localId, { status: 'error', errorMsg: e.message })
    }
  }

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'))
    if (!arr.length) return
    const newEntries: FileEntry[] = arr.map(file => ({
      localId: uid(), file, status: 'pendiente', extracted: null,
      existingMatch: null, errorMsg: null, savedId: null, expanded: true,
    }))
    setEntries(prev => [...prev, ...newEntries])
    const chunks: FileEntry[][] = []
    for (let i = 0; i < newEntries.length; i += 3) chunks.push(newEntries.slice(i, i + 3))
    for (const chunk of chunks) await Promise.all(chunk.map(e => scanFile(e)))
  }

  async function saveAll() {
    const toSave = entries.filter(e => e.status === 'listo' && e.extracted)
    if (!toSave.length) return
    setSaving(true)
    setGlobalMsg(null)
    let saved = 0, failed = 0
    for (const entry of toSave) {
      update(entry.localId, { status: 'guardando' })
      try {
        const ext = entry.extracted!
        const fd  = new FormData()
        if (entry.existingMatch) fd.append('id', entry.existingMatch.id)
        fd.append('marca',         ext.marca ?? '')
        fd.append('modelo',        ext.modelo ?? '')
        fd.append('potencia_kw',   String(ext.potencia_kw ?? ''))
        fd.append('fase',          ext.fase ?? 'trifasico')
        fd.append('tipo',          ext.tipo ?? 'string')
        fd.append('certificacion', ext.certificacion ?? 'ninguna')
        if (ext.eficiencia    != null) fd.append('eficiencia',    String(ext.eficiencia))
        if (ext.tension_ac    != null) fd.append('tension_ac',    String(ext.tension_ac))
        if (ext.corriente_max != null) fd.append('corriente_max', String(ext.corriente_max))
        fd.append('activo', 'true')
        if (ext.tipo_doc === 'certificado') fd.append('certificado', entry.file)
        else fd.append('ficha_tecnica', entry.file)
        const res  = await fetch('/api/inversores/guardar', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
        update(entry.localId, { status: 'guardado', savedId: data.id })
        onSaved(data.marca, data.modelo)
        saved++
      } catch (e: any) {
        update(entry.localId, { status: 'error', errorMsg: e.message })
        failed++
      }
    }
    setSaving(false)
    setGlobalMsg(
      failed === 0
        ? `✓ ${saved} inversor${saved !== 1 ? 'es' : ''} guardado${saved !== 1 ? 's' : ''} correctamente`
        : `${saved} guardados, ${failed} con error`
    )
  }

  const pending = entries.filter(e => e.status === 'listo').length
  const done    = entries.filter(e => e.status === 'guardado').length

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl px-8 py-10 cursor-pointer transition-colors hover:border-brand-green hover:bg-green-50/40"
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => {
          const inp = document.createElement('input')
          inp.type = 'file'; inp.multiple = true; inp.accept = 'application/pdf,image/*'
          inp.onchange = e => addFiles((e.target as HTMLInputElement).files!)
          inp.click()
        }}
      >
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center">
          <Upload className="w-7 h-7 text-brand-green" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Arrastra tus archivos aquí o haz clic</p>
          <p className="text-sm text-gray-500 mt-1">PDF o imágenes · fichas técnicas y/o certificados · varios a la vez</p>
        </div>
      </div>

      {/* Global msg */}
      {globalMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${globalMsg.startsWith('✓') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
          {globalMsg.startsWith('✓') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {globalMsg}
        </div>
      )}

      {/* Save all bar */}
      {pending > 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-amber-900">{pending} archivo{pending !== 1 ? 's' : ''} listo{pending !== 1 ? 's' : ''} para guardar</p>
            <p className="text-xs text-amber-700 mt-0.5">Revisa y edita los datos extraídos antes de confirmar</p>
          </div>
          <button type="button" onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-green/90 disabled:opacity-60 transition-colors shrink-0">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : <><Save className="w-4 h-4" /> Registrar todos</>}
          </button>
        </div>
      )}

      {/* File cards */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {entries.length} modelo{entries.length !== 1 ? 's' : ''} detectado{entries.length !== 1 ? 's' : ''} · {done} guardado{done !== 1 ? 's' : ''}
            </h3>
            <button type="button" onClick={() => setEntries([])} className="text-xs text-gray-400 hover:text-gray-600">Limpiar lista</button>
          </div>
          {entries.map(entry => (
            <AIFileCard
              key={entry.localId}
              entry={entry}
              onRescan={() => scanFile(entry)}
              onRemove={() => setEntries(prev => prev.filter(e => e.localId !== entry.localId))}
              onToggle={() => update(entry.localId, { expanded: !entry.expanded })}
              onFieldChange={updateExtracted}
            />
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aún no has subido ningún archivo</p>
        </div>
      )}
    </div>
  )
}

function AIFileCard({
  entry, onRescan, onRemove, onToggle, onFieldChange,
}: {
  entry: FileEntry
  onRescan: () => void
  onRemove: () => void
  onToggle: () => void
  onFieldChange: (id: string, field: keyof Extracted, val: unknown) => void
}) {
  const { localId, file, status, extracted, existingMatch, errorMsg, expanded } = entry
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${status === 'guardado' ? 'border-green-200 bg-green-50/30' : status === 'error' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium ${STATUS_COLOR[status]} flex items-center gap-1`}>
              {(status === 'escaneando' || status === 'guardando') ? <Loader2 className="w-3 h-3 animate-spin" />
               : status === 'guardado' ? <CheckCircle2 className="w-3 h-3" />
               : status === 'error'    ? <AlertCircle   className="w-3 h-3" /> : null}
              {STATUS_LABEL[status]}
            </span>
            {extracted && status !== 'guardado' && (
              <>
                <span className="text-gray-300">·</span>
                {!existingMatch
                  ? <span className="text-xs text-blue-600 flex items-center gap-1"><FilePlus2 className="w-3 h-3" /> Nuevo inversor</span>
                  : <span className="text-xs text-amber-600 flex items-center gap-1"><Link2 className="w-3 h-3" /> Actualiza {existingMatch.marca} {existingMatch.modelo}</span>
                }
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {status === 'error' && (
            <button type="button" onClick={onRescan} title="Reintentar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {['listo', 'error'].includes(status) && (
            <button type="button" onClick={onRemove} title="Quitar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {extracted && (
            <button type="button" onClick={onToggle}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 pb-3 text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}
        </div>
      )}

      {extracted && expanded && status !== 'guardado' && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label text-xs">Tipo de documento</label>
              <select className="input-field text-sm py-1.5" value={extracted.tipo_doc ?? 'ficha_tecnica'}
                onChange={e => onFieldChange(localId, 'tipo_doc', e.target.value)}>
                {DOC_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Marca *</label>
              <input className="input-field text-sm py-1.5" value={extracted.marca ?? ''} placeholder="Ej. SMA"
                onChange={e => onFieldChange(localId, 'marca', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Modelo *</label>
              <input className="input-field text-sm py-1.5" value={extracted.modelo ?? ''} placeholder="Ej. Sunny Boy"
                onChange={e => onFieldChange(localId, 'modelo', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Potencia (kW) *</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.01" min="0"
                value={extracted.potencia_kw ?? ''} onChange={e => onFieldChange(localId, 'potencia_kw', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="label text-xs">Fase</label>
              <select className="input-field text-sm py-1.5" value={extracted.fase ?? 'trifasico'}
                onChange={e => onFieldChange(localId, 'fase', e.target.value)}>
                {FASE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Tipo</label>
              <select className="input-field text-sm py-1.5" value={extracted.tipo ?? 'string'}
                onChange={e => onFieldChange(localId, 'tipo', e.target.value)}>
                {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Certificación</label>
              <select className="input-field text-sm py-1.5" value={extracted.certificacion ?? 'ninguna'}
                onChange={e => onFieldChange(localId, 'certificacion', e.target.value)}>
                {CERT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Eficiencia (%)</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.1" min="0" max="100"
                value={extracted.eficiencia ?? ''} onChange={e => onFieldChange(localId, 'eficiencia', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="label text-xs">Tensión AC (V)</label>
              <input className="input-field text-sm py-1.5" type="number" step="1"
                value={extracted.tension_ac ?? ''} onChange={e => onFieldChange(localId, 'tension_ac', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="label text-xs">Corriente máx. (A)</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.1"
                value={extracted.corriente_max ?? ''} onChange={e => onFieldChange(localId, 'corriente_max', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          {existingMatch
            ? <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 shrink-0" />Se actualizará el inversor existente: <strong>{existingMatch.marca} {existingMatch.modelo}</strong></p>
            : <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><FilePlus2 className="w-3.5 h-3.5 shrink-0" />Se creará un nuevo inversor en el catálogo compartido</p>
          }
        </div>
      )}

      {status === 'guardado' && extracted && (
        <div className="px-4 pb-3 text-xs text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <strong>{extracted.marca} {extracted.modelo}</strong>
          {!existingMatch ? ' — creado como nuevo inversor' : ' — actualizado'}
        </div>
      )}
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────
type Tab = 'ia' | 'manual'

export default function AgregarInversor({ backHref }: { backHref: string }) {
  const [tab,      setTab]      = useState<Tab>('ia')
  const [successes,setSuccesses]= useState<{ marca: string; modelo: string }[]>([])

  function onSaved(marca: string, modelo: string) {
    setSuccesses(prev => [{ marca, modelo }, ...prev])
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={backHref}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar inversor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Los inversores se agregan al catálogo compartido y quedan disponibles para todos
          </p>
        </div>
      </div>

      {/* Success log */}
      {successes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {successes.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <strong>{s.marca} {s.modelo}</strong> guardado en el catálogo
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('ia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'ia' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Upload className="w-3.5 h-3.5" />
          Subir con IA
        </button>
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PenLine className="w-3.5 h-3.5" />
          Captura manual
        </button>
      </div>

      {/* Tab content */}
      <div className="card">
        {tab === 'ia' ? (
          <>
            <p className="text-sm text-gray-600 mb-5">
              Sube la ficha técnica o el certificado del inversor en PDF o imagen. La IA extrae los datos automáticamente.
              Puedes revisar y corregir antes de guardar.
            </p>
            <AIUpload onSaved={onSaved} />
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-5">
              Ingresa los datos del inversor manualmente. Puedes adjuntar la ficha técnica y/o certificado en PDF.
            </p>
            <ManualForm onSaved={onSaved} />
          </>
        )}
      </div>
    </div>
  )
}
