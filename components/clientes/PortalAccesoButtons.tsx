'use client'

import { useState } from 'react'
import { Mail, Link2, Check, Loader2, AlertCircle, KeyRound, Copy, X } from 'lucide-react'

interface Props {
  clienteId: string
  email: string
  tieneAcceso: boolean   // true si ya tiene usuario_id vinculado
}

export default function PortalAccesoButtons({ clienteId, email, tieneAcceso }: Props) {
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [linkStatus,   setLinkStatus  ] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [passStatus,   setPassStatus  ] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errMsg,       setErrMsg      ] = useState<string | null>(null)

  // Modal de contraseña temporal
  const [passModal,    setPassModal   ] = useState<string | null>(null)  // null = cerrado, string = contraseña
  const [passCopied,   setPassCopied  ] = useState(false)

  // ── Enviar invitación por correo ────────────────────────────────────────
  async function handleInvite() {
    setInviteStatus('loading'); setErrMsg(null)
    try {
      const res  = await fetch('/api/clientes/invitar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, action: 'invite', origin: window.location.origin }),
      })
      const data = await res.json()
      if (!res.ok) { setErrMsg(data.error ?? 'Error al enviar'); setInviteStatus('error'); return }
      setInviteStatus('ok')
      setTimeout(() => setInviteStatus('idle'), 4000)
    } catch {
      setErrMsg('Error de conexión'); setInviteStatus('error')
      setTimeout(() => setInviteStatus('idle'), 4000)
    }
  }

  // ── Generar y copiar link ───────────────────────────────────────────────
  async function handleCopyLink() {
    setLinkStatus('loading'); setErrMsg(null)
    try {
      const res  = await fetch('/api/clientes/invitar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, action: 'link', origin: window.location.origin }),
      })
      const data = await res.json()
      if (!res.ok || !data.link) {
        setErrMsg(data.error ?? 'Error al generar link'); setLinkStatus('error')
        setTimeout(() => setLinkStatus('idle'), 4000); return
      }
      await navigator.clipboard.writeText(data.link)
      setLinkStatus('copied')
      setTimeout(() => setLinkStatus('idle'), 4000)
    } catch {
      setErrMsg('Error de conexión'); setLinkStatus('error')
      setTimeout(() => setLinkStatus('idle'), 4000)
    }
  }

  // ── Crear contraseña temporal ───────────────────────────────────────────
  async function handleCrearPassword() {
    setPassStatus('loading'); setErrMsg(null)
    try {
      const res  = await fetch('/api/clientes/crear-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId }),
      })
      const data = await res.json()
      if (!res.ok) { setErrMsg(data.error ?? 'Error al crear contraseña'); setPassStatus('error'); return }
      setPassStatus('idle')
      setPassModal(data.password)   // abre modal con la contraseña
      setPassCopied(false)
    } catch {
      setErrMsg('Error de conexión'); setPassStatus('error')
    }
  }

  async function handleCopyPass() {
    if (!passModal) return
    await navigator.clipboard.writeText(passModal)
    setPassCopied(true)
    setTimeout(() => setPassCopied(false), 3000)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Email + botones inline */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-800 font-mono">{email}</span>

          {/* Invitar por correo */}
          <button
            onClick={handleInvite}
            disabled={inviteStatus === 'loading'}
            title={tieneAcceso ? 'Reenviar acceso al portal' : 'Invitar al portal por correo'}
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              inviteStatus === 'ok'    ? 'bg-green-100 text-green-700' :
              inviteStatus === 'error' ? 'bg-red-100 text-red-600' :
              'bg-brand-green-light text-brand-green hover:bg-brand-green hover:text-white',
            ].join(' ')}
          >
            {inviteStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> :
             inviteStatus === 'ok'      ? <Check   className="w-3 h-3" /> :
             inviteStatus === 'error'   ? <AlertCircle className="w-3 h-3" /> :
                                          <Mail    className="w-3 h-3" />}
            {inviteStatus === 'ok'    ? 'Enviado' :
             inviteStatus === 'error' ? 'Error' :
             tieneAcceso              ? 'Reenviar acceso' : 'Invitar al portal'}
          </button>

          {/* Copiar link */}
          <button
            onClick={handleCopyLink}
            disabled={linkStatus === 'loading'}
            title="Copiar link de acceso para enviar por WhatsApp"
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              linkStatus === 'copied' ? 'bg-green-100 text-green-700' :
              linkStatus === 'error'  ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {linkStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> :
             linkStatus === 'copied'  ? <Check   className="w-3 h-3" /> :
             linkStatus === 'error'   ? <AlertCircle className="w-3 h-3" /> :
                                        <Link2  className="w-3 h-3" />}
            {linkStatus === 'copied' ? '¡Copiado!' :
             linkStatus === 'error'  ? 'Error' : 'Copiar link'}
          </button>

          {/* Contraseña temporal */}
          <button
            onClick={handleCrearPassword}
            disabled={passStatus === 'loading'}
            title="Crear contraseña temporal para que el cliente ingrese con usuario y contraseña"
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              passStatus === 'error'   ? 'bg-red-100 text-red-600' :
              'bg-amber-50 text-amber-700 hover:bg-amber-100',
            ].join(' ')}
          >
            {passStatus === 'loading' ? <Loader2   className="w-3 h-3 animate-spin" /> :
             passStatus === 'error'   ? <AlertCircle className="w-3 h-3" /> :
                                        <KeyRound  className="w-3 h-3" />}
            {passStatus === 'error' ? 'Error' :
             tieneAcceso            ? 'Nueva contraseña temp.' : 'Contraseña temporal'}
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

        {errMsg && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />{errMsg}
          </p>
        )}
      </div>

      {/* ── Modal contraseña temporal ──────────────────────────────────── */}
      {passModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Contraseña temporal creada</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Compártela con el cliente. Deberá cambiarla en su primer ingreso.
                </p>
              </div>
              <button
                onClick={() => setPassModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contraseña */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-mono text-xl font-bold tracking-widest text-gray-900 select-all">
                {passModal}
              </span>
              <button
                onClick={handleCopyPass}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
                  passCopied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-green hover:text-brand-green',
                ].join(' ')}
              >
                {passCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {passCopied ? 'Copiada' : 'Copiar'}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠ Esta contraseña sólo se muestra una vez</p>
              <p>El cliente ingresará con su correo <span className="font-medium">{email}</span> y esta contraseña. Al iniciar sesión deberá establecer una nueva.</p>
            </div>

            <button
              onClick={() => setPassModal(null)}
              className="w-full py-2 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
