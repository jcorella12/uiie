'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, FileText, CheckCircle2, Trash2, Inbox, Search, X,
  Loader2, AlertTriangle, Calendar, Award,
} from 'lucide-react'

interface Pendiente {
  id:                 string
  from_email:         string | null
  to_email:           string | null
  subject:            string | null
  body_text:          string | null
  received_at:        string
  numero_certificado: string | null
  cliente_extraido:   string | null
  pdf_storage_path:   string | null
  pdf_nombre:         string | null
  pdf_size_bytes:     number | null
  status:             'pendiente' | 'aplicado' | 'descartado' | 'error'
  expediente_id:      string | null
  resuelto_at:        string | null
  motivo_descarte:    string | null
  match_candidates:   Array<{ expediente_id: string; folio: string; cliente: string; score: number }> | null
  auto_resuelto:      boolean
}

interface Props { pendientes: Pendiente[] }

const STATUS_LABEL: Record<Pendiente['status'], { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  aplicado:   { label: 'Aplicado',   color: 'bg-green-100 text-green-700 border-green-200' },
  descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  error:      { label: 'Error',      color: 'bg-red-100 text-red-700 border-red-200' },
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PendientesCNEClient({ pendientes }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<'todos' | Pendiente['status']>('pendiente')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr]   = useState<string | null>(null)
  const [folioManual, setFolioManual] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    return pendientes.filter(p => {
      if (filter !== 'todos' && p.status !== filter) return false
      if (!search) return true
      const s = search.toLowerCase()
      return (
        (p.numero_certificado ?? '').toLowerCase().includes(s) ||
        (p.cliente_extraido   ?? '').toLowerCase().includes(s) ||
        (p.subject            ?? '').toLowerCase().includes(s) ||
        (p.from_email         ?? '').toLowerCase().includes(s)
      )
    })
  }, [pendientes, filter, search])

  const counts = useMemo(() => ({
    pendiente:  pendientes.filter(p => p.status === 'pendiente').length,
    aplicado:   pendientes.filter(p => p.status === 'aplicado').length,
    descartado: pendientes.filter(p => p.status === 'descartado').length,
    error:      pendientes.filter(p => p.status === 'error').length,
  }), [pendientes])

  async function aplicar(p: Pendiente, expedienteId: string) {
    setBusy(p.id); setErr(null)
    try {
      const res = await fetch(`/api/cne/inbound/pendientes/${p.id}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      router.refresh()
    } catch (e: any) {
      setErr(`${p.id.slice(0,8)}: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }

  async function descartar(p: Pendiente) {
    const motivo = window.prompt('Motivo del descarte (mín 5 caracteres):')
    if (!motivo || motivo.trim().length < 5) return
    setBusy(p.id); setErr(null)
    try {
      const res = await fetch(`/api/cne/inbound/pendientes/${p.id}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descartar: true, motivo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      router.refresh()
    } catch (e: any) {
      setErr(`${p.id.slice(0,8)}: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }

  async function aplicarPorFolio(p: Pendiente) {
    const folio = (folioManual[p.id] ?? '').trim()
    if (!folio) return setErr('Captura un folio')
    setBusy(p.id); setErr(null)
    try {
      // Buscar el expediente por folio (vía API search? Por simplicidad, query directo)
      const r = await fetch(`/api/expedientes/buscar-folio?folio=${encodeURIComponent(folio)}`)
      if (!r.ok) {
        // Fallback: fallar elegante
        throw new Error(`No se pudo buscar el folio "${folio}". Usa el dashboard de expedientes.`)
      }
      const { expediente_id } = await r.json()
      if (!expediente_id) throw new Error(`Folio "${folio}" no encontrado`)
      await aplicar(p, expediente_id)
    } catch (e: any) {
      setErr(e.message)
      setBusy(null)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Inbox className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bandeja CNE — Certificados pendientes</h1>
          <p className="text-sm text-gray-500">
            Correos del CNE que el sistema no pudo asignar automáticamente
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {(['pendiente', 'aplicado', 'descartado', 'error', 'todos'] as const).map(s => {
          const active = filter === s
          const count = s === 'todos' ? pendientes.length : counts[s]
          const label = s === 'todos' ? 'Todos' : STATUS_LABEL[s].label
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${active ? 'opacity-90' : 'text-gray-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cert, cliente, asunto, remitente…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {err && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {err}
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">
            {filter === 'pendiente' ? 'No hay correos pendientes' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const st = STATUS_LABEL[p.status]
            const tienePdf = !!p.pdf_storage_path
            const candidatos = p.match_candidates ?? []

            return (
              <div key={p.id} className="card space-y-3">
                {/* Header del correo */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.color}`}>
                        {st.label}
                      </span>
                      {p.auto_resuelto && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-1.5 py-0.5">
                          AUTO
                        </span>
                      )}
                      {p.numero_certificado && (
                        <span className="font-mono text-sm font-bold text-brand-green flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {p.numero_certificado}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {p.subject ?? '(sin asunto)'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                      <span><strong>De:</strong> {p.from_email ?? '—'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(p.received_at)}</span>
                      {tienePdf && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <FileText className="w-3 h-3" /> PDF adjunto
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {p.cliente_extraido && (
                  <p className="text-xs text-gray-600">
                    <strong>Cliente extraído:</strong> {p.cliente_extraido}
                  </p>
                )}

                {/* Acciones — solo si está pendiente */}
                {p.status === 'pendiente' && (
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    {/* Candidatos sugeridos */}
                    {candidatos.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-gray-700">
                          {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''} encontrado{candidatos.length !== 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-1.5">
                          {candidatos.slice(0, 5).map(c => (
                            <div key={c.expediente_id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm">
                                  <span className="font-mono font-semibold text-brand-green">{c.folio}</span>
                                  <span className="text-gray-500 ml-2 truncate">{c.cliente}</span>
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Coincidencia: {(c.score * 100).toFixed(0)}%
                                </p>
                              </div>
                              <button
                                onClick={() => aplicar(p, c.expediente_id)}
                                disabled={busy === p.id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50 inline-flex items-center gap-1.5"
                              >
                                {busy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Aplicar
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        No se encontraron expedientes que coincidan. Captura el folio manualmente abajo.
                      </p>
                    )}

                    {/* Asignación manual por folio */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="o captura folio manual: UIIE-XXX-2026"
                        value={folioManual[p.id] ?? ''}
                        onChange={e => setFolioManual({ ...folioManual, [p.id]: e.target.value })}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 font-mono"
                      />
                      <button
                        onClick={() => aplicarPorFolio(p)}
                        disabled={busy === p.id || !folioManual[p.id]}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-green text-brand-green hover:bg-brand-green-light disabled:opacity-50"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={() => descartar(p)}
                        disabled={busy === p.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Descartar
                      </button>
                    </div>
                  </div>
                )}

                {/* Estado resuelto */}
                {p.status !== 'pendiente' && p.resuelto_at && (
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    {p.status === 'aplicado' && p.expediente_id && (
                      <span>✓ Aplicado el {fmtDate(p.resuelto_at)}</span>
                    )}
                    {p.status === 'descartado' && p.motivo_descarte && (
                      <span>Descartado el {fmtDate(p.resuelto_at)} — {p.motivo_descarte}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
