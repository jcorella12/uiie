/**
 * Componente unificado para mostrar el estado de cualquier entidad.
 * Garantiza colores consistentes y contraste WCAG AA en toda la app.
 */
import {
  CheckCircle2, XCircle, Clock, ClipboardCheck, RotateCcw, Award,
  FileText, AlertTriangle, Calendar, User,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tone = 'green' | 'red' | 'amber' | 'orange' | 'blue' | 'purple' | 'gray'
type Size = 'xs' | 'sm' | 'md'

export interface StatusDefinition {
  label: string
  tone:  Tone
  icon?: React.ElementType
}

// ─── Diccionarios canónicos ───────────────────────────────────────────────────

export const EXPEDIENTE_STATUS: Record<string, StatusDefinition> = {
  borrador:    { label: 'Borrador',    tone: 'gray',   icon: FileText },
  en_proceso:  { label: 'En proceso',  tone: 'blue',   icon: Clock },
  revision:    { label: 'En revisión', tone: 'purple', icon: ClipboardCheck },
  aprobado:    { label: 'Aprobado',    tone: 'green',  icon: CheckCircle2 },
  // ⚠️ devuelto = corregible (ámbar) — distinto a rechazado (rojo final)
  devuelto:    { label: 'Devuelto',    tone: 'amber',  icon: RotateCcw },
  rechazado:   { label: 'Rechazado',   tone: 'red',    icon: XCircle },
  cerrado:     { label: 'Cerrado',     tone: 'green',  icon: Award },
}

export const SOLICITUD_STATUS: Record<string, StatusDefinition> = {
  pendiente:        { label: 'Pendiente',         tone: 'gray',   icon: Clock },
  en_revision:      { label: 'En revisión',       tone: 'purple', icon: ClipboardCheck },
  aprobada:         { label: 'Aprobada',          tone: 'green',  icon: CheckCircle2 },
  rechazada:        { label: 'Rechazada',         tone: 'red',    icon: XCircle },
  folio_asignado:   { label: 'Folio asignado',    tone: 'green',  icon: Award },
}

export const INSPECCION_STATUS: Record<string, StatusDefinition> = {
  programada: { label: 'Programada', tone: 'blue',  icon: Calendar },
  en_curso:   { label: 'En curso',   tone: 'amber', icon: Clock },
  realizada:  { label: 'Realizada',  tone: 'green', icon: CheckCircle2 },
  cancelada:  { label: 'Cancelada',  tone: 'red',   icon: XCircle },
}

export const DICTAMEN_RESULTADO: Record<string, StatusDefinition> = {
  aprobado:    { label: 'Aprobado',    tone: 'green', icon: CheckCircle2 },
  condicionado: { label: 'Condicionado', tone: 'amber', icon: AlertTriangle },
  rechazado:   { label: 'Rechazado',   tone: 'red',   icon: XCircle },
}

// ─── Estilos por tono (WCAG AA) ──────────────────────────────────────────────

const TONE_STYLES: Record<Tone, string> = {
  green:  'bg-green-100 text-green-800 border-green-200',
  red:    'bg-red-100 text-red-800 border-red-200',
  amber:  'bg-amber-100 text-amber-800 border-amber-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  blue:   'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  gray:   'bg-gray-100 text-gray-700 border-gray-200',
}

const SIZE_STYLES: Record<Size, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
}

const ICON_SIZE: Record<Size, string> = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
}

// ─── Componente principal ────────────────────────────────────────────────────

interface StatusBadgeProps {
  /** Valor del status (ej: 'aprobado', 'devuelto') */
  status: string | null | undefined
  /** Diccionario a usar (default: EXPEDIENTE_STATUS) */
  dictionary?: Record<string, StatusDefinition>
  /** Tamaño visual */
  size?: Size
  /** Mostrar ícono */
  showIcon?: boolean
  /** Override del label */
  label?: string
  /** Si quieres pasar tu propio status definition */
  custom?: StatusDefinition
}

export function StatusBadge({
  status,
  dictionary = EXPEDIENTE_STATUS,
  size = 'sm',
  showIcon = true,
  label,
  custom,
}: StatusBadgeProps) {
  const def = custom ?? (status ? dictionary[status] : undefined) ?? {
    label: status ?? '—',
    tone:  'gray' as Tone,
  }
  const Icon = def.icon

  return (
    <span className={[
      'inline-flex items-center font-medium rounded-full border whitespace-nowrap',
      TONE_STYLES[def.tone],
      SIZE_STYLES[size],
    ].join(' ')}>
      {showIcon && Icon && <Icon className={ICON_SIZE[size]} />}
      {label ?? def.label}
    </span>
  )
}
