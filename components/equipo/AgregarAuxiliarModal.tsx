'use client'

import { useState } from 'react'
import { X, UserPlus, Loader2, Copy, Check, Eye, EyeOff } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreado: () => void
}

interface ResultadoCreacion {
  usuario: { id: string; email: string; nombre: string; apellidos?: string }
  tempPassword: string
}

export function AgregarAuxiliarModal({ onClose, onCreado }: Props) {
  const [email,     setEmail]     = useState('')
  const [nombre,    setNombre]    = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoCreacion | null>(null)
  const [copiado,   setCopiado]   = useState(false)
  const [verPw,     setVerPw]     = useState(false)

  async function crear() {
    if (!email.trim() || !nombre.trim()) {
      setError('El correo y el nombre son obligatorios')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auxiliares/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), nombre: nombre.trim(), apellidos: apellidos.trim() || undefined, telefono: telefono.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setResultado(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function copiarContraseña() {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado.tempPassword)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-green" />
            <h3 className="font-semibold text-gray-800">Agregar auxiliar / administrativo</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Resultado de creación */}
        {resultado ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  {resultado.usuario.nombre}{resultado.usuario.apellidos ? ' ' + resultado.usuario.apellidos : ''} creado
                </p>
                <p className="text-xs text-green-600">{resultado.usuario.email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Contraseña temporal (compartir de forma segura):
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    readOnly
                    type={verPw ? 'text' : 'password'}
                    value={resultado.tempPassword}
                    className="input-field font-mono pr-10"
                  />
                  <button
                    onClick={() => setVerPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={copiarContraseña}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                El auxiliar deberá cambiar esta contraseña en su primer acceso.
              </p>
            </div>

            <button
              onClick={() => { onCreado(); onClose() }}
              className="btn-primary w-full"
            >
              Listo
            </button>
          </div>
        ) : (
          /* Formulario */
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Correo electrónico *</label>
                <input
                  type="email"
                  placeholder="auxiliar@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Nombre(s) *</label>
                <input
                  type="text"
                  placeholder="Juan"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input
                  type="text"
                  placeholder="García López"
                  value={apellidos}
                  onChange={e => setApellidos(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Teléfono (opcional)</label>
                <input
                  type="tel"
                  placeholder="662 123 4567"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">¿Qué puede hacer un auxiliar?</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>Ver y gestionar tus expedientes, clientes y agenda</li>
                <li>Crear y editar solicitudes de folio en tu nombre</li>
                <li>Subir documentos y completar el checklist de revisión</li>
                <li>No puede ver datos financieros ni firmar documentos oficiales</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose} className="btn-secondary" disabled={loading}>
                Cancelar
              </button>
              <button
                onClick={crear}
                disabled={loading || !email || !nombre}
                className="btn-primary flex items-center gap-2"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <UserPlus className="w-4 h-4" />
                }
                Crear auxiliar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
