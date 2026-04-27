'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, ClipboardList, FolderOpen, CheckCircle2,
  XCircle, FileText, RefreshCw, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notif {
  id: string
  tipo: string
  titulo: string
  mensaje: string | null
  url: string | null
  leido: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tiempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  if (hrs < 24)  return `hace ${hrs} h`
  if (dias < 7)  return `hace ${dias} d`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const TIPO_META: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
  nueva_solicitud:       { icon: ClipboardList, color: 'text-blue-500',  dot: 'bg-blue-500'  },
  solicitud_actualizada: { icon: FileText,      color: 'text-amber-500', dot: 'bg-amber-500' },
  nuevo_expediente:      { icon: FolderOpen,    color: 'text-indigo-500',dot: 'bg-indigo-500'},
  expediente_actualizado:{ icon: RefreshCw,     color: 'text-teal-500',  dot: 'bg-teal-500'  },
}

// Titulo overrides basados en status keywords
function colorTitulo(titulo: string): string {
  if (titulo.includes('aprobad') || titulo.includes('✓')) return 'text-green-700'
  if (titulo.includes('rechazad'))                        return 'text-red-700'
  if (titulo.includes('Folio asignado'))                  return 'text-indigo-700'
  return 'text-gray-800'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const supabase  = createClient()
  const router    = useRouter()
  const bellRef   = useRef<HTMLButtonElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)

  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(true)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const noLeidas = notifs.filter(n => !n.leido).length

  // ── Cargar notificaciones ────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)
    if (data) setNotifs(data as Notif[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  // ── Realtime: escuchar INSERTs propios ───────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('notif-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const nueva = payload.new as Notif
          setNotifs(prev => [nueva, ...prev].slice(0, 25))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // ── Cerrar al hacer clic fuera ───────────────────────────────────────────────
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current  && !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // ── Abrir panel: calcular posición fixed para evitar overflow-hidden ─────────
  function handleBell() {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      // Abrir a la derecha del sidebar (sidebar ~224px) con 12px de gap
      setPanelPos({ top: rect.top, left: rect.right + 12 })
    }
    setOpen(v => !v)
  }

  // ── Marcar como leída ────────────────────────────────────────────────────────
  async function marcarLeida(id: string) {
    await supabase.from('notificaciones').update({ leido: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n))
  }

  async function marcarTodasLeidas() {
    const ids = notifs.filter(n => !n.leido).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notificaciones').update({ leido: true }).in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })))
  }

  // ── Click en notificación ────────────────────────────────────────────────────
  function handleClickNotif(n: Notif) {
    marcarLeida(n.id)
    setOpen(false)
    if (n.url) router.push(n.url)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Campana */}
      <button
        ref={bellRef}
        onClick={handleBell}
        title="Notificaciones"
        className={cn(
          'relative w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
          open
            ? 'bg-white/20 text-white'
            : 'text-white/55 hover:bg-white/10 hover:text-white'
        )}
      >
        <Bell className="w-4 h-4" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 ring-2 ring-[#0A5C47] leading-none">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones — fixed para evitar overflow-hidden del sidebar */}
      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}
          className="z-[9999] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <p className="font-semibold text-gray-800 text-sm">Notificaciones</p>
              {noLeidas > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {noLeidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-[11px] text-[#0A5C47] hover:underline font-medium"
                >
                  Marcar todo leído
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-[#0A5C47] rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Bell className="w-8 h-8 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-400">Sin notificaciones</p>
              </div>
            ) : (
              notifs.map(n => {
                const meta = TIPO_META[n.tipo] ?? { icon: Bell, color: 'text-gray-400', dot: 'bg-gray-400' }
                const Icon = meta.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotif(n)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group',
                      n.leido
                        ? 'hover:bg-gray-50'
                        : 'bg-blue-50/40 hover:bg-blue-50/70'
                    )}
                  >
                    {/* Ícono de tipo */}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      n.leido ? 'bg-gray-100' : 'bg-white shadow-sm'
                    )}>
                      <Icon className={cn('w-4 h-4', n.leido ? 'text-gray-400' : meta.color)} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-tight',
                        n.leido ? 'font-normal text-gray-600' : cn('font-semibold', colorTitulo(n.titulo))
                      )}>
                        {n.titulo}
                      </p>
                      {n.mensaje && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{n.mensaje}</p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1">{tiempoRelativo(n.created_at)}</p>
                    </div>

                    {/* Dot no leída */}
                    {!n.leido && (
                      <span className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', meta.dot)} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 text-center bg-gray-50">
              <button
                onClick={() => { setOpen(false); cargar() }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Actualizar
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
