'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, CheckCircle2, Link2,
  AlertTriangle, KeyRound, Eye, EyeOff, UserCog,
  Mail, ShieldAlert, UserCheck,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/utils'
import { UserRole } from '@/lib/types'

const _supabase = createClient()

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'inspector',             label: 'Inspector',             desc: 'Crea y gestiona sus propios expedientes' },
  { value: 'inspector_responsable', label: 'Inspector Responsable', desc: 'Revisa solicitudes, asigna folios y ve todo' },
  { value: 'auxiliar',              label: 'Auxiliar',              desc: 'Acceso de solo lectura a expedientes' },
  { value: 'admin',                 label: 'Administrador',         desc: 'Acceso completo al sistema' },
  { value: 'cliente',               label: 'Cliente',               desc: 'Solo ve su portal de expedientes' },
]

interface UsuarioData {
  id: string
  email: string
  nombre: string
  apellidos: string | null
  telefono: string | null
  rol: UserRole
  activo: boolean
}

interface ClienteOption {
  id: string
  nombre: string
  ciudad: string | null
  rfc: string | null
  usuario_id: string | null
  inspector_id: string | null
}

interface InspectorOption {
  id: string
  nombre: string
  apellidos: string | null
  rol: string
}

export default function EditarUsuarioPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = _supabase

  const [usuario, setUsuario]               = useState<UsuarioData | null>(null)
  const [clientes, setClientes]             = useState<ClienteOption[]>([])
  const [clienteVinculado, setClienteVinculado] = useState<string>('')
  const [inspectores, setInspectores]       = useState<InspectorOption[]>([])
  const [inspectorAsignado, setInspectorAsignado] = useState<string>('')
  // Supervisor — para auxiliar / inspector, su jefe responsable
  const [supervisorId, setSupervisorId] = useState<string>('')
  const [loading, setLoading]               = useState(true)

  // ── Datos personales ──
  const [nombre,    setNombre]    = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [email,     setEmail]     = useState('')
  const [activo,    setActivo]    = useState(true)
  const [rol,       setRol]       = useState<UserRole>('inspector')

  // ── Contraseña ──
  const [nuevaPass,    setNuevaPass]    = useState('')
  const [confirmaPass, setConfirmaPass] = useState('')
  const [showPass,     setShowPass]     = useState(false)

  // ── UI state ──
  const [savingDatos, setSavingDatos] = useState(false)
  const [savingPass,  setSavingPass]  = useState(false)
  const [savedDatos,  setSavedDatos]  = useState(false)
  const [savedPass,   setSavedPass]   = useState(false)
  const [errorDatos,  setErrorDatos]  = useState<string | null>(null)
  const [errorPass,   setErrorPass]   = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      const id = params.id as string
      const [{ data: u }, { data: cl }, { data: insp }] = await Promise.all([
        supabase.from('usuarios').select('id, email, nombre, apellidos, telefono, rol, activo, supervisor_id').eq('id', id).single(),
        supabase.from('clientes').select('id, nombre, ciudad, rfc, usuario_id, inspector_id').order('nombre'),
        supabase.from('usuarios').select('id, nombre, apellidos, rol')
          .in('rol', ['inspector', 'inspector_responsable', 'auxiliar', 'admin'])
          .eq('activo', true)
          .order('nombre'),
      ])
      if (u) {
        setUsuario(u as UsuarioData)
        setNombre(u.nombre ?? '')
        setApellidos(u.apellidos ?? '')
        setTelefono(u.telefono ?? '')
        setEmail(u.email ?? '')
        setActivo(u.activo ?? true)
        setRol((u.rol as UserRole) ?? 'inspector')
        setSupervisorId((u as any).supervisor_id ?? '')
        const vinculado = (cl ?? []).find((c: ClienteOption) => c.usuario_id === id)
        if (vinculado) {
          setClienteVinculado(vinculado.id)
          setInspectorAsignado(vinculado.inspector_id ?? '')
        }
      }
      setClientes(cl ?? [])
      setInspectores((insp ?? []) as InspectorOption[])
      setLoading(false)
    }
    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guardar datos generales ──────────────────────────────────────────────
  async function guardarDatos() {
    if (!usuario) return
    setSavingDatos(true)
    setErrorDatos(null)

    const emailCambiado = email.trim().toLowerCase() !== usuario.email
    const res = await fetch('/api/usuarios/actualizar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:        usuario.id,
        nombre:    nombre.trim(),
        apellidos: apellidos.trim() || null,
        telefono:  telefono.trim() || null,
        ...(emailCambiado ? { email: email.trim().toLowerCase() } : {}),
        rol,
        activo,
        // Supervisor solo aplica para auxiliar / inspector. Para otros roles
        // mandamos null para limpiar cualquier valor previo.
        supervisor_id: (rol === 'auxiliar' || rol === 'inspector')
          ? (supervisorId || null)
          : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setErrorDatos(data.error ?? 'Error al guardar'); setSavingDatos(false); return }

    // Gestionar vínculo de cliente si aplica
    if (rol === 'cliente') {
      await supabase.from('clientes').update({ usuario_id: null }).eq('usuario_id', usuario.id)
        .neq('id', clienteVinculado || '00000000-0000-0000-0000-000000000000')
      if (clienteVinculado) {
        // Vincula el cliente al usuario y, en el mismo paso, al inspector
        // que el admin haya elegido (puede ser null = sin asignar).
        await supabase.from('clientes').update({
          usuario_id: usuario.id,
          inspector_id: inspectorAsignado || null,
        }).eq('id', clienteVinculado)
      }
    }

    setSavingDatos(false)
    setSavedDatos(true)
    setUsuario(prev => prev ? { ...prev, nombre: nombre.trim(), apellidos: apellidos || null, telefono: telefono || null, rol, activo, email: emailCambiado ? email.trim().toLowerCase() : prev.email } : prev)
    setTimeout(() => setSavedDatos(false), 3000)
  }

  // ── Cambiar contraseña ───────────────────────────────────────────────────
  async function cambiarPassword() {
    if (!usuario) return
    if (nuevaPass !== confirmaPass) { setErrorPass('Las contraseñas no coinciden'); return }
    if (nuevaPass.length < 6)       { setErrorPass('La contraseña debe tener al menos 6 caracteres'); return }

    setSavingPass(true)
    setErrorPass(null)
    const res = await fetch('/api/usuarios/actualizar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: usuario.id, password: nuevaPass }),
    })
    const data = await res.json()
    if (!res.ok) { setErrorPass(data.error ?? 'Error al cambiar contraseña'); setSavingPass(false); return }

    setNuevaPass('')
    setConfirmaPass('')
    setSavingPass(false)
    setSavedPass(true)
    setTimeout(() => setSavedPass(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando usuario…
      </div>
    )
  }

  if (!usuario) return <div className="p-4 sm:p-8 text-red-500">Usuario no encontrado.</div>

  const clientesDisponibles = clientes.filter(c => !c.usuario_id || c.id === clienteVinculado)

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Usuarios
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center shrink-0">
          <UserCog className="w-5 h-5 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {usuario.nombre} {usuario.apellidos ?? ''}
          </h1>
          <p className="text-sm text-gray-500">{usuario.email}</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Datos generales ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-gray-400" />
            Datos del usuario
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="label">Apellidos</label>
              <input value={apellidos} onChange={e => setApellidos(e.target.value)} className="input-field w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field w-full"
              />
              {email.trim().toLowerCase() !== usuario.email && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  El email se actualizará al guardar
                </p>
              )}
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="+52 33 1234 5678"
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="activo"
              type="checkbox"
              checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="w-4 h-4 accent-brand-green"
            />
            <label htmlFor="activo" className="text-sm text-gray-700 font-medium cursor-pointer">
              Usuario activo
            </label>
            {!activo && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                El usuario no podrá iniciar sesión
              </span>
            )}
          </div>

          {errorDatos && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorDatos}
            </div>
          )}

          <button
            onClick={guardarDatos}
            disabled={savingDatos || !nombre.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {savingDatos ? <Loader2 className="w-4 h-4 animate-spin" /> : savedDatos ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savingDatos ? 'Guardando…' : savedDatos ? 'Guardado ✓' : 'Guardar cambios'}
          </button>
        </div>

        {/* ── Rol ── */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
            Rol en el sistema
          </h2>
          <div className="space-y-2">
            {ROLES.map(r => (
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
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {rol !== usuario.rol && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              El rol cambiará al hacer clic en "Guardar cambios" arriba
            </p>
          )}

          {/* Supervisor — solo para auxiliar / inspector */}
          {(rol === 'auxiliar' || rol === 'inspector') && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-brand-green" />
                Inspector responsable / supervisor
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {rol === 'auxiliar'
                  ? 'Inspector al que reporta este auxiliar (ej. Alejandra → Luis Felipe).'
                  : 'Inspector responsable que supervisa a este inspector.'}
              </p>
              <select
                value={supervisorId}
                onChange={e => setSupervisorId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">— Sin supervisor asignado —</option>
                {inspectores
                  .filter(i => i.id !== usuario.id) // un usuario no puede ser su propio supervisor
                  .filter(i => ['inspector', 'inspector_responsable', 'admin'].includes(i.rol))
                  .map(i => (
                    <option key={i.id} value={i.id}>
                      {[i.nombre, i.apellidos].filter(Boolean).join(' ')}
                      {' — '}
                      {ROLE_LABELS[i.rol as UserRole] ?? i.rol}
                    </option>
                  ))}
              </select>
              {supervisorId && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Aparecerá en el catálogo de usuarios como reporte de este inspector
                </p>
              )}
            </div>
          )}

          {/* Vínculo cliente */}
          {rol === 'cliente' && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-brand-green" />
                Vincular con registro de cliente
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Al vincular, este usuario podrá ver sus expedientes en el portal del cliente.
              </p>
              <select
                value={clienteVinculado}
                onChange={e => setClienteVinculado(e.target.value)}
                className="input-field w-full"
              >
                <option value="">— Sin vincular —</option>
                {clientesDisponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.ciudad ? ` — ${c.ciudad}` : ''}{c.rfc ? ` (${c.rfc})` : ''}
                  </option>
                ))}
              </select>
              {clienteVinculado && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Cliente vinculado — verá sus proyectos en el portal
                </p>
              )}

              {clienteVinculado && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-brand-green" />
                    Asignar inspector responsable
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    El inspector elegido verá este cliente en su catálogo y podrá
                    crearle expedientes. Deja en blanco para mantenerlo sin asignar.
                  </p>
                  <select
                    value={inspectorAsignado}
                    onChange={e => setInspectorAsignado(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">— Sin asignar —</option>
                    {inspectores.map(i => (
                      <option key={i.id} value={i.id}>
                        {[i.nombre, i.apellidos].filter(Boolean).join(' ')}
                        {' — '}
                        {ROLE_LABELS[i.rol as UserRole] ?? i.rol}
                      </option>
                    ))}
                  </select>
                  {inspectorAsignado && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Inspector asignado — el cliente aparecerá en su lista
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Cambio de contraseña ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-400" />
            Cambiar contraseña
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={nuevaPass}
                  onChange={e => setNuevaPass(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmaPass}
                onChange={e => setConfirmaPass(e.target.value)}
                className="input-field w-full"
                placeholder="Repite la contraseña"
              />
              {confirmaPass && nuevaPass !== confirmaPass && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
              {confirmaPass && nuevaPass === confirmaPass && confirmaPass.length >= 6 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Coinciden
                </p>
              )}
            </div>
          </div>

          {errorPass && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorPass}
            </div>
          )}

          <button
            onClick={cambiarPassword}
            disabled={savingPass || !nuevaPass || nuevaPass !== confirmaPass || nuevaPass.length < 6}
            className="btn-primary flex items-center gap-2"
          >
            {savingPass
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Cambiando…</>
              : savedPass
              ? <><CheckCircle2 className="w-4 h-4" /> Contraseña actualizada ✓</>
              : <><KeyRound className="w-4 h-4" /> Cambiar contraseña</>
            }
          </button>
        </div>

      </div>
    </div>
  )
}
