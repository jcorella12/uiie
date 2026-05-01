'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Lock, Unlock, Loader2, Zap,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────
type ChecklistItem = {
  id: number
  orden: number
  descripcion: string
  categoria: string
}

type CheckEntry = {
  item_id: number
  completado: boolean
  completado_por: string | null
  completado_en: string | null
  observacion: string | null
}

export interface ChecklistExpedienteData {
  resolutivo_folio?: string | null
  resolutivo_fecha?: string | null
  resolutivo_tiene_cobro?: boolean | null
  resolutivo_monto?: number | null
  resolutivo_referencia?: string | null
  numero_medidor?: string | null
  kwp?: number | null
  dictamen_folio_dvnp?: string | null
  inversor_id?: string | null
}

interface Props {
  expedienteId: string
  readOnly?: boolean
  onProgresoCambio?: (pct: number) => void
  // Datos del expediente para auto-completar
  expediente?: ChecklistExpedienteData
  documentosTipos?: string[]
  tieneTestigos?: boolean
}

// Items cuyo estado se calcula automáticamente a partir de los datos del expediente
// El inspector TAMBIÉN puede togglearlos manualmente
const AUTO_ORDENES = new Set([1, 2, 3, 4, 5, 6, 9, 10])

function computeAutoStates(
  exp: ChecklistExpedienteData,
  docTipos: string[],
  tieneTestigos: boolean,
): Map<number, boolean> {
  const m = new Map<number, boolean>()
  // 1. Resolutivo con folio y fecha
  m.set(1, !!(exp.resolutivo_folio && exp.resolutivo_fecha))
  // 2. Número de medidor capturado en el expediente
  // (el resolutivo CFE no incluye el medidor — solo se valida que el medidor exista)
  m.set(2, !!exp.numero_medidor)
  // 3. Dictamen UVIE con folio y documento subido
  m.set(3, !!(exp.dictamen_folio_dvnp && docTipos.includes('dictamen')))
  // 4. Comprobante pago: si el resolutivo tiene cobro, requiere
  //    monto + referencia + el documento `ficha_pago` subido.
  m.set(4,
    !!(exp.resolutivo_folio) &&
    (
      !exp.resolutivo_tiene_cobro ||
      !!(
        exp.resolutivo_monto &&
        exp.resolutivo_referencia &&
        docTipos.includes('ficha_pago')
      )
    )
  )
  // 5. kWp coincide: ambos datos presentes
  m.set(5, !!(exp.kwp && exp.resolutivo_folio))
  // 6. Inversor en catálogo → certificación verificada
  m.set(6, !!exp.inversor_id)
  // 9. INE/IFE: hay testigos asignados en alguna inspección
  m.set(9, tieneTestigos)
  // 10. Acta de inspección subida
  m.set(10, docTipos.includes('acta'))
  return m
}

// ─── Componente ───────────────────────────────────────────────
const _supabase = createClient()

export function ChecklistRevision({
  expedienteId,
  readOnly = false,
  onProgresoCambio,
  expediente,
  documentosTipos = [],
  tieneTestigos = false,
}: Props) {
  const supabase = _supabase

  const [items,     setItems]     = useState<ChecklistItem[]>([])
  const [checks,    setChecks]    = useState<Map<number, CheckEntry>>(new Map())
  const [loading,   setLoading]   = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [guardando, setGuardando] = useState<Set<number>>(new Set())
  const [abierto,   setAbierto]   = useState(true)

  const checksRef = useRef(checks)
  useEffect(() => { checksRef.current = checks }, [checks])

  // ── Cargar datos iniciales ───────────────────────────────────
  useEffect(() => {
    async function cargar() {
      const [{ data: itemsData }, { data: checksData }] = await Promise.all([
        supabase.from('checklist_items').select('*').eq('activo', true).order('orden'),
        supabase.from('expediente_checklist').select('*').eq('expediente_id', expedienteId),
      ])
      setItems(itemsData ?? [])
      const map = new Map<number, CheckEntry>()
      for (const c of checksData ?? []) map.set(c.item_id, c)
      setChecks(map)
      setLoading(false)
    }
    cargar()
  }, [expedienteId])

  // ── Auto-sincronización cuando cambian los datos del expediente ──
  const sincronizarAuto = useCallback(async (
    currentItems: ChecklistItem[],
    exp: ChecklistExpedienteData,
    docTipos: string[],
    testigos: boolean,
  ) => {
    if (currentItems.length === 0) return
    setSincronizando(true)

    const autoStates = computeAutoStates(exp, docTipos, testigos)
    const currentChecks = checksRef.current
    const newMap = new Map(currentChecks)
    const upserts: Promise<void>[] = []

    for (const [orden, shouldComplete] of autoStates) {
      const item = currentItems.find(i => i.orden === orden)
      if (!item) continue
      const current = currentChecks.get(item.id)
      if (current?.completado === shouldComplete) continue

      upserts.push(
        Promise.resolve(
          supabase
            .from('expediente_checklist')
            .upsert({
              expediente_id: expedienteId,
              item_id: item.id,
              completado: shouldComplete,
              completado_por: null,
              completado_en: shouldComplete ? new Date().toISOString() : null,
            }, { onConflict: 'expediente_id,item_id' })
            .select()
            .single()
        ).then(({ data }) => {
          if (data) newMap.set(item.id, data as CheckEntry)
        })
      )
    }

    if (upserts.length > 0) {
      await Promise.all(upserts)
      setChecks(newMap)

      const done = Array.from(newMap.values()).filter(c => c.completado).length
      const newPct = currentItems.length > 0 ? Math.round((done / currentItems.length) * 100) : 0
      await supabase.from('expedientes').update({ checklist_pct: newPct }).eq('id', expedienteId)
      onProgresoCambio?.(newPct)
    }

    setSincronizando(false)
  }, [expedienteId, supabase, onProgresoCambio])

  useEffect(() => {
    if (loading || !expediente || items.length === 0) return
    sincronizarAuto(items, expediente, documentosTipos, tieneTestigos)
  // Stringify arrays/objects so the effect only re-fires when values actually change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    items,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(expediente),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(documentosTipos),
    tieneTestigos,
  ])

  // ── Calcular progreso ────────────────────────────────────────
  const total       = items.length
  const completados = Array.from(checks.values()).filter(c => c.completado).length
  const pct         = total > 0 ? Math.round((completados / total) * 100) : 0
  const completo    = completados === total && total > 0

  // ── Toggle manual (todos los items son togglables) ───────────
  const toggle = useCallback(async (itemId: number, orden: number) => {
    if (readOnly || guardando.has(itemId)) return
    setGuardando(s => new Set(s).add(itemId))

    const actual   = checks.get(itemId)
    const nuevoVal = !actual?.completado

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('expediente_checklist')
      .upsert({
        expediente_id: expedienteId,
        item_id:       itemId,
        completado:    nuevoVal,
        completado_por: nuevoVal ? (user?.id ?? null) : null,
        completado_en:  nuevoVal ? new Date().toISOString() : null,
      }, { onConflict: 'expediente_id,item_id' })
      .select()
      .single()

    if (!error && data) {
      const newMap = new Map(checks)
      newMap.set(itemId, data as CheckEntry)
      setChecks(newMap)

      const done   = Array.from(newMap.values()).filter(c => c.completado).length
      const newPct = total > 0 ? Math.round((done / total) * 100) : 0
      await supabase.from('expedientes').update({ checklist_pct: newPct }).eq('id', expedienteId)
      onProgresoCambio?.(newPct)
    }

    setGuardando(s => { const n = new Set(s); n.delete(itemId); return n })
  }, [checks, expedienteId, guardando, readOnly, total, supabase, onProgresoCambio])

  // ── Agrupar por categoría ────────────────────────────────────
  const categorias = Array.from(new Set(items.map(i => i.categoria)))

  if (loading) {
    return (
      <div className="card flex items-center gap-3 text-gray-400 py-6 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando checklist…</span>
      </div>
    )
  }

  return (
    <div className="card">
      {/* ── Header colapsable ── */}
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setAbierto(a => !a)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">Checklist de Revisión Formal</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            completo
              ? 'bg-green-100 text-green-700'
              : pct >= 70
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {completados}/{total}
          </span>
          {sincronizando && (
            <Loader2 className="w-3.5 h-3.5 text-brand-green animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Barra de progreso */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completo ? 'bg-brand-green' : pct >= 70 ? 'bg-orange-400' : 'bg-gray-300'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${
              completo ? 'text-brand-green' : 'text-orange-500'
            }`}>
              {pct}%
            </span>
          </div>
          {abierto
            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          }
        </div>
      </button>

      {/* ── Contenido ── */}
      {abierto && (
        <div className="mt-5 space-y-5">
          {categorias.map(cat => {
            const catItems = items.filter(i => i.categoria === cat)
            const catDone  = catItems.filter(i => checks.get(i.id)?.completado).length

            return (
              <div key={cat}>
                {/* Cabecera de categoría */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</p>
                  <span className="text-xs text-gray-400">{catDone}/{catItems.length}</span>
                </div>

                <div className="space-y-1">
                  {catItems.map(item => {
                    const check    = checks.get(item.id)
                    const checked  = check?.completado ?? false
                    const enGuarda = guardando.has(item.id)
                    const esAuto   = AUTO_ORDENES.has(item.orden)
                    const clickable = !readOnly && !enGuarda

                    return (
                      <div
                        key={item.id}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onClick={() => clickable && toggle(item.id, item.orden)}
                        onKeyDown={e => e.key === 'Enter' && clickable && toggle(item.id, item.orden)}
                        className={[
                          'flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all',
                          checked ? 'bg-green-50/60' : '',
                          clickable ? 'cursor-pointer hover:bg-gray-50' : '',
                          enGuarda ? 'opacity-60' : '',
                          esAuto && !checked ? 'opacity-70' : '',
                        ].join(' ')}
                      >
                        {/* Icono */}
                        <div className="mt-0.5 flex-shrink-0">
                          {enGuarda ? (
                            <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
                          ) : checked ? (
                            <CheckCircle2 className="w-5 h-5 text-brand-green" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm leading-snug ${
                              checked ? 'text-gray-400 line-through' : 'text-gray-700'
                            }`}>
                              <span className="font-medium text-gray-400 mr-1.5 text-xs">{item.orden}.</span>
                              {item.descripcion}
                            </p>
                            {esAuto && (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                checked
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                <Zap className="w-2.5 h-2.5" />
                                auto
                              </span>
                            )}
                          </div>
                          {checked && check?.completado_en && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              ✓{' '}
                              {new Date(check.completado_en).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── Pie: estado del OPE ── */}
          <div className={`pt-3 border-t border-gray-100 flex items-center gap-2 text-xs ${
            completo ? 'text-brand-green' : 'text-orange-600'
          }`}>
            {completo ? (
              <>
                <Unlock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">
                  Checklist completo — Paquete OPE habilitado para descarga
                </span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  El Paquete OPE se habilitará cuando el checklist esté al{' '}
                  <strong>100%</strong> ({total - completados} punto{total - completados !== 1 ? 's' : ''} pendiente{total - completados !== 1 ? 's' : ''})
                </span>
              </>
            )}
          </div>

          {/* Leyenda auto */}
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Los puntos <strong>auto</strong> se actualizan solos cuando los datos del expediente están completos,
            pero también puedes marcarlos o desmarcarlos manualmente.
          </p>
        </div>
      )}
    </div>
  )
}
