'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Permite a una página inyectar botones/acciones en el slot derecho del Topbar
 * sin necesidad de prop drilling. Solo úsalo en client components.
 *
 * Ejemplo:
 *   import TopbarActions from '@/components/layout/TopbarActions'
 *   ...
 *   <TopbarActions>
 *     <Link href="..." className="btn-primary">Nueva solicitud</Link>
 *   </TopbarActions>
 */
export default function TopbarActions({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [target, setTarget]   = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    setTarget(document.getElementById('topbar-actions'))
  }, [])

  if (!mounted || !target) return null
  return createPortal(children, target)
}
