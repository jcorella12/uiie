import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

type Color = 'green' | 'orange' | 'blue' | 'purple' | 'red' | 'amber'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: Color
  trend?: { value: number; label: string }
  /** Pill estilo "+9 este mes" / "−3 este mes" en la parte inferior. */
  delta?: { value: number; label: string; format?: 'absolute' | 'percent' }
  /** Si se pasa, la card se vuelve un link clickable a esa ruta */
  href?: string
  /**
   * Estilo visual:
   * - "tinted"  → card con fondo coloreado (legacy, default)
   * - "neutral" → card blanca con dot accent (nuevo handoff CIAE)
   */
  variant?: 'tinted' | 'neutral'
}

// ── Estilos para la variante "tinted" (legacy) ──────────────────────────────
const COLOR_MAP_TINTED: Record<Color, string> = {
  green:  'bg-brand-green-light text-brand-green border-brand-green/20',
  orange: 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
  blue:   'bg-blue-50 text-blue-600 border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  red:    'bg-red-50 text-red-700 border-red-100',
  amber:  'bg-amber-50 text-amber-700 border-amber-100',
}

const ICON_BG_TINTED: Record<Color, string> = {
  green:  'bg-brand-green',
  orange: 'bg-brand-orange',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  red:    'bg-red-500',
  amber:  'bg-amber-500',
}

// ── Color del "dot accent" para la variante "neutral" ───────────────────────
const DOT_BG: Record<Color, string> = {
  green:  'bg-brand-green',
  orange: 'bg-brand-orange',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  red:    'bg-red-500',
  amber:  'bg-amber-500',
}

const ICON_TINT_NEUTRAL: Record<Color, string> = {
  green:  'text-brand-green bg-brand-green-light',
  orange: 'text-brand-orange bg-brand-orange-light',
  blue:   'text-blue-600 bg-blue-50',
  purple: 'text-purple-600 bg-purple-50',
  red:    'text-red-700 bg-red-50',
  amber:  'text-amber-700 bg-amber-50',
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function KPICard({
  title, value, subtitle, icon: Icon, color = 'green', trend, delta, href, variant = 'tinted',
}: KPICardProps) {

  if (variant === 'neutral') return <KPINeutral {...{ title, value, subtitle, Icon, color, trend, delta, href }} />

  // ─── Tinted (legacy) ──────────────────────────────────────────────────────
  const content = (
    <>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', ICON_BG_TINTED[color])}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium opacity-80 truncate">{title}</p>
          {href && (
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0" />
          )}
        </div>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-green-700' : 'text-red-600')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </>
  )

  const baseCls = cn(
    'rounded-xl border p-6 flex items-start gap-4 transition-all',
    COLOR_MAP_TINTED[color],
  )

  if (href) {
    return (
      <Link href={href} className={cn(baseCls, 'group hover:shadow-md hover:scale-[1.02] cursor-pointer')}>
        {content}
      </Link>
    )
  }
  return <div className={baseCls}>{content}</div>
}

// ─── Variante "neutral" — handoff CIAE ──────────────────────────────────────
function KPINeutral({
  title, value, subtitle, Icon, color, trend, delta, href,
}: {
  title: string
  value: string | number
  subtitle?: string
  Icon: LucideIcon
  color: Color
  trend?: { value: number; label: string }
  delta?: { value: number; label: string; format?: 'absolute' | 'percent' }
  href?: string
}) {
  const baseCls = 'rounded-[14px] border border-border bg-white p-[18px] flex flex-col gap-2.5 transition-all'

  // Pill de delta — verde si positivo, rojo si negativo, gris si 0
  let deltaPill: React.ReactNode = null
  if (delta) {
    const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : ''
    const num = Math.abs(delta.value)
    const fmt = delta.format === 'percent' ? `${num}%` : num.toString()
    const cls =
      delta.value > 0 ? 'kpi-delta-pill kpi-delta-up'   :
      delta.value < 0 ? 'kpi-delta-pill kpi-delta-down' :
                        'kpi-delta-pill kpi-delta-flat'
    deltaPill = <span className={cls}>{sign}{fmt} {delta.label}</span>
  }

  const content = (
    <>
      {/* Header: dot + label + ícono */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_BG[color])} />
          <p className="text-[11.5px] font-medium uppercase tracking-wider text-muted truncate">
            {title}
          </p>
        </div>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', ICON_TINT_NEUTRAL[color])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Valor */}
      <p
        className="text-[30px] font-bold text-ink leading-none"
        style={{ letterSpacing: '-0.6px' }}
      >
        {value}
      </p>

      {/* Subtítulo + delta */}
      <div className="flex items-end justify-between gap-2 flex-wrap">
        {subtitle && <p className="text-[11.5px] text-muted">{subtitle}</p>}
        {deltaPill}
        {/* Soporte legacy: si llega `trend` en vez de `delta` */}
        {!delta && trend && (
          <span className={cn(
            'kpi-delta-pill',
            trend.value > 0 ? 'kpi-delta-up' : trend.value < 0 ? 'kpi-delta-down' : 'kpi-delta-flat',
          )}>
            {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : ''} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn(baseCls, 'group hover:shadow-md hover:border-brand-green/40 cursor-pointer')}>
        {content}
      </Link>
    )
  }
  return <div className={baseCls}>{content}</div>
}
