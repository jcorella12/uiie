'use client'

import { useState, useRef, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud, FileText, Film, Music, Archive,
  FileSpreadsheet, Image as ImageIcon, X, CheckCircle,
  AlertTriangle, Loader2, Eye,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvidenciaDoc {
  id: string
  nombre: string
  mime_type: string | null
  tamano_bytes: number | null
  created_at: string
  publicUrl: string | null
}

interface QueueFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  preview?: string    // object URL para imágenes
}

interface Props {
  expedienteId: string
  evidencias: EvidenciaDoc[]
  readOnly?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImage(mime: string | null) {
  return !!mime?.startsWith('image/')
}

function isVideo(mime: string | null) {
  return !!mime?.startsWith('video/')
}

function isAudio(mime: string | null) {
  return !!mime?.startsWith('audio/')
}

function isPDF(mime: string | null) {
  return mime === 'application/pdf'
}

function isSpreadsheet(mime: string | null) {
  return !!mime?.includes('spreadsheet') || !!mime?.includes('excel') || mime === 'text/csv'
}

function isArchive(mime: string | null) {
  return mime === 'application/zip' || mime === 'application/x-rar-compressed' || mime === 'application/x-7z-compressed'
}

function formatBytes(bytes: number | null) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mime, className }: { mime: string | null; className?: string }) {
  const cls = className ?? 'w-8 h-8'
  if (isImage(mime))       return <ImageIcon      className={`${cls} text-blue-400`} />
  if (isVideo(mime))       return <Film           className={`${cls} text-purple-400`} />
  if (isAudio(mime))       return <Music          className={`${cls} text-pink-400`} />
  if (isPDF(mime))         return <FileText       className={`${cls} text-red-400`} />
  if (isSpreadsheet(mime)) return <FileSpreadsheet className={`${cls} text-green-500`} />
  if (isArchive(mime))     return <Archive        className={`${cls} text-yellow-500`} />
  return                          <FileText       className={`${cls} text-gray-400`} />
}

// ─── Galería de archivos ya subidos ───────────────────────────────────────────

function GaleriaItem({ doc }: { doc: EvidenciaDoc }) {
  const img = isImage(doc.mime_type)

  return (
    <a
      href={doc.publicUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-xl border border-gray-200 overflow-hidden hover:border-brand-green/40 hover:shadow-md transition-all bg-white"
      title={doc.nombre}
    >
      {/* Thumbnail o icono */}
      <div className="h-32 flex items-center justify-center bg-gray-50 overflow-hidden">
        {img && doc.publicUrl ? (
          <img
            src={doc.publicUrl}
            alt={doc.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <FileIcon mime={doc.mime_type} className="w-12 h-12 opacity-70" />
        )}

        {/* Overlay "Ver" */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 rounded-full p-2">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-700 truncate leading-tight">{doc.nombre}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatBytes(doc.tamano_bytes)}
          {doc.tamano_bytes && doc.created_at ? ' · ' : ''}
          {doc.created_at
            ? new Date(doc.created_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
            : ''}
        </p>
      </div>
    </a>
  )
}

// ─── Zona de subida ───────────────────────────────────────────────────────────

function UploadZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uid = useId()

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFilesSelected(files)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFilesSelected(files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        cursor-pointer rounded-xl border-2 border-dashed transition-all
        flex flex-col items-center justify-center gap-2 py-10 px-6 text-center
        ${dragging
          ? 'border-brand-green bg-brand-green-light scale-[1.01]'
          : 'border-gray-300 hover:border-brand-green/50 hover:bg-gray-50'
        }
      `}
    >
      <input
        id={uid}
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInput}
      />
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
        dragging ? 'bg-brand-green/20' : 'bg-gray-100'
      }`}>
        <UploadCloud className={`w-6 h-6 ${dragging ? 'text-brand-green' : 'text-gray-400'}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">
          {dragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Imágenes, PDFs, videos, facturas, selfies — cualquier tipo · Sin límite de cantidad
        </p>
      </div>
    </div>
  )
}

// ─── Cola de archivos pendientes ─────────────────────────────────────────────

function QueueItem({ qf, onRemove }: { qf: QueueFile; onRemove: () => void }) {
  const isImg = isImage(qf.file.type)

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
      {/* Thumbnail o icono */}
      <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-white border border-gray-200">
        {isImg && qf.preview ? (
          <img src={qf.preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileIcon mime={qf.file.type} className="w-5 h-5" />
        )}
      </div>

      {/* Nombre + tamaño */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{qf.file.name}</p>
        <p className="text-[10px] text-gray-400">{formatBytes(qf.file.size)}</p>
      </div>

      {/* Estado */}
      <div className="flex-shrink-0">
        {qf.status === 'pending'   && <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
        {qf.status === 'uploading' && <Loader2 className="w-4 h-4 text-brand-green animate-spin" />}
        {qf.status === 'done'      && <CheckCircle className="w-4 h-4 text-green-500" />}
        {qf.status === 'error'     && (
          <span title={qf.error} className="cursor-help">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EvidenciaVisitaSection({ expedienteId, evidencias, readOnly = false }: Props) {
  const [queue, setQueue] = useState<QueueFile[]>([])
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const addFiles = useCallback((files: File[]) => {
    const nuevos: QueueFile[] = files.map(file => {
      const preview = isImage(file.type) ? URL.createObjectURL(file) : undefined
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        preview,
      }
    })
    setQueue(prev => [...prev, ...nuevos])
  }, [])

  function removeFromQueue(id: string) {
    setQueue(prev => {
      const item = prev.find(q => q.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter(q => q.id !== id)
    })
  }

  async function uploadFile(qf: QueueFile): Promise<'done' | 'error'> {
    const fd = new FormData()
    fd.append('file', qf.file)
    fd.append('tipo', 'evidencia_visita')
    fd.append('nombre', qf.file.name.replace(/\.[^/.]+$/, '') || qf.file.name)
    fd.append('expediente_id', expedienteId)

    try {
      const res  = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      return 'done'
    } catch (err: any) {
      setQueue(prev =>
        prev.map(q => q.id === qf.id ? { ...q, status: 'error', error: err.message } : q)
      )
      return 'error'
    }
  }

  async function handleUploadAll() {
    const pendientes = queue.filter(q => q.status === 'pending')
    if (!pendientes.length) return

    setUploading(true)

    // Marca todos como uploading
    setQueue(prev =>
      prev.map(q => q.status === 'pending' ? { ...q, status: 'uploading' } : q)
    )

    // Sube en paralelo (máx 3 concurrentes para no saturar)
    const chunks: QueueFile[][] = []
    for (let i = 0; i < pendientes.length; i += 3) {
      chunks.push(pendientes.slice(i, i + 3))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async qf => {
          const result = await uploadFile(qf)
          setQueue(prev =>
            prev.map(q => q.id === qf.id ? { ...q, status: result } : q)
          )
        })
      )
    }

    setUploading(false)

    // Limpiar previews de objeto
    queue.forEach(q => { if (q.preview) URL.revokeObjectURL(q.preview) })

    // Quitar completados después de 2 s
    setTimeout(() => {
      setQueue(prev => prev.filter(q => q.status !== 'done'))
      router.refresh()
    }, 2000)
  }

  const pendingCount  = queue.filter(q => q.status === 'pending').length
  const errorCount    = queue.filter(q => q.status === 'error').length

  return (
    <div className="space-y-6">

      {/* ── Galería de evidencias ya subidas ── */}
      {evidencias.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-25" />
          <p className="text-sm font-medium text-gray-500">Sin evidencias subidas aún</p>
          <p className="text-xs mt-1 text-gray-400">
            Sube fotos, videos, facturas o cualquier archivo de la visita.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {evidencias.map(doc => (
            <GaleriaItem key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* ── Zona de carga (oculta en readOnly) ── */}
      {!readOnly && (
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <UploadZone onFilesSelected={addFiles} />

          {/* Cola */}
          {queue.length > 0 && (
            <div className="space-y-2">
              {queue.map(qf => (
                <QueueItem
                  key={qf.id}
                  qf={qf}
                  onRemove={() => removeFromQueue(qf.id)}
                />
              ))}

              {/* Botón subir */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleUploadAll}
                  disabled={uploading || pendingCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</>
                    : <><UploadCloud className="w-4 h-4" /> Subir {pendingCount} archivo{pendingCount !== 1 ? 's' : ''}</>
                  }
                </button>

                {errorCount > 0 && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errorCount} archivo{errorCount !== 1 ? 's' : ''} con error
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
