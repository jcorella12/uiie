'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  id?: string
  icon?: React.ReactNode
  title: string
  action?: React.ReactNode
  defaultOpen?: boolean
  /** Resumen pequeño que aparece junto al título cuando está cerrada */
  summary?: string
  children: React.ReactNode
}

/**
 * Card-style collapsible section. Mismo aspecto visual que el Section regular
 * pero con toggle. Útil para secciones grandes que el usuario no siempre
 * necesita ver expandidas (Info Técnica, Info Complementaria).
 */
export default function CollapsibleCard({
  id, icon, title, action, defaultOpen = false, summary, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className="card scroll-mt-6 p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {icon && <span className="text-brand-green flex-shrink-0">{icon}</span>}
        <h2 className="text-base font-semibold text-gray-800 flex-1">{title}</h2>
        {summary && !open && (
          <span className="hidden sm:inline text-xs text-gray-400 truncate max-w-[280px]">
            {summary}
          </span>
        )}
        {action && (
          <span onClick={e => e.stopPropagation()} className="flex-shrink-0">
            {action}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
            open ? '' : '-rotate-90'
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}
