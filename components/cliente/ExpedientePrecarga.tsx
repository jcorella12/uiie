'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle2, Upload, X, Loader2, FileText, Image, File,
  AlertCircle,
} from 'lucide-react'
import InversoresEditor, { type InversorRowData } from '@/components/expedientes/InversoresEditor'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SavedData {
  cli_marca_paneles?:     string | null
  cli_modelo_paneles?:    string | null
  cli_num_paneles?:       number | null
  cli_potencia_panel_wp?: number | null
  cli_inversor_id?:       string | null
  cli_marca_inversor?:    string | null
  cli_modelo_inversor?:   string | null
  cli_capacidad_kw?:      number | null
  cli_num_inversores?:    number | null
  cli_num_medidor?:       string | null
  cli_direccion?:         string | null
  cli_notas?:             string | null
  cli_completado_at?:     string | null
  /** Correo CFE del expediente (editable por el cliente). */
  correo_cfe?:            string | null
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
  /** Lista multi-inversor preexistente (de expediente_inversores). */
  inversoresExpediente?: InversorRowData[]
}

// ─── Document slots ───────────────────────────────────────────────────────────

const DOCUMENT_SLOTS_BASE: { tipo: string; label: string; multiple?: boolean; optional?: boolean; hiddenWhenCatalogCert?: boolean; requiresDescription?: boolean }[] = [
  { tipo: 'diagrama',             label: 'Diagrama unifilar' },
  { tipo: 'certificado_inversor', label: 'Certificado del inversor(es)', multiple: true, hiddenWhenCatalogCert: true },
  { tipo: 'dictamen_uvie',        label: 'Dictamen de la UVIE' },
  { tipo: 'oficio_resolutivo',    label: 'Oficio Resolutivo' },
  { tipo: 'recibo_cfe',           label: 'Recibo de CFE' },
  { tipo: 'ine_participante',     label: 'INEs de testigos y participantes', multiple: true },
  { tipo: 'memoria_calculo',      label: 'Memoria de cálculo', optional: true },
  { tipo: 'otro',                 label: 'Otros documentos', multiple: true, optional: true, requiresDescription: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(nombre: string) {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext))
    return <Image className="w-4 h-4 text-blue-500 shrink-0" />
  if (ext === 'pdf')
    return <FileText className="w-4 h-4 text-red-500 shrink-0" />
  return <File className="w-4 h-4 text-gray-400 shrink-0" />
}

const CERT_LABEL: Record<string, string> = {
  ul1741:   'UL 1741',
  ieee1547: 'IEEE 1547',
  ninguna:  'Sin cert.',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExpedientePrecarga({ expedienteId, isLocked, saved, clienteDocs, inversoresExpediente }: Props) {
  // ── Form state ──────────────────────────────────────────────────────────────
  // Los campos cli_inversor_id/cli_marca_inversor/etc. ya no se editan aquí —
  // ahora viven en `expediente_inversores` (lista multi). Lo único que dejamos
  // es paneles, medidor, dirección y notas.
  const [form, setForm] = useState({
    cli_marca_paneles:     saved?.cli_marca_paneles     ?? '',
    cli_modelo_paneles:    saved?.cli_modelo_paneles    ?? '',
    cli_num_paneles:       saved?.cli_num_paneles       != null ? String(saved.cli_num_paneles)       : '',
    cli_potencia_panel_wp: saved?.cli_potencia_panel_wp != null ? String(saved.cli_potencia_panel_wp) : '',
    cli_num_medidor:       saved?.cli_num_medidor       ?? '',
    cli_direccion:         saved?.cli_direccion         ?? '',
    cli_notas:             saved?.cli_notas             ?? '',
    correo_cfe:            saved?.correo_cfe            ?? '',
  })
  const [saving,      setSaving]      = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  // ── Docs state ──────────────────────────────────────────────────────────────
  const [docs,         setDocs]         = useState<ClienteDoc[]>(clienteDocs ?? [])
  const [uploading,    setUploading]    = useState<Record<string, boolean>>({})
  const [uploadError,  setUploadError]  = useState<Record<string, string | null>>({})
  const [deleting,     setDeleting]     = useState<Record<string, boolean>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  // Si alguno de los inversores capturados tiene `inversor_id` con certificado
  // en el sistema (catálogo), ocultamos el slot de subida de certificado.
  const catalogHasCert = (inversoresExpediente ?? []).some(i => !!i.inversor_id)

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
          // Los datos del/los inversor(es) ahora viven en expediente_inversores;
          // nulificamos los campos cli_* legacy para no dejar info contradictoria.
          cli_inversor_id:       null,
          cli_marca_inversor:    null,
          cli_modelo_inversor:   null,
          cli_capacidad_kw:      null,
          cli_num_inversores:    null,
          cli_num_medidor:       form.cli_num_medidor       || null,
          cli_direccion:         form.cli_direccion         || null,
          cli_notas:             form.cli_notas             || null,
          correo_cfe:            form.correo_cfe            || null,
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
  async function handleFileChange(tipo: string, files: FileList | null, requiresDescription = false) {
    if (!files || files.length === 0) return

    // Si el slot requiere descripción, validar que esté capturada
    const desc = (descriptions[tipo] ?? '').trim()
    if (requiresDescription && desc.length < 3) {
      setUploadError(prev => ({ ...prev, [tipo]: 'Escribe primero una descripción del documento (mín. 3 caracteres).' }))
      if (fileInputRefs.current[tipo]) fileInputRefs.current[tipo]!.value = ''
      return
    }

    setUploadError(prev => ({ ...prev, [tipo]: null }))
    for (const file of Array.from(files)) {
      setUploading(prev => ({ ...prev, [tipo]: true }))
      try {
        // Para "Otros" anteponemos la descripción al nombre del archivo
        // para que el inspector identifique el documento (ej: "Carta poder — escritura.pdf").
        const nombre = requiresDescription
          ? `${desc} — ${file.name}`
          : file.name
        const fd = new FormData()
        fd.append('file', file)
        fd.append('expediente_id', expedienteId)
        fd.append('tipo', tipo)
        fd.append('nombre', nombre)
        const res  = await fetch('/api/cliente/documentos/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          setUploadError(prev => ({ ...prev, [tipo]: data.error ?? 'Error al subir el archivo' }))
        } else {
          setDocs(prev => [...prev, data.doc])
          // Limpiar descripción tras éxito
          if (requiresDescription) {
            setDescriptions(prev => ({ ...prev, [tipo]: '' }))
          }
        }
      } catch {
        setUploadError(prev => ({ ...prev, [tipo]: 'Error de conexión. Intenta de nuevo.' }))
      } finally {
        setUploading(prev => ({ ...prev, [tipo]: false }))
        if (fileInputRefs.current[tipo]) fileInputRefs.current[tipo]!.value = ''
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
      if (res.ok) setDocs(prev => prev.filter(d => d.id !== docId))
      else console.error('Error eliminando documento:', data.error)
    } catch { console.error('Error de conexión al eliminar documento') }
    finally { setDeleting(prev => ({ ...prev, [docId]: false })) }
  }

  // ── LOCKED VIEW ──────────────────────────────────────────────────────────────
  if (isLocked) {
    const hasSavedData = saved && Object.values(saved).some(v => v !== null && v !== undefined && v !== '')
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Información recibida — el inspector está revisando tu expediente.
          </p>
        </div>
        {hasSavedData && (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Datos de la Instalación</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {saved?.cli_marca_paneles && <div><p className="label text-xs">Marca paneles</p><p className="text-gray-800">{saved.cli_marca_paneles}</p></div>}
              {saved?.cli_modelo_paneles && <div><p className="label text-xs">Modelo paneles</p><p className="text-gray-800">{saved.cli_modelo_paneles}</p></div>}
              {saved?.cli_num_paneles != null && <div><p className="label text-xs">Cantidad paneles</p><p className="text-gray-800">{saved.cli_num_paneles}</p></div>}
              {saved?.cli_potencia_panel_wp != null && <div><p className="label text-xs">Potencia por panel (Wp)</p><p className="text-gray-800">{saved.cli_potencia_panel_wp}</p></div>}
              {/* Lista multi-inversor */}
              {(inversoresExpediente && inversoresExpediente.length > 0) ? (
                <div className="col-span-2">
                  <p className="label text-xs">Inversores</p>
                  <div className="space-y-1 mt-1">
                    {inversoresExpediente.map((inv, i) => (
                      <p key={i} className="text-gray-800 text-sm">
                        <strong>{inv.cantidad}×</strong> {inv.marca} {inv.modelo}
                        {inv.potencia_kw != null && <span className="text-gray-500"> · {inv.potencia_kw} kW</span>}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {saved?.cli_marca_inversor && <div><p className="label text-xs">Inversor</p><p className="text-gray-800">{saved.cli_marca_inversor} {saved.cli_modelo_inversor}</p></div>}
                  {saved?.cli_capacidad_kw != null && <div><p className="label text-xs">Capacidad total (kW)</p><p className="text-gray-800">{saved.cli_capacidad_kw}</p></div>}
                  {saved?.cli_num_inversores != null && <div><p className="label text-xs">Cantidad inversores</p><p className="text-gray-800">{saved.cli_num_inversores}</p></div>}
                </>
              )}
              {saved?.cli_num_medidor && <div className="col-span-2"><p className="label text-xs">Número de medidor CFE</p><p className="text-gray-800">{saved.cli_num_medidor}</p></div>}
              {saved?.cli_direccion && <div className="col-span-2"><p className="label text-xs">Dirección</p><p className="text-gray-800">{saved.cli_direccion}</p></div>}
              {saved?.correo_cfe && <div className="col-span-2"><p className="label text-xs">Correo CFE</p><p className="text-gray-800">{saved.correo_cfe}</p></div>}
              {saved?.cli_notas && <div className="col-span-2"><p className="label text-xs">Notas</p><p className="text-gray-800 whitespace-pre-wrap">{saved.cli_notas}</p></div>}
            </div>
          </div>
        )}
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
                    <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline font-medium shrink-0">Ver</a>
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
  const documentSlots = DOCUMENT_SLOTS_BASE.filter(
    s => !(s.hiddenWhenCatalogCert && catalogHasCert)
  )

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
                <input className="input-field" placeholder="Ej. Canadian Solar" value={form.cli_marca_paneles} onChange={set('cli_marca_paneles')} />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input className="input-field" placeholder="Ej. CS6R-410MS" value={form.cli_modelo_paneles} onChange={set('cli_modelo_paneles')} />
              </div>
              <div>
                <label className="label">Cantidad de paneles</label>
                <input className="input-field" type="number" min="1" placeholder="Ej. 12" value={form.cli_num_paneles} onChange={set('cli_num_paneles')} />
              </div>
              <div>
                <label className="label">Potencia por panel (Wp)</label>
                <input className="input-field" type="number" min="0" step="0.01" placeholder="Ej. 410" value={form.cli_potencia_panel_wp} onChange={set('cli_potencia_panel_wp')} />
              </div>
            </div>
          </div>

          {/* ── Inversores ── */}
          {/* Editor multi-modelo: si tu proyecto tiene 2 marcas distintas
              (ej. 8 Sungrow + 2 Huawei) puedes capturarlas por separado.
              Cada renglón se persiste con su propio botón "Guardar inversores",
              independiente del botón general de "Guardar información". */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Inversores
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Si el proyecto tiene varios modelos de inversor mezclados, agrega un renglón para cada uno.
              El acta y la lista de verificación los redactan automáticamente.
            </p>
            <InversoresEditor
              expedienteId={expedienteId}
              initial={inversoresExpediente ?? []}
              modoLibre
            />
          </div>

          {/* Medidor y dirección */}
          <div>
            <label className="label">Número de medidor CFE</label>
            <input className="input-field" placeholder="Ej. 1234567890" value={form.cli_num_medidor} onChange={set('cli_num_medidor')} />
          </div>
          <div>
            <label className="label">Dirección completa de la instalación</label>
            <input className="input-field" placeholder="Calle, número, colonia, municipio, estado" value={form.cli_direccion} onChange={set('cli_direccion')} />
          </div>
          {/* Correo CFE — al cual se envía el certificado. Se sincroniza con la
              vista del inspector en "Información Complementaria". */}
          <div>
            <label className="label">Correo CFE para envío del certificado</label>
            <input
              type="email"
              className="input-field"
              placeholder="contacto-zona@cfe.mx"
              value={form.correo_cfe}
              onChange={set('correo_cfe')}
            />
            <p className="text-xs text-gray-400 mt-1">
              El certificado se enviará a este correo. Si el contacto cambia, actualízalo aquí
              y avisa al inspector.
            </p>
          </div>
          <div>
            <label className="label">Notas adicionales</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Información adicional relevante para el inspector..." value={form.cli_notas} onChange={set('cli_notas')} />
          </div>

          {/* Botón guardar */}
          <div className="flex items-center gap-4 flex-wrap">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar información'}
            </button>
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> ¡Información guardada correctamente!
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" /> {saveError}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── Sección 2: Documentos ── */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Documentos</h2>

        {/* Aviso cuando el inversor proviene del catálogo (cert ya registrado) */}
        {catalogHasCert && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">
              Detectamos que tu inversor está registrado en nuestro catálogo.
              Si su certificado ya está cargado en el sistema no es necesario que lo subas tú.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {documentSlots.map(slot => {
            const slotDocs    = docs.filter(d => d.tipo === slot.tipo)
            const isUploading = uploading[slot.tipo]
            const slotError   = uploadError[slot.tipo]
            const needsDesc   = !!slot.requiresDescription
            const descValue   = descriptions[slot.tipo] ?? ''
            const descReady   = !needsDesc || descValue.trim().length >= 3
            return (
              <div key={slot.tipo}>
                <p className="label mb-2">
                  {slot.label}
                  {slot.optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
                </p>
                {needsDesc && (
                  <p className="text-xs text-gray-500 mb-2">
                    Sube cualquier documento adicional que el inspector deba revisar
                    (ej. carta poder, escrituras, contrato de interconexión, etc.).
                    Captura primero una descripción y luego selecciona el archivo.
                  </p>
                )}
                {slotDocs.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {slotDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {fileIcon(doc.nombre)}
                          {doc.publicUrl ? (
                            <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-green hover:underline truncate">{doc.nombre}</a>
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
                          {deleting[doc.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {needsDesc && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={descValue}
                      onChange={e => setDescriptions(prev => ({ ...prev, [slot.tipo]: e.target.value }))}
                      placeholder="Describe el documento (ej. Carta poder del representante legal)"
                      maxLength={120}
                      className="input-field text-sm"
                      disabled={isUploading}
                    />
                  </div>
                )}
                <div
                  className={`relative flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl px-4 py-4 transition-colors ${
                    descReady
                      ? 'border-gray-200 cursor-pointer hover:border-brand-green hover:bg-green-50/40'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!descReady) {
                      setUploadError(prev => ({ ...prev, [slot.tipo]: 'Escribe primero una descripción del documento (mín. 3 caracteres).' }))
                      return
                    }
                    fileInputRefs.current[slot.tipo]?.click()
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFileChange(slot.tipo, e.dataTransfer.files, needsDesc) }}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 text-brand-green animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                  <p className="text-xs text-gray-500">
                    {isUploading
                      ? 'Subiendo archivo...'
                      : !descReady
                        ? 'Captura primero la descripción'
                        : 'Haz clic o arrastra un archivo aquí'}
                  </p>
                  <p className="text-xs text-gray-400">PDF o imagen</p>
                  <input
                    ref={el => { fileInputRefs.current[slot.tipo] = el }}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple={slot.multiple}
                    className="hidden"
                    disabled={isUploading || !descReady}
                    onChange={e => handleFileChange(slot.tipo, e.target.files, needsDesc)}
                  />
                </div>
                {slotError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {slotError}
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
