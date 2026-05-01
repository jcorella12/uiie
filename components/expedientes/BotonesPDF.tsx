'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Loader2,
  Package,
  ClipboardList,
  FileCheck2,
  ScrollText,
  ReceiptText,
  Lock,
  AlertTriangle,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExpedienteValidacion {
  // Cliente
  cliente_nombre?: string | null
  firmante_nombre?: string | null
  firmante_curp?: string | null
  atiende_nombre?: string | null
  // Proyecto
  kwp?: number | null
  num_paneles?: number | null
  potencia_panel_wp?: number | null
  marca_inversor?: string | null
  num_inversores?: number | null
  numero_medidor?: string | null
  precio?: number | null
  tipo_conexion?: string | null
  tipo_central?: string | null
  // Dirección
  direccion_proyecto?: string | null
  ciudad?: string | null
  estado_mx?: string | null
  // Resolutivo
  resolutivo_folio?: string | null
  resolutivo_fecha?: string | null
  // Dictamen
  dictamen_folio_dvnp?: string | null
  // Protecciones (TODAS deben estar verdaderas)
  tiene_i1_i2?: boolean | null
  tiene_interruptor_exclusivo?: boolean | null
  tiene_ccfp?: boolean | null
  tiene_proteccion_respaldo?: boolean | null
  // Documentos subidos (tipos)
  documentosTipos?: string[]
  // Testigos asignados al expediente
  tieneTestigos?: boolean
  // Inspección programada
  tieneInspeccion?: boolean
}

interface Props {
  expedienteId: string
  folio: string
  status: string
  checklistPct?: number
  isAuxiliar?: boolean
  /** Datos del expediente para validar antes de descargar */
  validacion?: ExpedienteValidacion
}

type EndpointKey =
  | 'cotizacion'
  | 'contrato'
  | 'plan'
  | 'acta'
  | 'lista'
  | 'paquete-ope'

interface BotonesConfig {
  key: EndpointKey
  label: string
  filename: (folio: string) => string
  icon: React.ElementType
  visible?: (status: string) => boolean
  variant?: 'default' | 'brand' | 'orange'
  /** Devuelve array de campos faltantes; vacío = OK */
  validate?: (v: ExpedienteValidacion | undefined, status: string) => string[]
}

// ─── Reglas de validación por documento ─────────────────────────────────────

const REQ = (v: any) => v != null && v !== '' && v !== 0
const REQ_STR = (v: any) => typeof v === 'string' && v.trim().length > 0

function validarCotizacion(v: ExpedienteValidacion | undefined): string[] {
  if (!v) return []
  const m: string[] = []
  if (!REQ_STR(v.cliente_nombre))    m.push('Nombre del cliente')
  if (!REQ(v.kwp))                   m.push('Potencia (kWp)')
  if (!REQ(v.precio))                m.push('Precio propuesto')
  if (!REQ_STR(v.ciudad))            m.push('Ciudad')
  return m
}

function validarContrato(v: ExpedienteValidacion | undefined): string[] {
  if (!v) return []
  const m: string[] = []
  if (!REQ_STR(v.cliente_nombre))    m.push('Nombre del cliente')
  if (!REQ_STR(v.firmante_nombre))   m.push('Firmante del contrato')
  if (!REQ(v.kwp))                   m.push('Potencia (kWp)')
  if (!REQ_STR(v.direccion_proyecto)) m.push('Dirección del proyecto')
  if (!REQ_STR(v.ciudad))            m.push('Ciudad')
  return m
}

function validarPlan(v: ExpedienteValidacion | undefined): string[] {
  if (!v) return []
  const m: string[] = []
  if (!REQ_STR(v.cliente_nombre))    m.push('Nombre del cliente')
  if (!REQ(v.kwp))                   m.push('Potencia (kWp)')
  if (!REQ_STR(v.direccion_proyecto)) m.push('Dirección del proyecto')
  return m
}

function validarActa(v: ExpedienteValidacion | undefined): string[] {
  if (!v) return []
  const m: string[] = []
  // Identidad del cliente y firmante
  if (!REQ_STR(v.cliente_nombre))    m.push('Nombre del cliente')
  if (!REQ_STR(v.firmante_nombre))   m.push('Firmante del acta')
  if (!REQ_STR(v.atiende_nombre))    m.push('Persona que atiende la visita')
  // Inspección
  if (!v.tieneInspeccion)            m.push('Inspección programada')
  if (!v.tieneTestigos)              m.push('Al menos un testigo asignado')
  // Datos del sistema
  if (!REQ(v.kwp))                   m.push('Potencia (kWp)')
  if (!REQ(v.num_paneles))           m.push('Número de paneles')
  if (!REQ(v.potencia_panel_wp))     m.push('Potencia por panel (Wp)')
  if (!REQ_STR(v.marca_inversor))    m.push('Marca/modelo del inversor')
  if (!REQ_STR(v.numero_medidor))    m.push('Número de medidor CFE')
  // Dirección
  if (!REQ_STR(v.direccion_proyecto)) m.push('Dirección del proyecto')
  if (!REQ_STR(v.ciudad))            m.push('Ciudad')
  // Resolutivo y Dictamen
  if (!REQ_STR(v.resolutivo_folio))  m.push('Folio del resolutivo CFE')
  if (!REQ_STR(v.dictamen_folio_dvnp)) m.push('Folio del dictamen UVIE (DVNP)')
  // Protecciones — TODAS deben cumplirse
  if (!v.tiene_i1_i2)                m.push('Protección: Interruptores I1/I2')
  if (!v.tiene_interruptor_exclusivo) m.push('Protección: Interruptor exclusivo de interconexión')
  if (!v.tiene_ccfp)                 m.push('Protección: CCFP / Centro de carga dedicado')
  if (!v.tiene_proteccion_respaldo)  m.push('Protección: Respaldo contra isla')
  return m
}

function validarListaDACG(v: ExpedienteValidacion | undefined): string[] {
  if (!v) return []
  const m: string[] = []
  if (!REQ(v.kwp))                   m.push('Potencia (kWp)')
  if (!REQ(v.num_paneles))           m.push('Número de paneles')
  if (!REQ(v.potencia_panel_wp))     m.push('Potencia por panel (Wp)')
  if (!REQ_STR(v.marca_inversor))    m.push('Marca/modelo del inversor')
  if (!REQ_STR(v.numero_medidor))    m.push('Número de medidor CFE')
  // Protecciones también requeridas para la Lista DACG
  if (!v.tiene_i1_i2)                m.push('Protección: Interruptores I1/I2')
  if (!v.tiene_interruptor_exclusivo) m.push('Protección: Interruptor exclusivo')
  if (!v.tiene_ccfp)                 m.push('Protección: CCFP')
  if (!v.tiene_proteccion_respaldo)  m.push('Protección: Respaldo contra isla')
  return m
}

const BOTONES: BotonesConfig[] = [
  { key: 'cotizacion', label: 'Cotización',         filename: (f) => `Cotizacion-${f}.docx`,    icon: ReceiptText,  validate: validarCotizacion },
  { key: 'contrato',   label: 'Contrato',           filename: (f) => `Contrato-${f}.docx`,      icon: ScrollText,   validate: validarContrato },
  { key: 'plan',       label: 'Plan de Inspección', filename: (f) => `Plan-${f}.docx`,          icon: ClipboardList, validate: validarPlan },
  { key: 'acta',       label: 'Acta FO-12',         filename: (f) => `Acta-${f}.docx`,          icon: FileCheck2,   visible: (s) => s !== 'borrador', validate: validarActa },
  { key: 'lista',      label: 'Lista DACG',         filename: (f) => `Lista-DACG-${f}.docx`,    icon: FileText,     visible: (s) => s !== 'borrador', validate: validarListaDACG },
  { key: 'paquete-ope',label: 'Paquete OPE',        filename: (f) => `${f}-${new Date().getFullYear()}.pdf`, icon: Package, visible: (s) => s === 'revision' || s === 'aprobado', variant: 'orange' },
]

// ─── Estilos por variante ────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<NonNullable<BotonesConfig['variant']>, string> = {
  default:
    'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
  brand:
    'bg-[#0F6E56] text-white border border-[#0F6E56] hover:bg-[#0a5a45]',
  orange:
    'bg-[#EF9F27] text-white border border-[#EF9F27] hover:bg-[#d98a18] col-span-full',
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function BotonesPDF({
  expedienteId, folio, status, checklistPct = 0, isAuxiliar = false, validacion,
}: Props) {
  const [loading, setLoading] = useState<EndpointKey | null>(null)
  const [errores, setErrores] = useState<Partial<Record<EndpointKey, string>>>({})
  const [forzar,  setForzar]  = useState<Partial<Record<EndpointKey, boolean>>>({})
  const opeHabilitado = checklistPct >= 100

  async function descargarPDF(key: EndpointKey, filename: string) {
    setLoading(key)
    setErrores((prev) => ({ ...prev, [key]: undefined }))

    try {
      const res = await fetch(`/api/pdf/${key}?expediente_id=${expedienteId}`)

      if (!res.ok) {
        let mensaje = 'Error generando el documento'
        let faltantes: string[] = []
        try {
          const body = await res.json()
          mensaje = body.error ?? mensaje
          faltantes = body.faltantes ?? []
        } catch {
          // no JSON
        }
        if (faltantes.length > 0) {
          throw new Error(`Faltan documentos:\n• ${faltantes.join('\n• ')}`)
        }
        throw new Error(mensaje)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setErrores((prev) => ({ ...prev, [key]: err?.message ?? 'Error desconocido' }))
    } finally {
      setLoading(null)
    }
  }

  const botonesVisibles = BOTONES.filter(
    (b) => (!b.visible || b.visible(status)) && !(isAuxiliar && b.key === 'cotizacion'),
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Download size={16} className="text-[#0F6E56]" />
        <h3 className="text-sm font-semibold text-gray-800">Documentos del expediente</h3>
        <span className="ml-auto text-xs text-gray-400 font-mono">{folio}</span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {botonesVisibles.map((b) => {
          const isLoading = loading === b.key
          const error = errores[b.key]
          const variant = b.variant ?? 'default'
          const Icono = b.icon
          const faltantes = b.validate ? b.validate(validacion, status) : []
          const tieneFaltantes = faltantes.length > 0
          const yaForzado = !!forzar[b.key]

          // Paquete OPE bloqueado por checklist incompleto (regla especial)
          if (b.key === 'paquete-ope' && !opeHabilitado) {
            return (
              <div key={b.key} className="col-span-full">
                <div className="w-full flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 cursor-not-allowed">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock size={15} />
                    <span className="text-sm font-semibold">Paquete OPE</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center leading-tight">
                    Completa el checklist de revisión ({checklistPct}% — falta {100 - checklistPct}%)
                  </p>
                </div>
              </div>
            )
          }

          // Documento bloqueado por campos faltantes
          const bloqueado = tieneFaltantes && !yaForzado

          return (
            <div key={b.key} className={b.key === 'paquete-ope' ? 'col-span-full' : ''}>
              {bloqueado ? (
                <div className="w-full rounded-lg bg-amber-50 border-2 border-dashed border-amber-300 px-3 py-2.5 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">{b.label}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Falta {faltantes.length} {faltantes.length === 1 ? 'campo' : 'campos'}:
                  </p>
                  <ul className="text-[11px] text-amber-800 space-y-0.5 leading-tight pl-4">
                    {faltantes.slice(0, 4).map((f, i) => (
                      <li key={i} className="list-disc">{f}</li>
                    ))}
                    {faltantes.length > 4 && (
                      <li className="list-disc text-amber-600">y {faltantes.length - 4} más…</li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setForzar(prev => ({ ...prev, [b.key]: true }))}
                    className="mt-2 text-[10px] text-amber-700 hover:text-amber-900 underline font-medium"
                  >
                    Generar de todos modos
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => descargarPDF(b.key, b.filename(folio))}
                  disabled={isLoading || loading !== null}
                  className={[
                    'w-full flex items-center justify-center gap-2',
                    'px-4 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-150',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    VARIANT_CLASSES[variant],
                    b.key === 'paquete-ope' ? 'py-3 text-base font-semibold tracking-wide' : '',
                    yaForzado ? 'ring-2 ring-amber-300' : '',
                  ].filter(Boolean).join(' ')}
                  title={yaForzado ? `⚠️ Faltaban ${faltantes.length} campos — generando de todos modos` : undefined}
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Icono size={15} />
                  )}
                  <span>{isLoading ? 'Generando…' : b.label}</span>
                  {yaForzado && <AlertTriangle size={13} className="text-amber-500" />}
                </button>
              )}

              {/* Error inline */}
              {error ? (
                <div className="mt-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  {error.split('\n').map((line, i) => (
                    <p key={i} className="text-xs text-red-600 leading-tight">{line}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          {validacion
            ? 'Si falta información, el botón se desbloquea cuando completes los campos requeridos'
            : 'Los documentos se generan en tiempo real'}
        </p>
      </div>
    </div>
  )
}
