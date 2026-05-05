'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageSquarePlus, X, Loader2, ImagePlus, AlertTriangle, Lightbulb, HelpCircle,
  Bug, MessageCircle, CheckCircle2,
} from 'lucide-react'

type Tipo = 'bug' | 'mejora' | 'pregunta' | 'otro'

const TIPOS: { value: Tipo; label: string; Icon: any; color: string }[] = [
  { value: 'bug',      label: 'Bug',           Icon: Bug,           color: 'red'    },
  { value: 'mejora',   label: 'Mejora / Idea', Icon: Lightbulb,     color: 'amber'  },
  { value: 'pregunta', label: 'Pregunta',      Icon: HelpCircle,    color: 'blue'   },
  { value: 'otro',     label: 'Otro',          Icon: MessageCircle, color: 'gray'   },
]

/**
 * Botón flotante (FAB) que abre un modal donde el usuario reporta un bug,
 * sugiere una mejora o hace una pregunta. Permite adjuntar imágenes (capturas).
 *
 * Visible para todos los usuarios autenticados. El feedback llega al inspector
 * responsable vía notificación + página /dashboard/admin/feedback.
 */
export default function FeedbackFAB() {
  const [open,    setOpen]    = useState(false)
  const [tipo,    setTipo]    = useState<Tipo>('bug')
  const [titulo,  setTitulo]  = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [files,   setFiles]   = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  // ESC cierra modal
  useEffect(() => {
    if (!open) return
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  function handleFiles(list: FileList | null) {
    if (!list) return
    const arr: File[] = []
    for (const f of Array.from(list)) {
      if (f.size > 10 * 1024 * 1024) { setError(`${f.name} excede 10 MB`); continue }
      if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
        setError(`${f.name} debe ser imagen o PDF`); continue
      }
      arr.push(f)
    }
    if (arr.length) setFiles(prev => [...prev, ...arr].slice(0, 5))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!titulo.trim()) { setError('Escribe un título corto'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('tipo',        tipo)
      fd.append('titulo',      titulo.trim())
      fd.append('descripcion', descripcion.trim())
      fd.append('url_pagina',  typeof window !== 'undefined' ? window.location.href : pathname ?? '')
      fd.append('user_agent',  typeof navigator !== 'undefined' ? navigator.userAgent : '')
      for (const f of files) fd.append('screenshot', f, f.name)

      const res  = await fetch('/api/feedback/nuevo', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'No se pudo enviar')

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setTitulo(''); setDescripcion(''); setFiles([]); setTipo('bug')
      }, 1800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-full shadow-lg hover:bg-brand-green/90 hover:shadow-xl transition-all"
        aria-label="Reportar bug o sugerir mejora"
        title="Reportar bug o sugerir mejora"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 id="feedback-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-brand-green" />
                Comparte un comentario
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-semibold text-emerald-900">¡Gracias por el reporte!</p>
                <p className="text-sm text-gray-600 mt-1">Lo recibirá el responsable y se atenderá lo antes posible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Si encuentras un bug, una mejora posible o tienes una pregunta, déjala aquí.
                  Puedes adjuntar capturas de pantalla.
                </p>

                {/* Tipo */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTipo(value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                          tipo === value
                            ? 'border-brand-green bg-brand-green-light/40 text-brand-green-dark font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label htmlFor="fb-titulo" className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Título *
                  </label>
                  <input
                    id="fb-titulo"
                    type="text"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder={
                      tipo === 'bug' ? 'Ej: No me deja subir el certificado'
                      : tipo === 'mejora' ? 'Ej: Agregar filtro por inspector'
                      : tipo === 'pregunta' ? 'Ej: ¿Cómo asigno un testigo?'
                      : 'Asunto breve'
                    }
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="fb-desc" className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Descripción (opcional pero útil)
                  </label>
                  <textarea
                    id="fb-desc"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    rows={4}
                    placeholder="Pasos para reproducir, lo que esperabas, lo que pasó…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>

                {/* Screenshots */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Capturas de pantalla (máx 5, hasta 10 MB c/u)
                  </label>
                  <div
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-brand-green hover:bg-brand-green-light/30 transition-colors"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      className="hidden"
                      onChange={e => handleFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-brand-green"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Adjuntar capturas o arrástralas aquí
                    </button>
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {files.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-100">
                            <span className="flex-1 truncate">{f.name}</span>
                            <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                            <button
                              type="button"
                              onClick={() => setFiles(files.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-500"
                              aria-label={`Quitar ${f.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
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
                    disabled={loading || !titulo.trim()}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
