'use client'

import { useState } from 'react'
import { ChevronDown, LucideIcon } from 'lucide-react'

interface Props {
  title: string
  icon?: LucideIcon
  /** Si está abierta por defecto (default true para la primera) */
  defaultOpen?: boolean
  /** Indicador de "completitud" — un check verde si true */
  complete?: boolean
  /** Subtítulo o resumen pequeño junto al título */
  summary?: string
  children: React.ReactNode
}

export default function CollapsibleSection({
  title, icon: Icon, defaultOpen = true, complete, summary, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            complete ? 'bg-emerald-100' : 'bg-gray-100'
          }`}>
            <Icon className={`w-4 h-4 ${complete ? 'text-emerald-600' : 'text-gray-500'}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            {title}
            {complete && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                ✓ Completo
              </span>
            )}
          </p>
          {summary && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}
