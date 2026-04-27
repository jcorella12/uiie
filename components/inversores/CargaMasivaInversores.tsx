'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  X, Zap, ChevronDown, ChevronUp, RefreshCw, Save,
  FilePlus2, Link2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Extracted {
  marca: string
  modelo: string
  potencia_kw: number | null
  fase: 'monofasico' | 'trifasico' | 'bifasico' | string
  tipo: 'string' | 'microinversor' | 'hibrido' | string
  certificacion: 'ul1741' | 'ieee1547' | 'ninguna' | string
  eficiencia: number | null
  tension_ac: number | null
  corriente_max: number | null
  tipo_doc: 'ficha_tecnica' | 'certificado'
}

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

// ─── Label maps ───────────────────────────────────────────────────────────────
const FASE_OPTS = [
  { value: 'monofasico', label: 'Monofásico' },
  { value: 'bifasico',   label: 'Bifásico' },
  { value: 'trifasico',  label: 'Trifásico' },
]
const TIPO_OPTS = [
  { value: 'string',       label: 'String' },
  { value: 'microinversor',label: 'Microinversor' },
  { value: 'hibrido',      label: 'Híbrido' },
]
const CERT_OPTS = [
  { value: 'ul1741',  label: 'UL 1741' },
  { value: 'ieee1547',label: 'IEEE 1547' },
  { value: 'ninguna', label: 'Sin certificación' },
]
const DOC_OPTS = [
  { value: 'ficha_tecnica', label: 'Ficha técnica' },
  { value: 'certificado',   label: 'Certificado' },
]

const STATUS_COLOR: Record<FileStatus, string> = {
  pendiente: 'text-gray-400',
  escaneando:'text-blue-500',
  listo:     'text-amber-600',
  guardando: 'text-blue-500',
  guardado:  'text-green-600',
  error:     'text-red-500',
}
const STATUS_LABEL: Record<FileStatus, string> = {
  pendiente: 'Pendiente',
  escaneando:'Analizando con IA…',
  listo:     'Listo para guardar',
  guardando: 'Guardando…',
  guardado:  'Guardado ✓',
  error:     'Error',
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CargaMasivaInversores() {
  const [entries,    setEntries]    = useState<FileEntry[]>([])
  const [saving,     setSaving]     = useState(false)
  const [globalMsg,  setGlobalMsg]  = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // ── Update a single entry ─────────────────────────────────────────────────
  const update = useCallback((localId: string, patch: Partial<FileEntry>) => {
    setEntries(prev => prev.map(e => e.localId === localId ? { ...e, ...patch } : e))
  }, [])

  const updateExtracted = useCallback((localId: string, field: keyof Extracted, value: unknown) => {
    setEntries(prev => prev.map(e => {
      if (e.localId !== localId || !e.extracted) return e
      return { ...e, extracted: { ...e.extracted, [field]: value } }
    }))
  }, [])

  // ── Scan a single file with AI ────────────────────────────────────────────
  async function scanFile(entry: FileEntry) {
    update(entry.localId, { status: 'escaneando', errorMsg: null })
    try {
      const fd = new FormData()
      fd.append('file', entry.file)
      const res  = await fetch('/api/inversores/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar')

      if (data.multiple && Array.isArray(data.models)) {
        // Múltiples modelos en un mismo PDF → expandir en entradas independientes
        const nuevas: FileEntry[] = data.models.map((m: any) => ({
          localId: uid(),
          file: entry.file,
          status: 'listo' as FileStatus,
          extracted: m.extracted as Extracted,
          existingMatch: m.existingMatch ?? null,
          errorMsg: null,
          savedId: null,
          expanded: true,
        }))
        // Reemplazar la entrada original con las nuevas
        setEntries(prev => [
          ...prev.filter(e => e.localId !== entry.localId),
          ...nuevas,
        ])
      } else {
        update(entry.localId, {
          status: 'listo',
          extracted: data.extracted as Extracted,
          existingMatch: data.existingMatch ?? null,
        })
      }
    } catch (e: any) {
      update(entry.localId, { status: 'error', errorMsg: e.message })
    }
  }

  // ── Add files to queue ────────────────────────────────────────────────────
  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(
      f => f.type === 'application/pdf' || f.type.startsWith('image/')
    )
    if (arr.length === 0) return

    const newEntries: FileEntry[] = arr.map(file => ({
      localId: uid(),
      file,
      status: 'pendiente',
      extracted: null,
      existingMatch: null,
      errorMsg: null,
      savedId: null,
      expanded: true,
    }))

    setEntries(prev => [...prev, ...newEntries])

    // Auto-scan concurrently (max 3 at a time)
    const chunks: FileEntry[][] = []
    for (let i = 0; i < newEntries.length; i += 3) {
      chunks.push(newEntries.slice(i, i + 3))
    }
    for (const chunk of chunks) {
      await Promise.all(chunk.map(e => scanFile(e)))
    }
  }

  // ── Save all ready entries ────────────────────────────────────────────────
  async function saveAll() {
    const toSave = entries.filter(e => e.status === 'listo' && e.extracted)
    if (toSave.length === 0) return

    setSaving(true)
    setGlobalMsg(null)

    let saved = 0, failed = 0

    for (const entry of toSave) {
      update(entry.localId, { status: 'guardando' })
      try {
        const ext = entry.extracted!
        const fd  = new FormData()

        if (entry.existingMatch) fd.append('id', entry.existingMatch.id)
        fd.append('marca',        ext.marca ?? '')
        fd.append('modelo',       ext.modelo ?? '')
        fd.append('potencia_kw',  String(ext.potencia_kw ?? ''))
        fd.append('fase',         ext.fase ?? 'trifasico')
        fd.append('tipo',         ext.tipo ?? 'string')
        fd.append('certificacion',ext.certificacion ?? 'ninguna')
        if (ext.eficiencia   != null) fd.append('eficiencia',   String(ext.eficiencia))
        if (ext.tension_ac   != null) fd.append('tension_ac',   String(ext.tension_ac))
        if (ext.corriente_max != null) fd.append('corriente_max', String(ext.corriente_max))
        fd.append('activo', 'true')

        // Adjuntar el archivo en el campo correcto según tipo_doc
        if (ext.tipo_doc === 'certificado') {
          fd.append('certificado', entry.file)
        } else {
          fd.append('ficha_tecnica', entry.file)
        }

        const res  = await fetch('/api/inversores/guardar', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
        update(entry.localId, { status: 'guardado', savedId: data.id })
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

  // ── Drop handlers ─────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current?.classList.remove('border-brand-green', 'bg-green-50/40')
    addFiles(e.dataTransfer.files)
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current?.classList.add('border-brand-green', 'bg-green-50/40')
  }
  const onDragLeave = () => {
    dropRef.current?.classList.remove('border-brand-green', 'bg-green-50/40')
  }

  const pending = entries.filter(e => e.status === 'listo').length
  const done    = entries.filter(e => e.status === 'guardado').length

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carga masiva de inversores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube fichas técnicas y certificados — la IA extrae los datos automáticamente y registra cada inversor
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl px-8 py-10 cursor-pointer transition-colors hover:border-brand-green hover:bg-green-50/40"
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.multiple = true
          input.accept = 'application/pdf,image/*'
          input.onchange = e => addFiles((e.target as HTMLInputElement).files!)
          input.click()
        }}
      >
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center">
          <Upload className="w-7 h-7 text-brand-green" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">
            Arrastra tus archivos aquí o haz clic para seleccionarlos
          </p>
          <p className="text-sm text-gray-500 mt-1">
            PDF o imágenes · fichas técnicas y certificados · múltiples archivos a la vez
          </p>
        </div>
      </div>

      {/* Global message */}
      {globalMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          globalMsg.startsWith('✓')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {globalMsg.startsWith('✓')
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {globalMsg}
        </div>
      )}

      {/* Save all bar */}
      {pending > 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pending} archivo{pending !== 1 ? 's' : ''} listo{pending !== 1 ? 's' : ''} para guardar
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Revisa y edita los datos extraídos antes de confirmar
            </p>
          </div>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-green/90 disabled:opacity-60 transition-colors shrink-0"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              : <><Save className="w-4 h-4" /> Registrar todos</>
            }
          </button>
        </div>
      )}

      {/* File list */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {entries.length} archivo{entries.length !== 1 ? 's' : ''} ·&nbsp;
              {done} guardado{done !== 1 ? 's' : ''}
            </h2>
            <button
              type="button"
              onClick={() => setEntries([])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpiar lista
            </button>
          </div>

          {entries.map(entry => (
            <FileCard
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
        <div className="text-center py-8 text-gray-400">
          <Zap className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aún no has subido ningún archivo</p>
        </div>
      )}
    </div>
  )
}

// ─── File Card ────────────────────────────────────────────────────────────────
function FileCard({
  entry, onRescan, onRemove, onToggle, onFieldChange,
}: {
  entry: FileEntry
  onRescan: () => void
  onRemove: () => void
  onToggle: () => void
  onFieldChange: (id: string, field: keyof Extracted, val: unknown) => void
}) {
  const { localId, file, status, extracted, existingMatch, errorMsg, expanded } = entry

  const isNew      = !existingMatch
  const colorClass = STATUS_COLOR[status]

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      status === 'guardado' ? 'border-green-200 bg-green-50/30'
      : status === 'error'  ? 'border-red-200 bg-red-50/30'
      : 'border-gray-200 bg-white'
    }`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium ${colorClass} flex items-center gap-1`}>
              {status === 'escaneando' || status === 'guardando'
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : status === 'guardado'
                ? <CheckCircle2 className="w-3 h-3" />
                : status === 'error'
                ? <AlertCircle className="w-3 h-3" />
                : null
              }
              {STATUS_LABEL[status]}
            </span>
            {extracted && status !== 'guardado' && (
              <>
                <span className="text-gray-300">·</span>
                {isNew ? (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <FilePlus2 className="w-3 h-3" /> Nuevo inversor
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Actualiza {existingMatch?.marca} {existingMatch?.modelo}
                  </span>
                )}
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

      {/* Error message */}
      {errorMsg && (
        <div className="px-4 pb-3 text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}
        </div>
      )}

      {/* Extracted data form */}
      {extracted && expanded && status !== 'guardado' && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

            {/* Tipo doc */}
            <div className="col-span-2 sm:col-span-1">
              <label className="label text-xs">Tipo de documento</label>
              <select
                className="input-field text-sm py-1.5"
                value={extracted.tipo_doc ?? 'ficha_tecnica'}
                onChange={e => onFieldChange(localId, 'tipo_doc', e.target.value as any)}
              >
                {DOC_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="label text-xs">Marca *</label>
              <input className="input-field text-sm py-1.5"
                value={extracted.marca ?? ''} placeholder="Ej. SMA"
                onChange={e => onFieldChange(localId, 'marca', e.target.value)} />
            </div>

            {/* Modelo */}
            <div>
              <label className="label text-xs">Modelo *</label>
              <input className="input-field text-sm py-1.5"
                value={extracted.modelo ?? ''} placeholder="Ej. Sunny Boy 5.0"
                onChange={e => onFieldChange(localId, 'modelo', e.target.value)} />
            </div>

            {/* Potencia */}
            <div>
              <label className="label text-xs">Potencia (kW) *</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.01" min="0"
                value={extracted.potencia_kw ?? ''} placeholder="Ej. 5.0"
                onChange={e => onFieldChange(localId, 'potencia_kw', e.target.value ? Number(e.target.value) : null)} />
            </div>

            {/* Fase */}
            <div>
              <label className="label text-xs">Fase</label>
              <select className="input-field text-sm py-1.5"
                value={extracted.fase ?? 'trifasico'}
                onChange={e => onFieldChange(localId, 'fase', e.target.value)}>
                {FASE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="label text-xs">Tipo</label>
              <select className="input-field text-sm py-1.5"
                value={extracted.tipo ?? 'string'}
                onChange={e => onFieldChange(localId, 'tipo', e.target.value)}>
                {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Certificación */}
            <div>
              <label className="label text-xs">Certificación</label>
              <select className="input-field text-sm py-1.5"
                value={extracted.certificacion ?? 'ninguna'}
                onChange={e => onFieldChange(localId, 'certificacion', e.target.value)}>
                {CERT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Eficiencia */}
            <div>
              <label className="label text-xs">Eficiencia (%)</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.1" min="0" max="100"
                value={extracted.eficiencia ?? ''} placeholder="Ej. 97.5"
                onChange={e => onFieldChange(localId, 'eficiencia', e.target.value ? Number(e.target.value) : null)} />
            </div>

            {/* Tensión AC */}
            <div>
              <label className="label text-xs">Tensión AC (V)</label>
              <input className="input-field text-sm py-1.5" type="number" step="1"
                value={extracted.tension_ac ?? ''} placeholder="Ej. 220"
                onChange={e => onFieldChange(localId, 'tension_ac', e.target.value ? Number(e.target.value) : null)} />
            </div>

            {/* Corriente máx */}
            <div>
              <label className="label text-xs">Corriente máx. (A)</label>
              <input className="input-field text-sm py-1.5" type="number" step="0.1"
                value={extracted.corriente_max ?? ''} placeholder="Ej. 23"
                onChange={e => onFieldChange(localId, 'corriente_max', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>

          {/* Existing match notice */}
          {existingMatch && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              Se actualizará el inversor existente: <strong>{existingMatch.marca} {existingMatch.modelo}</strong>
            </p>
          )}
          {!existingMatch && (
            <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <FilePlus2 className="w-3.5 h-3.5 shrink-0" />
              Se creará un nuevo inversor en el catálogo
            </p>
          )}
        </div>
      )}

      {/* Saved state */}
      {status === 'guardado' && extracted && (
        <div className="px-4 pb-3 text-xs text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <strong>{extracted.marca} {extracted.modelo}</strong>
          {isNew ? ' — creado como nuevo inversor' : ' — actualizado'}
        </div>
      )}
    </div>
  )
}
