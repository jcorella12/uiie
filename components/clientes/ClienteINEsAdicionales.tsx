'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Loader2, Sparkles, FileText, ScanLine, X,
  AlertTriangle, CheckCircle, IdCard,
} from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

type INEAdicional = {
  id:               string
  etiqueta:         string
  nombre_completo:  string | null
  numero_ine:       string | null
  curp:             string | null
  domicilio:        string | null
  ine_url_frente:   string | null
  ine_url_reverso:  string | null
  notas:            string | null
  created_at:       string
}

type Props = {
  clienteId: string
  ines:      INEAdicional[]
}

/**
 * Lista de INEs adicionales del cliente. Cualquier persona del proyecto
 * (esposo/a, representante, hijo) puede tener su INE archivada aquí.
 */
export default function ClienteINEsAdicionales({ clienteId, ines }: Props) {
  const router = useRouter()
  const [openForm, setOpenForm] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Generar signed URLs para previsualizar las INEs
  useEffect(() => {
    const sb = createClient()
    const all = ines.flatMap(i => [i.ine_url_frente, i.ine_url_reverso].filter(Boolean) as string[])
    Promise.all(all.map(async (path) => {
      const { data } = await sb.storage.from('documentos').createSignedUrl(path, 3600)
      return [path, data?.signedUrl] as const
    })).then(pairs => {
      const map: Record<string, string> = {}
      for (const [p, u] of pairs) if (u) map[p] = u
      setSignedUrls(map)
    })
  }, [ines])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {ines.length} INE{ines.length !== 1 ? 's' : ''} archivada{ines.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => setOpenForm(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-dark"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar INE
        </button>
      </div>

      {ines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
          <IdCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Sin INEs adicionales archivadas</p>
          <p className="text-xs text-gray-400 mt-1">Agrega INEs de otras personas del proyecto (representante, esposo/a, etc.)</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {ines.map(i => (
            <INECard key={i.id} ine={i} signedUrls={signedUrls} onDeleted={() => router.refresh()} />
          ))}
        </ul>
      )}

      {openForm && (
        <NuevaINEModal
          clienteId={clienteId}
          onClose={() => setOpenForm(false)}
          onCreated={() => { setOpenForm(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function INECard({
  ine, signedUrls, onDeleted,
}: {
  ine: INEAdicional
  signedUrls: Record<string, string>
  onDeleted: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const r = await fetch('/api/clientes/ines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ine.id }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        alert(d.error ?? 'No se pudo borrar')
        return
      }
      onDeleted()
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const urlF = ine.ine_url_frente ? signedUrls[ine.ine_url_frente] : null
  const urlR = ine.ine_url_reverso ? signedUrls[ine.ine_url_reverso] : null

  return (
    <li className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-green bg-brand-green-light/40 rounded px-2 py-0.5">
              {ine.etiqueta}
            </span>
          </div>
          {ine.nombre_completo && (
            <p className="text-sm font-medium text-gray-800">{ine.nombre_completo}</p>
          )}
          <div className="text-xs text-gray-500 mt-1 space-x-3">
            {ine.numero_ine && <span>INE: <span className="font-mono">{ine.numero_ine}</span></span>}
            {ine.curp && <span>CURP: <span className="font-mono">{ine.curp}</span></span>}
          </div>
          {ine.domicilio && <p className="text-xs text-gray-500 mt-1">📍 {ine.domicilio}</p>}
          {ine.notas && <p className="text-xs text-gray-500 italic mt-1">{ine.notas}</p>}
        </div>

        {/* Thumbs */}
        <div className="flex gap-1.5 shrink-0">
          {urlF && (
            <a href={urlF} target="_blank" rel="noopener noreferrer" className="block w-16 h-12 rounded border border-gray-200 overflow-hidden">
              <img src={urlF} alt="frente" className="w-full h-full object-cover" />
            </a>
          )}
          {urlR && (
            <a href={urlR} target="_blank" rel="noopener noreferrer" className="block w-16 h-12 rounded border border-gray-200 overflow-hidden">
              <img src={urlR} alt="reverso" className="w-full h-full object-cover" />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
          aria-label="Borrar INE"
          className="text-gray-300 hover:text-red-500 disabled:opacity-50 p-1"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Borrar INE adicional"
        message={`Esta acción borra la INE de "${ine.etiqueta}" y sus archivos. No se puede deshacer.`}
        confirmText="Borrar"
        variant="danger"
      />
    </li>
  )
}

function NuevaINEModal({
  clienteId, onClose, onCreated,
}: {
  clienteId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [etiqueta, setEtiqueta] = useState('')
  const [nombre,   setNombre]   = useState('')
  const [numeroIne, setNumeroIne] = useState('')
  const [curp,     setCurp]     = useState('')
  const [domicilio, setDomicilio] = useState('')
  const [notas,    setNotas]    = useState('')
  const [fileF,    setFileF]    = useState<File | null>(null)
  const [fileR,    setFileR]    = useState<File | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const refF = useRef<HTMLInputElement>(null)
  const refR = useRef<HTMLInputElement>(null)

  async function handleOCR(file: File, lado: 'frente' | 'reverso') {
    setOcrLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('lado', lado)
      // No mandamos entity_type/entity_id para evitar que sobreescriba la INE
      // principal del cliente — solo extraemos los datos sin guardar.
      const r = await fetch('/api/ocr/ine', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'No se pudo leer la INE')
      const e = data.extracted ?? {}
      if (e.nombre)        setNombre(prev => prev || e.nombre)
      if (e.numero_ine)    setNumeroIne(prev => prev || e.numero_ine)
      if (e.curp)          setCurp(prev => prev || e.curp)
      if (e.domicilio || e.domicilio_calle) {
        const dom = [e.domicilio_calle, e.domicilio_colonia && `COL ${e.domicilio_colonia}`, e.domicilio_cp, e.domicilio_municipio, e.domicilio_estado]
          .filter(Boolean).join(', ')
        setDomicilio(prev => prev || dom || (e.domicilio ?? ''))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOcrLoading(false)
    }
  }

  function pickFile(lado: 'frente' | 'reverso', file: File) {
    if (lado === 'frente') setFileF(file)
    else                   setFileR(file)
    handleOCR(file, lado)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!etiqueta.trim()) { setError('Captura la etiqueta (ej: "Esposo", "Representante")'); return }
    if (!fileF && !fileR && !nombre.trim()) { setError('Sube al menos un archivo o escribe el nombre'); return }
    setSaving(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('cliente_id',      clienteId)
      fd.append('etiqueta',        etiqueta.trim())
      fd.append('nombre_completo', nombre.trim())
      fd.append('numero_ine',      numeroIne.trim())
      fd.append('curp',            curp.trim())
      fd.append('domicilio',       domicilio.trim())
      fd.append('notas',           notas.trim())
      if (fileF) fd.append('file_frente', fileF, fileF.name)
      if (fileR) fd.append('file_reverso', fileR, fileR.name)
      const r = await fetch('/api/clientes/ines', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'No se pudo guardar')
      onCreated()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <IdCard className="w-5 h-5 text-brand-green" />
            Agregar INE
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">¿Quién es? *</label>
            <input
              type="text"
              value={etiqueta}
              onChange={e => setEtiqueta(e.target.value)}
              placeholder="Ej: Esposo, Representante legal, Hijo, Suegra…"
              maxLength={60}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          {/* Subida de fotos */}
          <div className="grid grid-cols-2 gap-2">
            {(['frente', 'reverso'] as const).map(lado => {
              const file = lado === 'frente' ? fileF : fileR
              const ref  = lado === 'frente' ? refF : refR
              return (
                <div key={lado}>
                  <label className="text-xs font-medium text-gray-600 mb-1 block capitalize">{lado}</label>
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(lado, f) }}
                  />
                  <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    className="w-full text-xs px-3 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-brand-green hover:text-brand-green truncate flex flex-col items-center gap-1"
                  >
                    {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {file ? file.name : `Subir ${lado}`}
                  </button>
                </div>
              )
            })}
          </div>

          {ocrLoading && (
            <p className="text-[11px] text-purple-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" /> Extrayendo datos con IA…
            </p>
          )}

          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-green/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Número de INE</label>
              <input
                type="text"
                value={numeroIne}
                onChange={e => setNumeroIne(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-green/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">CURP</label>
              <input
                type="text"
                value={curp}
                onChange={e => setCurp(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-green/30"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Domicilio (opcional)</label>
              <input
                type="text"
                value={domicilio}
                onChange={e => setDomicilio(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-green/30"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Notas (opcional)</label>
              <input
                type="text"
                value={notas}
                onChange={e => setNotas(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-green/30"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !etiqueta.trim()}
              className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Guardar
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
