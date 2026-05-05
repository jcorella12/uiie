'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  X, Loader2, ExternalLink, Check, MessageCircle, AlertTriangle,
  Bug, Lightbulb, HelpCircle,
} from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  nuevo:       { label: 'Nuevo',       color: 'bg-red-100 text-red-700 border-red-200' },
  en_revision: { label: 'En revisión', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  resuelto:    { label: 'Resuelto',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  descartado:  { label: 'Descartado',  color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const TIPO_META: Record<string, { label: string; Icon: any; color: string }> = {
  bug:      { label: 'Bug',           Icon: Bug,           color: 'red' },
  mejora:   { label: 'Mejora / Idea', Icon: Lightbulb,     color: 'amber' },
  pregunta: { label: 'Pregunta',      Icon: HelpCircle,    color: 'blue' },
  otro:     { label: 'Otro',          Icon: MessageCircle, color: 'gray' },
}

function tipoMeta(t: string) {
  return TIPO_META[t] ?? TIPO_META.otro
}

type FeedbackItem = {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  url_pagina: string | null
  user_agent: string | null
  screenshots: { path: string; nombre: string; size: number }[]
  status: string
  prioridad: number
  notas_responsable: string | null
  atendido_por: string | null
  atendido_en: string | null
  created_at: string
  updated_at: string
  reporter: { id: string; nombre: string; apellidos: string; email: string; rol: string } | null
  atendedor: { id: string; nombre: string; apellidos: string } | null
}

export default function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroTipo,   setFiltroTipo]   = useState<string>('todos')
  const [seleccionado, setSeleccionado] = useState<FeedbackItem | null>(null)

  const visibles = useMemo(() => items.filter(i => {
    if (filtroStatus !== 'todos' && i.status !== filtroStatus) return false
    if (filtroTipo !== 'todos' && i.tipo !== filtroTipo) return false
    return true
  }), [items, filtroStatus, filtroTipo])

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="nuevo">Nuevos</option>
          <option value="en_revision">En revisión</option>
          <option value="resuelto">Resueltos</option>
          <option value="descartado">Descartados</option>
        </select>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
        >
          <option value="todos">Todos los tipos</option>
          <option value="bug">Bugs</option>
          <option value="mejora">Mejoras</option>
          <option value="pregunta">Preguntas</option>
          <option value="otro">Otros</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">{visibles.length} de {items.length}</span>
      </div>

      {/* Tabla */}
      {visibles.length === 0 ? (
        <div className="card text-center py-10">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">Sin feedback con estos filtros</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-2.5 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500">Título</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500">Reporter</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500">Status</th>
                <th className="text-left px-3 py-2.5 font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(item => {
                const meta = tipoMeta(item.tipo)
                const Icon = meta.Icon
                const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.nuevo
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSeleccionado(item)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded text-${meta.color}-700 bg-${meta.color}-50 border border-${meta.color}-200`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium max-w-xs truncate">
                      {item.titulo}
                      {item.screenshots?.length > 0 && (
                        <span className="ml-1.5 text-xs text-gray-400">📎 {item.screenshots.length}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {item.reporter
                        ? `${item.reporter.nombre} ${item.reporter.apellidos}`.trim()
                        : '—'}
                      <span className="text-gray-400 block">{item.reporter?.rol}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer detalle */}
      {seleccionado && (
        <FeedbackDrawer
          item={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </>
  )
}

function FeedbackDrawer({
  item, onClose,
}: {
  item: FeedbackItem
  onClose: () => void
}) {
  const router = useRouter()
  const [status,   setStatus]   = useState(item.status)
  const [prioridad, setPrioridad] = useState(item.prioridad)
  const [notas,    setNotas]    = useState(item.notas_responsable ?? '')
  const [loading,  setLoading]  = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  const meta = tipoMeta(item.tipo)
  const Icon = meta.Icon

  // Generar signed URLs para los screenshots al abrir
  useEffect(() => {
    const sb = createClient()
    item.screenshots?.forEach(async (s) => {
      const { data } = await sb.storage.from('documentos').createSignedUrl(s.path, 3600)
      if (data?.signedUrl) {
        setSignedUrls(prev => ({ ...prev, [s.path]: data.signedUrl }))
      }
    })
  }, [item.id])

  async function guardar() {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback/atender', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: item.id,
          status,
          notas_responsable: notas,
          prioridad,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error ?? 'No se pudo guardar')
        return
      }
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 text-${meta.color}-600`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{meta.label}</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{item.titulo}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Reporter + meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-0.5">Reportado por</p>
              <p className="font-semibold text-gray-800">
                {item.reporter ? `${item.reporter.nombre} ${item.reporter.apellidos}`.trim() : '—'}
              </p>
              <p className="text-gray-500">{item.reporter?.email} · {item.reporter?.rol}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Fecha</p>
              <p className="font-semibold text-gray-800">
                {new Date(item.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Descripción */}
          {item.descripcion && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {item.descripcion}
            </div>
          )}

          {/* URL de la página */}
          {item.url_pagina && (
            <div className="text-xs">
              <p className="text-gray-500 mb-1">Página donde se reportó</p>
              <a
                href={item.url_pagina}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-green hover:underline break-all"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                {item.url_pagina}
              </a>
            </div>
          )}

          {/* Screenshots */}
          {item.screenshots?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Capturas adjuntas ({item.screenshots.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {item.screenshots.map((s, i) => {
                  const url = signedUrls[s.path]
                  const isImg = /\.(jpe?g|png|webp|gif)$/i.test(s.nombre)
                  return (
                    <a
                      key={i}
                      href={url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-gray-200 overflow-hidden hover:border-brand-green"
                    >
                      {isImg && url
                        ? <img src={url} alt={s.nombre} className="w-full h-32 object-cover" />
                        : <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-500 p-2">
                            📄 {s.nombre}
                          </div>}
                      <p className="text-[10px] text-gray-500 px-2 py-1 bg-gray-50 border-t border-gray-100 truncate">{s.nombre}</p>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Atender */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Atender</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="en_revision">En revisión</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prioridad (1=baja, 5=alta)</label>
                <select
                  value={prioridad}
                  onChange={e => setPrioridad(parseInt(e.target.value, 10))}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notas internas (opcional)</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={3}
                placeholder="Lo que se hizo, contexto, próximos pasos…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>

            {item.atendedor && item.atendido_en && (
              <p className="text-[11px] text-gray-500">
                Última atención: <strong>{`${item.atendedor.nombre} ${item.atendedor.apellidos}`.trim()}</strong> el{' '}
                {new Date(item.atendido_en).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={guardar}
                disabled={loading}
                className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
