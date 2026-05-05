'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentoTipo } from '@/lib/types'
import { Loader2, CheckCircle, AlertTriangle, UploadCloud } from 'lucide-react'

const TIPO_LABELS: Record<DocumentoTipo, string> = {
  contrato:             'Contrato',
  plano:                'Plano',
  memoria_tecnica:      'Memoria Técnica',
  dictamen:             'Dictamen UVIE',
  acta:                 'Acta de Inspección (firmada)',
  lista_verificacion:   'Lista de Verificación (firmada)',
  paquete_actas_listas: 'Paquete Actas y Listas (Acta + Lista + Cotización + Plan)',
  resolutivo:           'Resolutivo CFE',
  ficha_pago:           'Ficha de Pago (Resolutivo)',
  fotografia:           'Fotografía',
  certificado_cre:      'Certificado CNE',
  acuse_cre:            'Acuse CNE',
  evidencia_visita:     'Evidencia de Visita',
  otro:                 'Otro',
}

const TODOS_TIPOS: DocumentoTipo[] = [
  'paquete_actas_listas',
  'acta', 'lista_verificacion', 'resolutivo', 'ficha_pago', 'dictamen',
  'contrato', 'plano', 'memoria_tecnica', 'fotografia',
  'certificado_cre', 'acuse_cre', 'otro',
]

interface Props {
  expedienteId: string
  tiposPermitidos?: DocumentoTipo[]
  tituloSeccion?: string
  tipoDefecto?: DocumentoTipo
}

export default function SubirDocumentoForm({ expedienteId, tiposPermitidos, tituloSeccion, tipoDefecto }: Props) {
  const TIPOS = tiposPermitidos ?? TODOS_TIPOS
  const router      = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file,      setFile]      = useState<File | null>(null)
  const [tipo,      setTipo]      = useState<DocumentoTipo>(tipoDefecto ?? TIPOS[0] ?? 'otro')
  const [nombre,    setNombre]    = useState('')
  const [uploading, setUploading] = useState(false)
  const [status,    setStatus]    = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    if (selected && !nombre) {
      setNombre(selected.name.replace(/\.[^/.]+$/, ''))
    }
    setStatus(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file)          { setStatus({ type: 'error', message: 'Selecciona un archivo para subir.' });  return }
    if (!nombre.trim()) { setStatus({ type: 'error', message: 'Ingresa un nombre para el documento.' }); return }

    setUploading(true)
    setStatus(null)

    try {
      const fd = new FormData()
      fd.append('file',          file)
      fd.append('tipo',          tipo)
      fd.append('nombre',        nombre.trim())
      fd.append('expediente_id', expedienteId)

      const res  = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error ?? 'Error al subir el documento.' })
        return
      }

      setStatus({ type: 'success', message: 'Documento subido correctamente.' })
      setFile(null)
      setNombre('')
      setTipo('otro')
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.refresh()
    } catch {
      setStatus({ type: 'error', message: 'Ocurrió un error inesperado. Intenta de nuevo.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-gray-100 pt-5 space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-brand-green" />
        {tituloSeccion ?? 'Subir nuevo documento'}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* File picker */}
        <div className="sm:col-span-2">
          <label className="label">Archivo *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-600
              file:mr-3 file:py-1.5 file:px-3
              file:rounded-lg file:border-0
              file:text-xs file:font-semibold
              file:bg-brand-green-light file:text-brand-green
              hover:file:bg-brand-green/10
              file:cursor-pointer cursor-pointer
              border border-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="mt-1 text-xs text-gray-500">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className="label">Tipo de documento *</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as DocumentoTipo)}
            disabled={uploading}
            className="input-field"
          >
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>
        </div>

        {/* Nombre */}
        <div>
          <label className="label">Nombre del documento *</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Plano eléctrico rev.2"
            disabled={uploading}
            className="input-field"
            maxLength={200}
          />
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${
          status.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success'
            ? <CheckCircle   className="w-4 h-4 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          }
          {status.message}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="btn-primary flex items-center gap-2"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</>
            : <><UploadCloud className="w-4 h-4" /> Subir documento</>
          }
        </button>
      </div>
    </form>
  )
}
