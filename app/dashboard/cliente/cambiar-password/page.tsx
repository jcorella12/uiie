'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green pr-10'

export default function CambiarPasswordPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [pending, startTransition] = useTransition()

  const [nueva,    setNueva   ] = useState('')
  const [confirma, setConfirma] = useState('')
  const [showN,    setShowN   ] = useState(false)
  const [showC,    setShowC   ] = useState(false)
  const [error,    setError   ] = useState<string | null>(null)
  const [ok,       setOk      ] = useState(false)

  function validar(): string | null {
    if (nueva.length < 8)              return 'La contraseña debe tener al menos 8 caracteres'
    if (nueva !== confirma)            return 'Las contraseñas no coinciden'
    if (/^[A-Z]{4}-\d{4}$/.test(nueva)) return 'Esa parece ser tu contraseña temporal — usa una nueva'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const err = validar()
    if (err) { setError(err); return }

    startTransition(async () => {
      try {
        // 1. Cambiar contraseña en Supabase Auth
        const { error: authErr } = await supabase.auth.updateUser({ password: nueva })
        if (authErr) throw new Error(authErr.message)

        // 2. Limpiar el flag debe_cambiar_password
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('usuarios')
            .update({ debe_cambiar_password: false })
            .eq('id', user.id)
        }

        setOk(true)
        setTimeout(() => router.replace('/dashboard/cliente'), 1800)
      } catch (err: any) {
        setError(err.message ?? 'Error al cambiar la contraseña')
      }
    })
  }

  if (ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-lg font-semibold text-gray-900">¡Contraseña actualizada!</h2>
          <p className="text-sm text-gray-500">Redirigiendo a tu portal…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Establece tu contraseña</h1>
          <p className="text-sm text-gray-500">
            Tu cuenta usa una contraseña temporal. Crea una nueva contraseña para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva contraseña */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showN ? 'text' : 'password'}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                className={inputCls}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowN(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showC ? 'text' : 'password'}
                value={confirma}
                onChange={e => setConfirma(e.target.value)}
                className={inputCls}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowC(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Indicador de fuerza simple */}
          {nueva.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    className={[
                      'h-1 flex-1 rounded-full transition-colors',
                      nueva.length >= n * 2 + 4
                        ? n <= 2 ? 'bg-amber-400' : 'bg-brand-green'
                        : 'bg-gray-200',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                {nueva.length < 8 ? 'Muy corta' : nueva.length < 10 ? 'Aceptable' : nueva.length < 12 ? 'Buena' : 'Excelente'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || nueva.length < 8 || nueva !== confirma}
            className="w-full py-2.5 rounded-xl bg-brand-green text-white font-semibold text-sm hover:bg-brand-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-300">
          <Zap className="w-3 h-3" />
          <span>CIAE · UIIE-CRE-021</span>
        </div>
      </div>
    </div>
  )
}
