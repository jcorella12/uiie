import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /** CTA principal */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Variante visual */
  variant?: 'default' | 'compact'
  /** Icono adicional para el botón */
  actionIcon?: LucideIcon
}

export default function EmptyState({
  icon: Icon, title, description, action, variant = 'default', actionIcon: ActionIcon,
}: EmptyStateProps) {
  const isCompact = variant === 'compact'

  return (
    <div className={isCompact ? 'text-center py-8' : 'text-center py-12'}>
      <div className={`mx-auto ${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gray-100 flex items-center justify-center mb-3`}>
        <Icon className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
      </div>
      <p className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-gray-700 mb-1`}>
        {title}
      </p>
      {description && (
        <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-400 mb-4 max-w-sm mx-auto`}>
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shadow-sm"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shadow-sm"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
