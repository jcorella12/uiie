'use client'

import { useState } from 'react'
import { Mail, Link2, Check, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  clienteId: string
  email: string
  tieneAcceso: boolean   // true si ya tiene usuario_id vinculado
}

export default function PortalAccesoButtons({ clienteId, email, tieneAcceso }: Props) {
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [linkStatus, setLinkStatus]     = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [errMsg, setErrMsg]             = useState<string | null>(null)

  // ── Enviar invitación por correo ──────────────────────────────────────────
  async function handleInvite() {
    setInviteStatus('loading')
    setErrMsg(null)
    try {
      const res = await fetch('/api/clientes/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          action: 'invite',
          origin: window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrMsg(data.error ?? 'Error al enviar la invitación')
        setInviteStatus('error')
        return
      }
      setInviteStatus('ok')
      setTimeout(() => setInviteStatus('idle'), 4000)
    } catch {
      setErrMsg('Error de conexión')
      setInviteStatus('error')
      setTimeout(() => setInviteStatus('idle'), 4000)
    }
  }

  // ── Generar y copiar link ─────────────────────────────────────────────────
  async function handleCopyLink() {
    setLinkStatus('loading')
    setErrMsg(null)
    try {
      const res = await fetch('/api/clientes/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          action: 'link',
          origin: window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.link) {
        setErrMsg(data.error ?? 'Error al generar el link')
        setLinkStatus('error')
        setTimeout(() => setLinkStatus('idle'), 4000)
        return
      }
      await navigator.clipboard.writeText(data.link)
      setLinkStatus('copied')
      setTimeout(() => setLinkStatus('idle'), 4000)
    } catch {
      setErrMsg('Error de conexión')
      setLinkStatus('error')
      setTimeout(() => setLinkStatus('idle'), 4000)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Correo con botones inline */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-800 font-mono">{email}</span>

        {/* Botón invitar por correo */}
        <button
          onClick={handleInvite}
          disabled={inviteStatus === 'loading'}
          title={tieneAcceso ? 'Reenviar acceso al portal' : 'Invitar al portal por correo'}
          className={[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            inviteStatus === 'ok'
              ? 'bg-green-100 text-green-700'
              : inviteStatus === 'error'
              ? 'bg-red-100 text-red-600'
              : 'bg-brand-green-light text-brand-green hover:bg-brand-green hover:text-white',
          ].join(' ')}
        >
          {inviteStatus === 'loading' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : inviteStatus === 'ok' ? (
            <Check className="w-3 h-3" />
          ) : inviteStatus === 'error' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <Mail className="w-3 h-3" />
          )}
          {inviteStatus === 'ok'
            ? 'Enviado'
            : inviteStatus === 'error'
            ? 'Error'
            : tieneAcceso
            ? 'Reenviar acceso'
            : 'Invitar al portal'}
        </button>

        {/* Botón copiar link */}
        <button
          onClick={handleCopyLink}
          disabled={linkStatus === 'loading'}
          title="Copiar link de acceso para enviar por WhatsApp"
          className={[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            linkStatus === 'copied'
              ? 'bg-green-100 text-green-700'
              : linkStatus === 'error'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ].join(' ')}
        >
          {linkStatus === 'loading' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : linkStatus === 'copied' ? (
            <Check className="w-3 h-3" />
          ) : linkStatus === 'error' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <Link2 className="w-3 h-3" />
          )}
          {linkStatus === 'copied'
            ? '¡Copiado!'
            : linkStatus === 'error'
            ? 'Error'
            : 'Copiar link'}
        </button>
      </div>

      {/* Estado de acceso */}
      <div className="flex items-center gap-1.5">
        {tieneAcceso ? (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Acceso al portal activo
          </span>
        ) : (
          <span className="text-xs text-gray-400">Sin acceso al portal aún</span>
        )}
      </div>

      {/* Error message */}
      {errMsg && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {errMsg}
        </p>
      )}
    </div>
  )
}
