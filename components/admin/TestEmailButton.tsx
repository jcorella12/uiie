'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

/**
 * Botón para probar el envío de email vía Resend. Lo ve sólo admin/responsable.
 */
export default function TestEmailButton() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleTest() {
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await r.json()
      if (!r.ok) {
        setResult({ ok: false, msg: data.error ?? 'No se pudo enviar' })
      } else {
        setResult({ ok: true, msg: `Enviado a ${data.sent_to}` })
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Mail className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-800">Prueba de email (Resend)</p>
          <p className="text-xs text-gray-500">Envía un email de prueba a tu propia cuenta para validar la integración.</p>
        </div>
      </div>
      <button
        onClick={handleTest}
        disabled={loading}
        className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Enviar prueba
      </button>
      {result && (
        <div className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
          result.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                   : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {result.ok ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{result.msg}</span>
        </div>
      )}
    </div>
  )
}
