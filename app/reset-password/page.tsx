'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green-light via-white to-brand-orange-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green rounded-2xl mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CIAE</h1>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-brand-green mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">¡Contraseña actualizada!</h2>
              <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Nueva contraseña</h2>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="label">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="input-field pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirmar contraseña</label>
                  <input
                    type="password"
                    className="input-field"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Guardando…' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
