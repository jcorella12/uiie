'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/utils'
import { UserRole } from '@/lib/types'

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'inspector',             label: 'Inspector',             desc: 'Crea y gestiona sus propios expedientes' },
  { value: 'inspector_responsable', label: 'Inspector Responsable', desc: 'Revisa solicitudes y asigna folios' },
  { value: 'auxiliar',              label: 'Auxiliar',              desc: 'Acceso de solo lectura a expedientes' },
  { value: 'admin',                 label: 'Administrador',         desc: 'Acceso completo al sistema' },
  { value: 'cliente',               label: 'Cliente',               desc: 'Solo ve su portal de expedientes' },
]

export default function NuevoUsuarioPage() {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [nombre, setNombre]       = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono, setTelefono]   = useState('')
  const [rol, setRol]             = useState<UserRole>('inspector')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [sinPass, setSinPass]     = useState(true) // por defecto sin contraseña (el usuario la crea en su primer acceso)

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/usuarios/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        telefono: telefono.trim() || undefined,
        rol,
        password: sinPass ? undefined : password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear usuario')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard/admin/usuarios'), 1800)
  }

  if (success) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="card text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Usuario creado</h2>
          <p className="text-gray-500 text-sm">
            {sinPass
              ? 'El usuario deberá iniciar sesión con un magic link o establecer su contraseña.'
              : 'El usuario ya puede iniciar sesión con la contraseña asignada.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link
        href="/dashboard/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Usuarios
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo usuario</h1>
        <p className="text-gray-500 text-sm mt-1">Crea un acceso al sistema para un inspector, auxiliar o cliente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Datos personales ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Datos del usuario</h2>

          <div>
            <label className="label">Correo electrónico <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              placeholder="correo@empresa.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-field w-full"
                placeholder="Nombre(s)"
                required
              />
            </div>
            <div>
              <label className="label">Apellidos</label>
              <input
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="input-field w-full"
                placeholder="Apellidos"
              />
            </div>
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="input-field w-full"
              placeholder="+52 33 1234 5678"
            />
          </div>
        </div>

        {/* ── Rol ── */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Rol en el sistema</h2>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 border-2 rounded-xl p-3 cursor-pointer transition-all select-none ${
                  rol === r.value
                    ? 'border-brand-green bg-brand-green-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={r.value}
                  checked={rol === r.value}
                  onChange={() => setRol(r.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                  rol === r.value ? 'border-brand-green bg-brand-green' : 'border-gray-300'
                }`}>
                  {rol === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${rol === r.value ? 'text-brand-green' : 'text-gray-700'}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-500 font-normal">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Contraseña ── */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Acceso</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sinPass}
              onChange={(e) => setSinPass(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-brand-green"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">El usuario establece su propia contraseña</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Recomendado — el usuario recibirá un enlace para entrar la primera vez
              </p>
            </div>
          </label>

          {!sinPass && (
            <div>
              <label className="label">Contraseña temporal <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required={!sinPass}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-1">El usuario deberá cambiarla en su primer inicio de sesión.</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !nombre}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? 'Creando usuario…' : 'Crear usuario'}
        </button>
      </form>
    </div>
  )
}
