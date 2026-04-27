'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Gauge, Upload, ScanLine, Loader2, AlertTriangle,
  CheckCircle2, Save, RotateCcw,
} from 'lucide-react'

interface Props {
  expedienteId: string
  currentMedidor?: string | null
  onSaved?: (numero: string) => void
}

export default function MedidorCaptura({ expedienteId, currentMedidor, onSaved }: Props) {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [file,       setFile]       = useState<File | null>(null)
  const [numero,     setNumero]     = useState(currentMedidor ?? '')
  const [confianza,  setConfianza]  = useState<string>('')
  const [scanning,   setScanning]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [scanned,    setScanned]    = useState(false)
  const [saved,      setSaved]      = useState(false)

  const [drag, setDrag] = useState(false)

  function handleFile(f: File) {
    setFile(f)
    setError(null)
    setScanned(false)
    setSaved(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleScan() {
    if (!file) { setError('Sube una imagen o PDF del medidor.'); return }
    setScanning(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('expediente_id', expedienteId)

      const res  = await fetch('/api/ocr/medidor', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo leer el medidor.')
        return
      }

      setNumero(data.numero_medidor ?? '')
      setConfianza(data.confianza ?? '')
      setScanned(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    if (!numero.trim()) { setError('Ingresa el número de medidor.'); return }
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('expedientes')
      .update({ numero_medidor: numero.trim() })
      .eq('id', expedienteId)

    setSaving(false)
    if (err) { setError(`No se pudo guardar: ${err.message}`); return }

    setSaved(true)
    onSaved?.(numero.trim())
  }

  const preview = file?.type.startsWith('image/') ? URL.createObjectURL(file) : null
  const hasCurrent = !!(currentMedidor)

  const confianzaColor = {
    alta:  'text-green-600 bg-green-50',
    media: 'text-yellow-600 bg-yellow-50',
    baja:  'text-red-600 bg-red-50',
  }[confianza] ?? 'text-gray-500 bg-gray-50'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-brand-green" />
        <h3 className="font-semibold text-gray-800">Número de Medidor CFE</h3>
        {hasCurrent && !scanned && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" />
            {currentMedidor}
          </span>
        )}
      </div>

      {/* Upload zone */}
      <div
        onClick={() => !scanning && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={[
          'relative w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden',
          scanning ? 'opacity-50 cursor-not-allowed' : '',
          drag ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-brand-green hover:bg-brand-green-light/30',
        ].join(' ')}
      >
        {preview ? (
          <img src={preview} alt="Medidor" className="absolute inset-0 w-full h-full object-contain bg-gray-900 rounded-xl" />
        ) : file ? (
          <div className="text-center">
            <Gauge className="w-8 h-8 mx-auto mb-2 text-brand-green" />
            <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            <p className="text-xs text-gray-400">PDF listo para analizar</p>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
            <span className="text-sm text-gray-500">Foto del medidor o resolutivo CFE</span>
            <span className="text-xs text-gray-300 mt-1">JPG · PNG · PDF</span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={scanning}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {file && (
        <p className="text-xs text-gray-400 -mt-2">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>
      )}

      {/* Botón escanear */}
      <button
        type="button"
        onClick={handleScan}
        disabled={scanning || !file}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        {scanning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Leyendo número…</>
        ) : (
          <><ScanLine className="w-4 h-4" /> Leer número con IA</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Resultado */}
      {(scanned || hasCurrent) && (
        <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {scanned ? 'Número detectado — confirma o corrige:' : 'Número de medidor registrado:'}
            </p>
            <div className="flex items-center gap-2">
              {confianza && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confianzaColor}`}>
                  Confianza: {confianza}
                </span>
              )}
              {scanned && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setScanned(false); setNumero(currentMedidor ?? '') }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Repetir
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">Número de medidor / servicio CFE</label>
            <input
              type="text"
              className="input-field font-mono text-base tracking-wider"
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setSaved(false) }}
              placeholder="Ej. 055000123456"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Guardado correctamente
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !numero.trim()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar número</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manual fallback */}
      {!scanned && !hasCurrent && (
        <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/30">
          <p className="text-xs text-gray-400">¿Prefieres ingresar el número manualmente?</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field font-mono text-sm flex-1"
              value={numero}
              onChange={(e) => { setNumero(e.target.value); setSaved(false) }}
              placeholder="Número de medidor CFE"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !numero.trim()}
              className="btn-primary flex items-center gap-2 text-sm px-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Guardado
            </span>
          )}
        </div>
      )}
    </div>
  )
}
