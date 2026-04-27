'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle2, Upload, X, Loader2, FileText, Image, File,
  AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'

interface SavedData {
  cli_marca_paneles?:     string | null
  cli_modelo_paneles?:    string | null
  cli_num_paneles?:       number | null
  cli_potencia_panel_wp?: number | null
  cli_marca_inversor?:    string | null
  cli_modelo_inversor?:   string | null
  cli_capacidad_kw?:      number | null
  cli_num_inversores?:    number | null
  cli_num_medidor?:       string | null
  cli_direccion?:         string | null
  cli_notas?:             string | null
  cli_completado_at?:     string | null
}

interface ClienteDoc {
  id:        string
  nombre:    string
  tipo:      string
  publicUrl?: string | null
}

interface Props {
  expedienteId: string
  isLocked:     boolean
  saved?:       SavedData
  clienteDocs?: ClienteDoc[]
}

const DOCUMENT_SLOTS: { tipo: string; label: string; multiple?: boolean; optional?: boolean }[] = [
  { tipo: 'diagrama',             label: 'Diagrama unifilar' },
  { tipo: 'certificado_inversor', label: 'Certificado del inversor(es)', multiple: true },
  { tipo: 'dictamen_uvie',        label: 'Dictamen de la UVIE' },
  { tipo: 'oficio_resolutivo',    label: 'Oficio Resolutivo' },
  { tipo: 'recibo_cfe',           label: 'Recibo de CFE' },
  { tipo: 'ine_participante',     label: 'INEs de testigos y participantes', multiple: true },
  { tipo: 'memoria_calculo',      label: 'Memoria de cálculo', optional: true },
]

function fileIcon(nombre: string) {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext))
    return <Image className="w-4 h-4 text-blue-500 shrink-0" />
  if (ext === 'pdf')
    return <FileText className="w-4 h-4 text-red-500 shrink-0" />
  return <File className="w-4 h-4 text-gray-400 shrink-0" />
}

export default function ExpedientePrecarga({ expedienteId, isLocked, saved, clienteDocs }: Props) {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    cli_marca_paneles:     saved?.cli_marca_paneles     ?? '',
    cli_modelo_paneles:    saved?.cli_modelo_paneles    ?? '',
    cli_num_paneles:       saved?.cli_num_paneles       != null ? String(saved.cli_num_paneles)       : '',
    cli_potencia_panel_wp: saved?.cli_potencia_panel_wp != null ? String(saved.cli_potencia_panel_wp) : '',
    cli_marca_inversor:    saved?.cli_marca_inversor    ?? '',
    cli_modelo_inversor:   saved?.cli_modelo_inversor   ?? '',
    cli_capacidad_kw:      saved?.cli_capacidad_kw      != null ? String(saved.cli_capacidad_kw)      : '',
    cli_num_inversores:    saved?.cli_num_inversores    != null ? String(saved.cli_num_inversores)    : '',
    cli_num_medidor:       saved?.cli_num_medidor       ?? '',
    cli_direccion:         saved?.cli_direccion         ?? '',
    cli_notas:             saved?.cli_notas             ?? '',
  })
  const [saving,      setSaving]      = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  // ── Docs state ──────────────────────────────────────────────────────────────
  const [docs, setDocs] = useState<ClienteDoc[]>(clienteDocs ?? [])
  // uploading set per tipo
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadError, setUploadError] = useState<Record<string, string | null>>({})
  // deleting set per doc id
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  // ── Save form ────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const res = await fetch('/api/cliente/expediente/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id:         expedienteId,
          cli_marca_paneles:     form.cli_marca_paneles     || null,
          cli_modelo_paneles:    form.cli_modelo_paneles    || null,
          cli_num_paneles:       form.cli_num_paneles       ? Number(form.cli_num_paneles)       : null,
          cli_potencia_panel_wp: form.cli_potencia_panel_wp ? Number(form.cli_potencia_panel_wp) : null,
          cli_marca_inversor:    form.cli_marca_inversor    || null,
          cli_modelo_inversor:   form.cli_modelo_inversor   || null,
          cli_capacidad_kw:      form.cli_capacidad_kw      ? Number(form.cli_capacidad_kw)      : null,
          cli_num_inversores:    form.cli_num_inversores    ? Number(form.cli_num_inversores)    : null,
          cli_num_medidor:       form.cli_num_medidor       || null,
          cli_direccion:         form.cli_direccion         || null,
          cli_notas:             form.cli_notas             || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? 'Error al guardar')
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 4000)
      }
    } catch {
      setSaveError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Upload file ──────────────────────────────────────────────────────────────
  async function handleFileChange(tipo: string, files: FileList | null) {
    if (!files || files.length === 0) return

    setUploadError(prev => ({ ...prev, [tipo]: null }))

    for (const file of Array.from(files)) {
      setUploading(prev => ({ ...prev, [tipo]: true }))
      try {
        const fd = new FormData()
        fd.append('file',          file)
        fd.append('expediente_id', expedienteId)
        fd.append('tipo',          tipo)
        fd.append('nombre',        file.name)

        const res  = await fetch('/api/cliente/documentos/upload', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) {
          setUploadError(prev => ({ ...prev, [tipo]: data.error ?? 'Error al subir el archivo' }))
        } else {
          setDocs(prev => [...prev, data.doc])
        }
      } catch {
        setUploadError(prev => ({ ...prev, [tipo]: 'Error de conexión. Intenta de nuevo.' }))
      } finally {
        setUploading(prev => ({ ...prev, [tipo]: false }))
        // Limpiar el input para permitir re-subir el mismo archivo
        if (fileInputRefs.current[tipo]) {
          fileInputRefs.current[tipo]!.value = ''
        }
      }
    }
  }

  // ── Delete doc ───────────────────────────────────────────────────────────────
  async function handleDelete(docId: string) {
    setDeleting(prev => ({ ...prev, [docId]: true }))
    try {
      const res  = await fetch('/api/cliente/documentos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId }),
      })
      const data = await res.json()
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== docId))
      } else {
        console.error('Error eliminando documento:', data.error)
      }
    } catch {
      console.error('Error de conexión al eliminar documento')
    } finally {
      setDeleting(prev => ({ ...prev, [docId]: false }))
    }
  }

  // ── LOCKED VIEW ──────────────────────────────────────────────────────────────
  if (isLocked) {
    const hasSavedData = saved && Object.values(saved).some(v => v !== null && v !== undefined && v !== '')

    return (
      <div className="space-y-4">
        {/* Banner */}
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Información recibida — el inspector está revisando tu expediente.
          </p>
        </div>

        {/* Datos guardados */}
        {hasSavedData && (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Datos de la Instalación</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {saved?.cli_marca_paneles && (
                <div><p className="label text-xs">Marca paneles</p><p className="text-gray-800">{saved.cli_marca_paneles}</p></div>
              )}
              {saved?.cli_modelo_paneles && (
                <div><p className="label text-xs">Modelo paneles</p><p className="text-gray-800">{saved.cli_modelo_paneles}</p></div>
              )}
              {saved?.cli_num_paneles != null && (
                <div><p className="label text-xs">Cantidad paneles</p><p className="text-gray-800">{saved.cli_num_paneles}</p></div>
              )}
              {saved?.cli_potencia_panel_wp != null && (
                <div><p className="label text-xs">Potencia por panel (Wp)</p><p className="text-gray-800">{saved.cli_potencia_panel_wp}</p></div>
              )}
              {saved?.cli_marca_inversor && (
                <div><p className="label text-xs">Marca inversor</p><p className="text-gray-800">{saved.cli_marca_inversor}</p></div>
              )}
              {saved?.cli_modelo_inversor && (
                <div><p className="label text-xs">Modelo inversor</p><p className="text-gray-800">{saved.cli_modelo_inversor}</p></div>
              )}
              {saved?.cli_capacidad_kw != null && (
                <div><p className="label text-xs">Capacidad (kW)</p><p className="text-gray-800">{saved.cli_capacidad_kw}</p></div>
              )}
              {saved?.cli_num_inversores != null && (
                <div><p className="label text-xs">Cantidad inversores</p><p className="text-gray-800">{saved.cli_num_inversores}</p></div>
              )}
              {saved?.cli_num_medidor && (
                <div className="col-span-2"><p className="label text-xs">Número de medidor CFE</p><p className="text-gray-800">{saved.cli_num_medidor}</p></div>
              )}
              {saved?.cli_direccion && (
                <div className="col-span-2"><p className="label text-xs">Dirección completa</p><p className="text-gray-800">{saved.cli_direccion}</p></div>
              )}
              {saved?.cli_notas && (
                <div className="col-span-2"><p className="label text-xs">Notas adicionales</p><p className="text-gray-800 whitespace-pre-wrap">{saved.cli_notas}</p></div>
              )}
            </div>
          </div>
        )}

        {/* Documentos del cliente en modo lectura */}
        {docs.length > 0 && (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Documentos Enviados</h2>
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {fileIcon(doc.nombre)}
                    <span className="text-sm text-gray-700 truncate">{doc.nombre}</span>
                  </div>
                  {doc.publicUrl && (
                    <a
                      href={doc.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-green hover:underline font-medium shrink-0"
                    >
                      Ver
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── UNLOCKED VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Sección 1: Datos de la Instalación ── */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Datos de la Instalación</h2>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Paneles */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Paneles fotovoltaicos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Marca</label>
                <input
                  className="input-field"
                  placeholder="Ej. Canadian Solar"
                  value={form.cli_marca_paneles}
                  onChange={set('cli_marca_paneles')}
                />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input
                  className="input-field"
                  placeholder="Ej. CS6R-410MS"
                  value={form.cli_modelo_paneles}
                  onChange={set('cli_modelo_paneles')}
                />
              </div>
              <div>
                <label className="label">Cantidad de paneles</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  placeholder="Ej. 12"
                  value={form.cli_num_paneles}
                  onChange={set('cli_num_paneles')}
                />
              </div>
              <div>
                <label className="label">Potencia por panel (Wp)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 410"
                  value={form.cli_potencia_panel_wp}
                  onChange={set('cli_potencia_panel_wp')}
                />
              </div>
            </div>
          </div>

          {/* Inversores */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Inversor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Marca</label>
                <input
                  className="input-field"
                  placeholder="Ej. SolarEdge"
                  value={form.cli_marca_inversor}
                  onChange={set('cli_marca_inversor')}
                />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input
                  className="input-field"
                  placeholder="Ej. SE5000H"
                  value={form.cli_modelo_inversor}
                  onChange={set('cli_modelo_inversor')}
                />
              </div>
              <div>
                <label className="label">Capacidad (kW)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 5.0"
                  value={form.cli_capacidad_kw}
                  onChange={set('cli_capacidad_kw')}
                />
              </div>
              <div>
                <label className="label">Cantidad de inversores</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  placeholder="Ej. 1"
                  value={form.cli_num_inversores}
                  onChange={set('cli_num_inversores')}
                />
              </div>
            </div>
          </div>

          {/* Medidor y dirección */}
          <div>
            <label className="label">Número de medidor CFE</label>
            <input
              className="input-field"
              placeholder="Ej. 1234567890"
              value={form.cli_num_medidor}
              onChange={set('cli_num_medidor')}
            />
          </div>
          <div>
            <label className="label">Dirección completa de la instalación</label>
            <input
              className="input-field"
              placeholder="Calle, número, colonia, municipio, estado"
              value={form.cli_direccion}
              onChange={set('cli_direccion')}
            />
          </div>
          <div>
            <label className="label">Notas adicionales</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Información adicional relevante para el inspector..."
              value={form.cli_notas}
              onChange={set('cli_notas')}
            />
          </div>

          {/* Botón guardar */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                'Guardar información'
              )}
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                ¡Información guardada correctamente
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── Sección 2: Documentos ── */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Documentos</h2>
        <div className="space-y-5">
          {DOCUMENT_SLOTS.map(slot => {
            const slotDocs    = docs.filter(d => d.tipo === slot.tipo)
            const isUploading = uploading[slot.tipo]
            const slotError   = uploadError[slot.tipo]

            return (
              <div key={slot.tipo}>
                <p className="label mb-2">
                  {slot.label}
                  {slot.optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
                </p>

                {/* Lista de archivos existentes */}
                {slotDocs.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {slotDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {fileIcon(doc.nombre)}
                          {doc.publicUrl ? (
                            <a
                              href={doc.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-brand-green hover:underline truncate"
                            >
                              {doc.nombre}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-700 truncate">{doc.nombre}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting[doc.id]}
                          className="shrink-0 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Eliminar documento"
                        >
                          {deleting[doc.id]
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <X className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zona de carga */}
                <div
                  className="relative flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:border-brand-green hover:bg-green-50/40 transition-colors"
                  onClick={() => fileInputRefs.current[slot.tipo]?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    handleFileChange(slot.tipo, e.dataTransfer.files)
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-gray-400" />
                  )}
                  <p className="text-xs text-gray-500">
                    {isUploading
                      ? 'Subiendo archivo...'
                      : 'Haz clic o arrastra un archivo aquí'
                    }
                  </p>
                  <p className="text-xs text-gray-400">PDF o imagen</p>
                  <input
                    ref={el => { fileInputRefs.current[slot.tipo] = el }}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple={slot.multiple}
                    className="hidden"
                    disabled={isUploading}
                    onChange={e => handleFileChange(slot.tipo, e.target.files)}
                  />
                </div>

                {slotError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {slotError}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
