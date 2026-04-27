import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'red' | 'amber'
  trend?: { value: number; label: string }
}

const COLOR_MAP = {
  green:  'bg-brand-green-light text-brand-green border-brand-green/20',
  orange: 'bg-brand-orange-light text-brand-orange border-brand-orange/20',
  blue:   'bg-blue-50 text-blue-600 border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  red:    'bg-red-50 text-red-700 border-red-100',
  amber:  'bg-amber-50 text-amber-700 border-amber-100',
}

const ICON_BG = {
  green:  'bg-brand-green',
  orange: 'bg-brand-orange',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  red:    'bg-red-500',
  amber:  'bg-amber-500',
}

export default function KPICard({
  title, value, subtitle, icon: Icon, color = 'green', trend,
}: KPICardProps) {
  return (
    <div className={cn('rounded-xl border p-6 flex items-start gap-4', COLOR_MAP[color])}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', ICON_BG[color])}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium opacity-80 truncate">{title}</p>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-green-700' : 'text-red-600')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
