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
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  expedienteId: string
  folio: string
  status: string
  checklistPct?: number   // 0–100; OPE bloqueado si < 100
  isAuxiliar?: boolean    // oculta documentos financieros (cotización)
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
  /** Si devuelve false, el botón no se renderiza */
  visible?: (status: string) => boolean
  /** Estilo especial */
  variant?: 'default' | 'brand' | 'orange'
}

const BOTONES: BotonesConfig[] = [
  {
    key: 'cotizacion',
    label: 'Cotización',
    filename: (f) => `Cotizacion-${f}.pdf`,
    icon: ReceiptText,
  },
  {
    key: 'contrato',
    label: 'Contrato',
    filename: (f) => `Contrato-${f}.pdf`,
    icon: ScrollText,
  },
  {
    key: 'plan',
    label: 'Plan de Inspección',
    filename: (f) => `Plan-${f}.pdf`,
    icon: ClipboardList,
  },
  {
    key: 'acta',
    label: 'Acta FO-12',
    filename: (f) => `Acta-${f}.pdf`,
    icon: FileCheck2,
    visible: (status) => status !== 'borrador',
  },
  {
    key: 'lista',
    label: 'Lista DACG',
    filename: (f) => `Lista-DACG-${f}.pdf`,
    icon: FileText,
    visible: (status) => status !== 'borrador',
  },
  {
    key: 'paquete-ope',
    label: 'Paquete OPE',
    filename: (f) => `${f}-${new Date().getFullYear()}.pdf`,
    icon: Package,
    visible: (status) => status === 'revision' || status === 'aprobado',
    variant: 'orange',
  },
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

export function BotonesPDF({ expedienteId, folio, status, checklistPct = 0, isAuxiliar = false }: Props) {
  const [loading, setLoading] = useState<EndpointKey | null>(null)
  const [errores, setErrores] = useState<Partial<Record<EndpointKey, string>>>({})
  const opeHabilitado = checklistPct >= 100

  async function descargarPDF(key: EndpointKey, filename: string) {
    setLoading(key)
    setErrores((prev) => ({ ...prev, [key]: undefined }))

    try {
      const res = await fetch(`/api/pdf/${key}?expediente_id=${expedienteId}`)

      if (!res.ok) {
        let mensaje = 'Error generando el PDF'
        let faltantes: string[] = []
        try {
          const body = await res.json()
          mensaje = body.error ?? mensaje
          faltantes = body.faltantes ?? []
        } catch {
          // no JSON
        }
        // Para el paquete OPE, mostrar lista de faltantes detallada
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
      setErrores((prev) => ({
        ...prev,
        [key]: err?.message ?? 'Error desconocido',
      }))
    } finally {
      setLoading(null)
    }
  }

  const botonesVisibles = BOTONES.filter(
    (b) => (!b.visible || b.visible(status)) && !(isAuxiliar && b.key === 'cotizacion'),
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Download size={16} className="text-[#0F6E56]" />
        <h3 className="text-sm font-semibold text-gray-800">
          Documentos del expediente
        </h3>
        <span className="ml-auto text-xs text-gray-400 font-mono">{folio}</span>
      </div>

      {/* Grid de botones */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {botonesVisibles.map((b) => {
          const isLoading = loading === b.key
          const error = errores[b.key]
          const variant = b.variant ?? 'default'
          const Icono = b.icon

          return (
            <div
              key={b.key}
              className={
                b.key === 'paquete-ope' ? 'col-span-full' : ''
              }
            >
              {b.key === 'paquete-ope' && !opeHabilitado ? (
                /* OPE bloqueado: checklist incompleto */
                <div className="w-full flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 cursor-not-allowed">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock size={15} />
                    <span className="text-sm font-semibold">Paquete OPE</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center leading-tight">
                    Completa el checklist de revisión ({checklistPct}% — falta {100 - checklistPct}%)
                  </p>
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
                    b.key === 'paquete-ope'
                      ? 'py-3 text-base font-semibold tracking-wide'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Icono size={15} />
                  )}
                  <span>{isLoading ? 'Generando…' : b.label}</span>
                </button>
              )}

              {/* Error inline debajo del botón */}
              {error ? (
                <div className="mt-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  {error.split('\n').map((line, i) => (
                    <p key={i} className="text-xs text-red-600 leading-tight">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Nota de pie */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Los PDFs se generan en tiempo real con datos actualizados.
        </p>
      </div>
    </div>
  )
}
