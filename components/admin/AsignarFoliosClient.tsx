'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/utils'
import {
  AlertTriangle, CheckCircle, FileText, Loader2,
  ChevronRight, User, Calendar, Zap, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Solicitud {
  id: string
  cliente_nombre: string
  propietario_nombre?: string
  kwp: number
  precio_propuesto: number
  porcentaje_precio: number
  status: string
  requiere_autorizacion: boolean
  notas_inspector?: string
  ciudad: string
  fecha_estimada: string
  created_at: string
  inspector: { id: string; nombre: string; apellidos: string; email: string } | null
}

interface Folio {
  id: string
  numero_folio: string
  numero_secuencial: number
}

interface Props {
  solicitudes: Solicitud[]
  foliosDisponibles: Folio[]
  solicitudIdParam?: string
  maxSecuencialAsignado?: number
}

export default function AsignarFoliosClient({ solicitudes, foliosDisponibles, solicitudIdParam, maxSecuencialAsignado = 0 }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Solicitud | null>(null)
  const [folioSeleccionado, setFolioSeleccionado] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Folio sugerido: el primero disponible con numero_secuencial > maxSecuencialAsignado
  // Si no hay ninguno mayor (todos los folios nuevos ya se usaron), cae al primero disponible
  const folioSugerido = foliosDisponibles.find(f => f.numero_secuencial > maxSecuencialAsignado)
    ?? foliosDisponibles[0]
    ?? null

  function getDefaultFolio() {
    return folioSugerido?.id ?? ''
  }

  // Auto-select from URL param
  useEffect(() => {
    if (solicitudIdParam) {
      const sol = solicitudes.find((s) => s.id === solicitudIdParam)
      if (sol) {
        setSelected(sol)
        setFolioSeleccionado(getDefaultFolio())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudIdParam, solicitudes, foliosDisponibles])

  function handleSelect(sol: Solicitud) {
    setSelected(sol)
    setResult(null)
    setFolioSeleccionado(getDefaultFolio())
  }

  async function handleAsignar() {
    if (!selected || !folioSeleccionado) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/folios/asignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: selected.id, folioId: folioSeleccionado }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error ?? 'Error al asignar folio' })
      } else {
        setResult({ success: true, message: data.message })
        setTimeout(() => {
          setSelected(null)
          setFolioSeleccionado('')
          setResult(null)
          router.refresh()
        }, 2000)
      }
    } catch {
      setResult({ success: false, message: 'Error de red. Intenta de nuevo.' })
    }
    setLoading(false)
  }

  const STATUS_BADGE: Record<string, string> = {
    pendiente: 'badge-pendiente',
    en_revision: 'badge-en_revision',
  }
  const STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_revision: 'En Revisión',
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left: solicitudes list */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Cola de Solicitudes</h2>
        {!solicitudes.length ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">Cola vacía</p>
            <p className="text-sm">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudes.map((sol) => {
              const insp = sol.inspector
              const isSelected = selected?.id === sol.id
              return (
                <button
                  key={sol.id}
                  onClick={() => handleSelect(sol)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    isSelected
                      ? 'border-brand-green bg-brand-green-light'
                      : 'border-gray-100 hover:border-brand-green/30 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-800 truncate">{sol.cliente_nombre}</p>
                        {sol.propietario_nombre && (
                          <p className="text-xs text-gray-400">Sitio: {sol.propietario_nombre}</p>
                        )}
                        <span className={STATUS_BADGE[sol.status]}>{STATUS_LABEL[sol.status]}</span>
                        {sol.requiere_autorizacion && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 rounded-full px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> Precio bajo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{sol.kwp} kWp</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(sol.precio_propuesto)}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />
                          {insp ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim() : '—'}
                        </span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateShort(sol.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 flex-shrink-0 mt-1', isSelected ? 'text-brand-green' : 'text-gray-300')} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: asignation panel */}
      <div className="card">
        {!selected ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Selecciona una solicitud</p>
            <p className="text-sm mt-1">Haz clic en una solicitud de la lista para asignar su folio.</p>
          </div>
        ) : (
          <div>
            <h2 className="font-semibold text-gray-800 mb-5">Asignar Folio</h2>

            {/* Solicitud summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cliente / EPC</span>
                <span className="font-semibold text-gray-800">{selected.cliente_nombre}</span>
              </div>
              {selected.propietario_nombre && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente Final</span>
                  <span className="text-gray-700">{selected.propietario_nombre}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Inspector</span>
                <span className="text-gray-700">
                  {selected.inspector ? `${selected.inspector.nombre} ${selected.inspector.apellidos ?? ''}`.trim() : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email Inspector</span>
                <span className="text-gray-700 font-mono text-xs">{selected.inspector?.email ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ciudad</span>
                <span className="text-gray-700">{selected.ciudad}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Potencia</span>
                <span className="text-gray-700">{selected.kwp} kWp</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(selected.precio_propuesto)}
                  {' '}
                  <span className={`text-xs ${selected.porcentaje_precio >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    ({selected.porcentaje_precio.toFixed(1)}% tabulador)
                  </span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha Est.</span>
                <span className="text-gray-700">{formatDateShort(selected.fecha_estimada)}</span>
              </div>
              {selected.requiere_autorizacion && (
                <div className="flex items-center gap-2 mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Esta solicitud requería autorización por precio bajo del 70%.
                </div>
              )}
              {selected.notas_inspector && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Notas del inspector:</p>
                  <p className="text-xs text-gray-700 mt-0.5 italic">"{selected.notas_inspector}"</p>
                </div>
              )}
            </div>

            {/* Folio selector */}
            <div className="mb-5">
              <label className="label">Seleccionar Folio de la Lista de Control *</label>
              {!foliosDisponibles.length ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  No hay folios disponibles en la lista de control.
                </div>
              ) : (
                <select
                  className="input-field font-mono"
                  value={folioSeleccionado}
                  onChange={(e) => setFolioSeleccionado(e.target.value)}
                >
                  <option value="">— Seleccionar folio —</option>
                  {foliosDisponibles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.numero_folio}
                      {f.id === folioSugerido?.id ? '  ← sugerido' : ''}
                      {f.numero_secuencial <= maxSecuencialAsignado ? '  (hueco)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {folioSugerido && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Sugerido:{' '}
                  <strong className="font-mono text-brand-green">{folioSugerido.numero_folio}</strong>
                  {' '}— continuación del último asignado
                  {maxSecuencialAsignado > 0 && (
                    <> (#{maxSecuencialAsignado})</>
                  )}
                  .{' '}
                  {foliosDisponibles.some(f => f.numero_secuencial <= maxSecuencialAsignado) && (
                    <span className="text-orange-500">
                      Hay {foliosDisponibles.filter(f => f.numero_secuencial <= maxSecuencialAsignado).length} folio(s) con hueco disponibles también.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm border',
                result.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}>
                {result.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                {result.message}
              </div>
            )}

            <div className="bg-brand-orange-light border border-brand-orange/20 rounded-lg px-4 py-3 mb-5 text-xs text-orange-800">
              <strong>Al asignar:</strong> el folio se marcará como usado en la lista de control, la solicitud cambiará a "Folio Asignado" y se enviará correo automático al inspector.
            </div>

            <button
              onClick={handleAsignar}
              disabled={loading || !folioSeleccionado || !foliosDisponibles.length || !!result?.success}
              className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Asignando…</>
              ) : (
                <><FileText className="w-4 h-4" /> Asignar Folio y Notificar</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
