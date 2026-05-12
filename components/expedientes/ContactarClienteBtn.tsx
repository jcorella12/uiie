'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2, X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  expedienteId:    string
  numeroFolio:     string
  clienteNombre:   string
  clienteEmail?:   string | null
}

export default function ContactarClienteBtn({
  expedienteId, numeroFolio, clienteNombre, clienteEmail,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setOpen(false); setAsunto(''); setMensaje(''); setError(null); setDone(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (mensaje.trim().length < 5) {
      return setError('El mensaje debe tener al menos 5 caracteres')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/expedientes/contactar-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          asunto:        asunto.trim() || undefined,
          mensaje:       mensaje.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar')
        return
      }
      setDone(true)
      router.refresh()
      setTimeout(() => reset(), 2500)
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
        title="Mandar un mensaje al cliente vía correo + portal"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Contactar cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={reset}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Contactar al cliente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sale por correo desde la cuenta de UIIE y queda registrado en el expediente.
                  </p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 space-y-1">
              <p>
                <strong>Folio:</strong> <span className="font-mono">{numeroFolio}</span>
              </p>
              <p>
                <strong>Para:</strong> {clienteNombre}
                {clienteEmail && <span className="text-blue-700"> &lt;{clienteEmail}&gt;</span>}
              </p>
              {!clienteEmail && (
                <p className="text-amber-700 mt-1 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  El cliente no tiene email registrado. Captúralo en su perfil para que llegue.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Asunto (opcional)</label>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                disabled={loading || done}
                className="input-field mt-1"
                placeholder={`Mensaje sobre tu expediente ${numeroFolio}`}
                maxLength={150}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">
                Mensaje * <span className="text-gray-400 font-normal">(mínimo 5 caracteres)</span>
              </label>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                disabled={loading || done}
                rows={6}
                className="input-field mt-1"
                placeholder="Hola, te escribo porque necesitamos que subas el dictamen UVIE firmado para poder avanzar..."
                maxLength={5000}
              />
              <p className="text-[11px] text-gray-400 mt-1">{mensaje.trim().length}/5000</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {done && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mensaje enviado. El cliente lo verá en su portal y le llegó al correo.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={reset} disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                {done ? 'Cerrar' : 'Cancelar'}
              </button>
              {!done && (
                <button type="submit" disabled={loading || !clienteEmail}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                    : <><Send className="w-4 h-4" /> Enviar mensaje</>}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  )
}
