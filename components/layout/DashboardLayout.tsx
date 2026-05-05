'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FeedbackFAB from '@/components/feedback/FeedbackFAB'
import { Info, Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  rol: UserRole
  nombre: string
}

function VersionBadge() {
  const [show, setShow] = useState(false)

  const sha   = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  const short = sha ? sha.slice(0, 7) : null
  const raw   = process.env.NEXT_PUBLIC_BUILD_TIME
  const built = raw
    ? new Date(raw).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow-md border border-gray-200 text-gray-400 hover:text-[#0A5C47] hover:bg-white hover:border-[#0A5C47]/30 transition-all"
        aria-label="Información de versión"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[170px] bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-[11px] leading-relaxed pointer-events-none">
          <p className="font-semibold text-white/90 mb-1">Versión actual</p>
          {short
            ? <p className="font-mono text-white/70">SHA: {short}</p>
            : <p className="italic text-white/45">Local / dev</p>
          }
          {built && <p className="text-white/55 mt-0.5">Compilado: {built}</p>}
          <span className="absolute top-full left-3.5 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout({ children, rol, nombre }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── Backdrop móvil ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        rol={rol}
        nombre={nombre}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Barra superior solo en móvil — abre el sidebar ── */}
        <header className="md:hidden sticky top-0 z-20 bg-sidebar-bg px-4 py-3 flex items-center gap-3 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white transition-colors p-0.5"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center p-0.5">
              <img src="/logo-ciae-icon.png" alt="CIAE" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide">CIAE</span>
            <span className="text-white/40 text-[10px] tracking-wider">UIIE-CRE-021</span>
          </div>
        </header>

        {/* ── Topbar global con breadcrumbs + título contextual + slot de acciones ── */}
        <Topbar />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <VersionBadge />
      <FeedbackFAB />
    </div>
  )
}
