'use client'

import { useState, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/utils'
import {
  Camera, User, Shield, Briefcase,
  Eye, EyeOff, Loader2, Check, Mail,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PerfilData {
  id: string
  email: string
  nombre: string
  apellidos?: string | null
  telefono?: string | null
  rol: UserRole
  activo: boolean
  avatar_url?: string | null
}

interface InspectorData {
  numero_cedula?: string | null
  especialidad?: string | null
}

interface Props {
  usuario: PerfilData
  inspector: InspectorData | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-green" />
        </div>
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

// ─── Sección: Foto de perfil ──────────────────────────────────────────────────

function FotoSection({ usuario }: { usuario: PerfilData }) {
  const [preview, setPreview] = useState<string | null>(usuario.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { show, ToastEl } = useToast()
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      show('La imagen no puede superar 5 MB', 'error')
      return
    }

    // Preview local inmediato
    const local = URL.createObjectURL(file)
    setPreview(local)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${usuario.id}/avatar.${ext}`

      // Subir a Supabase Storage (bucket: avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      // Agregar cache-busting para forzar recarga
      const urlFinal = `${publicUrl}?t=${Date.now()}`

      // Guardar URL en base de datos
      const res = await fetch('/api/perfil/actualizar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: urlFinal }),
      })

      if (!res.ok) throw new Error('Error al guardar la foto')

      setPreview(urlFinal)
      show('Foto actualizada correctamente', 'success')
    } catch (err: any) {
      show(err.message ?? 'Error al subir la foto', 'error')
      setPreview(usuario.avatar_url ?? null) // revertir preview
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const initials = [usuario.nombre, usuario.apellidos]
    .filter(Boolean)
    .map(s => s![0].toUpperCase())
    .join('')
    .slice(0, 2)

  return (
    <Section icon={Camera} title="Foto de perfil">
      {ToastEl}
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-green flex items-center justify-center ring-4 ring-brand-green/20">
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">{initials}</span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={btnPrimary}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {uploading ? 'Subiendo…' : 'Cambiar foto'}
          </button>
          <p className="text-xs text-gray-400">JPG, PNG o WebP · máx. 5 MB</p>
        </div>
      </div>
    </Section>
  )
}

// ─── Sección: Datos personales ────────────────────────────────────────────────

function PersonalSection({ usuario }: { usuario: PerfilData }) {
  const [nombre, setNombre]     = useState(usuario.nombre ?? '')
  const [apellidos, setApellidos] = useState(usuario.apellidos ?? '')
  const [telefono, setTelefono] = useState(usuario.telefono ?? '')
  const [pending, start]        = useTransition()
  const [saved, setSaved]       = useState(false)
  const { show, ToastEl }       = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { show('El nombre es obligatorio', 'error'); return }

    start(async () => {
      const res = await fetch('/api/perfil/actualizar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellidos, telefono }),
      })
      if (res.ok) {
        setSaved(true)
        show('Datos actualizados', 'success')
        setTimeout(() => setSaved(false), 2500)
      } else {
        const d = await res.json()
        show(d.error ?? 'Error al guardar', 'error')
      }
    })
  }

  return (
    <Section icon={User} title="Información personal">
      {ToastEl}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *">
            <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
          </Field>
          <Field label="Apellidos">
            <input className={inputCls} value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Apellidos" />
          </Field>
        </div>
        <Field label="Teléfono">
          <input className={inputCls} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+52 55 1234 5678" type="tel" />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {pending ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Section>
  )
}

// ─── Sección: Perfil profesional ──────────────────────────────────────────────

function ProfesionalSection({ usuario, inspector }: { usuario: PerfilData; inspector: InspectorData | null }) {
  const [cedula, setCedula]         = useState(inspector?.numero_cedula ?? '')
  const [especialidad, setEspecialidad] = useState(inspector?.especialidad ?? '')
  const [pending, start]            = useTransition()
  const [saved, setSaved]           = useState(false)
  const { show, ToastEl }           = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await fetch('/api/perfil/actualizar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_cedula: cedula, especialidad }),
      })
      if (res.ok) {
        setSaved(true)
        show('Perfil profesional actualizado', 'success')
        setTimeout(() => setSaved(false), 2500)
      } else {
        const d = await res.json()
        show(d.error ?? 'Error al guardar', 'error')
      }
    })
  }

  return (
    <Section icon={Briefcase} title="Perfil profesional">
      {ToastEl}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Cédula profesional / Número de certificación">
          <input className={inputCls} value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Ej. 12345678" />
        </Field>
        <Field label="Especialidad / Área de inspección">
          <input className={inputCls} value={especialidad} onChange={e => setEspecialidad(e.target.value)} placeholder="Ej. Sistemas fotovoltaicos, Baja tensión…" />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {pending ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Section>
  )
}

// ─── Sección: Seguridad ───────────────────────────────────────────────────────

function SeguridadSection({ usuario }: { usuario: PerfilData }) {
  // Email
  const [newEmail, setNewEmail]     = useState('')
  const [emailPending, startEmail]  = useTransition()
  const [emailSent, setEmailSent]   = useState(false)

  // Password
  const [pw, setPw]                 = useState('')
  const [pwConfirm, setPwConfirm]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showPwC, setShowPwC]       = useState(false)
  const [pwPending, startPw]        = useTransition()
  const [pwSaved, setPwSaved]       = useState(false)

  const { show, ToastEl } = useToast()
  const supabase = createClient()

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim() || newEmail === usuario.email) return

    startEmail(async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) {
        show(error.message ?? 'Error al cambiar correo', 'error')
      } else {
        setEmailSent(true)
        show('Revisa tu nuevo correo para confirmar el cambio', 'success')
      }
    })
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8) { show('La contraseña debe tener al menos 8 caracteres', 'error'); return }
    if (pw !== pwConfirm) { show('Las contraseñas no coinciden', 'error'); return }

    startPw(async () => {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) {
        show(error.message ?? 'Error al cambiar contraseña', 'error')
      } else {
        setPw('')
        setPwConfirm('')
        setPwSaved(true)
        show('Contraseña actualizada correctamente', 'success')
        setTimeout(() => setPwSaved(false), 3000)
      }
    })
  }

  return (
    <Section icon={Shield} title="Seguridad de la cuenta">
      {ToastEl}
      <div className="space-y-6">

        {/* Correo electrónico */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Correo electrónico</p>
          <p className="text-sm text-gray-500 mb-3">
            Correo actual: <span className="font-medium text-gray-800">{usuario.email}</span>
          </p>
          {emailSent ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <Mail className="w-4 h-4 flex-shrink-0" />
              Se envió un enlace de confirmación a <strong>{newEmail}</strong>. El cambio se aplicará al hacer clic en él.
            </div>
          ) : (
            <form onSubmit={handleEmailChange} className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Nuevo correo electrónico"
                required
              />
              <button type="submit" disabled={emailPending || !newEmail} className={btnPrimary}>
                {emailPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Actualizar
              </button>
            </form>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Contraseña */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cambiar contraseña</p>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Field label="Nueva contraseña">
              <div className="relative">
                <input
                  className={`${inputCls} pr-10`}
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar contraseña">
              <div className="relative">
                <input
                  className={`${inputCls} pr-10`}
                  type={showPwC ? 'text' : 'password'}
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwC(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            {pw && pwConfirm && pw !== pwConfirm && (
              <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
            <div className="pt-1">
              <button type="submit" disabled={pwPending || pw.length < 8 || pw !== pwConfirm} className={btnPrimary}>
                {pwPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pwSaved ? <Check className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {pwPending ? 'Actualizando…' : pwSaved ? 'Contraseña actualizada' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </Section>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PerfilForm({ usuario, inspector }: Props) {
  const esInspector = ['inspector', 'inspector_responsable'].includes(usuario.rol)

  const initials = [usuario.nombre, usuario.apellidos]
    .filter(Boolean)
    .map(s => s![0].toUpperCase())
    .join('')
    .slice(0, 2)

  return (
    <div className="p-4 sm:p-8 max-w-2xl space-y-6">

      {/* Encabezado */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-green flex items-center justify-center ring-4 ring-brand-green/15 flex-shrink-0">
          {usuario.avatar_url ? (
            <img src={usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xl font-bold">{initials}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{usuario.nombre} {usuario.apellidos ?? ''}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ROLE_LABELS[usuario.rol]} · {usuario.email}
          </p>
        </div>
      </div>

      {/* Secciones */}
      <FotoSection usuario={usuario} />
      <PersonalSection usuario={usuario} />
      {esInspector && <ProfesionalSection usuario={usuario} inspector={inspector} />}
      <SeguridadSection usuario={usuario} />

    </div>
  )
}
