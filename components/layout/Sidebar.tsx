'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn, ROLE_LABELS } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard, FileText, FolderOpen, Calendar,
  Users, Settings, LogOut, ChevronDown,
  ClipboardList, BarChart3, UserCog, Building2, BookUser,
  Cpu, Globe, FileSpreadsheet, Receipt, UsersRound, Award, X, Brain,
  HelpCircle, Search, Home, CheckSquare,
} from 'lucide-react'
import NotificationBell from './NotificationBell'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  /** Pequeño badge a la derecha (ej: "5", "2 hoy"). Por ahora estático en estructura;
      en el futuro la página puede pasar contadores. */
  badge?: string | number
}

interface NavGroup {
  id: string
  label?: string          // section header; omit for top-level items
  collapsible?: boolean   // can be toggled open/closed
  defaultOpen?: boolean   // initial state when collapsible
  items: NavItem[]
}

// ─── Nav structure por rol — agrupado por FLUJO de trabajo ───────────────────

const NAV: Record<UserRole, NavGroup[]> = {
  // ───────────────────────────────────────────── INSPECTOR_RESPONSABLE
  inspector_responsable: [
    {
      id: 'mi-trabajo',
      label: 'Mi trabajo diario',
      items: [
        { href: '/dashboard',                       label: 'Inicio',         icon: Home },
        { href: '/dashboard/admin',                 label: 'Panel Admin',    icon: LayoutDashboard },
        { href: '/dashboard/inspector/agenda',      label: 'Agenda',         icon: Calendar },
      ],
    },
    {
      id: 'flujo-inspeccion',
      label: 'Flujo de inspección',
      items: [
        { href: '/dashboard/admin/solicitudes',     label: 'Solicitudes',    icon: ClipboardList },
        { href: '/dashboard/admin/folios',          label: 'Folios CRE',     icon: FileText },
        { href: '/dashboard/inspector/expedientes', label: 'Expedientes',    icon: FolderOpen },
        { href: '/dashboard/inspector/certificados',label: 'Certificados',   icon: Award },
      ],
    },
    {
      id: 'directorio',
      label: 'Directorio',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes', label: 'Clientes',     icon: Building2 },
        { href: '/dashboard/admin/testigos',     label: 'Participantes',icon: BookUser },
        { href: '/dashboard/admin/inversores',   label: 'Inversores',   icon: Cpu },
        { href: '/dashboard/admin/usuarios',     label: 'Usuarios',     icon: Users },
        { href: '/dashboard/inspectores',        label: 'Equipo',       icon: UserCog },
        { href: '/dashboard/admin/cne',          label: 'Bóveda CNE',   icon: Globe },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/conciliacion',       label: 'Conciliación',     icon: BarChart3 },
        { href: '/dashboard/conciliacion/pagos', label: 'Pagos',            icon: Receipt },
        { href: '/dashboard/reporte-trimestral', label: 'Reportes',         icon: FileSpreadsheet },
        { href: '/dashboard/ai-costos',          label: 'Gastos en IA',     icon: Brain },
      ],
    },
  ],

  // ───────────────────────────────────────────── ADMIN
  admin: [
    {
      id: 'mi-trabajo',
      label: 'Mi trabajo diario',
      items: [
        { href: '/dashboard/admin',               label: 'Panel Admin', icon: LayoutDashboard },
        { href: '/dashboard/admin/agenda',        label: 'Agenda',      icon: Calendar },
      ],
    },
    {
      id: 'flujo-inspeccion',
      label: 'Flujo de inspección',
      items: [
        { href: '/dashboard/admin/solicitudes',     label: 'Solicitudes',  icon: ClipboardList },
        { href: '/dashboard/admin/folios',          label: 'Folios CRE',   icon: FileText },
        { href: '/dashboard/inspector/expedientes', label: 'Expedientes',  icon: FolderOpen },
        { href: '/dashboard/inspector/certificados',label: 'Certificados', icon: Award },
      ],
    },
    {
      id: 'directorio',
      label: 'Directorio',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes', label: 'Clientes',      icon: Building2 },
        { href: '/dashboard/admin/testigos',     label: 'Participantes', icon: BookUser },
        { href: '/dashboard/admin/inversores',   label: 'Inversores',    icon: Cpu },
        { href: '/dashboard/admin/usuarios',     label: 'Usuarios',      icon: Users },
        { href: '/dashboard/admin/cne',          label: 'Bóveda CNE',    icon: Globe },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/conciliacion',       label: 'Conciliación', icon: BarChart3 },
        { href: '/dashboard/conciliacion/pagos', label: 'Pagos',        icon: Receipt },
        { href: '/dashboard/reporte-trimestral', label: 'Reportes',     icon: FileSpreadsheet },
        { href: '/dashboard/ai-costos',          label: 'Gastos en IA', icon: Brain },
      ],
    },
  ],

  // ───────────────────────────────────────────── INSPECTOR
  inspector: [
    {
      id: 'mi-trabajo',
      label: 'Mi trabajo diario',
      items: [
        { href: '/dashboard/inspector',             label: 'Inicio',          icon: Home },
        { href: '/dashboard/inspector/expedientes', label: 'Mis Expedientes', icon: FolderOpen },
        { href: '/dashboard/inspector/agenda',      label: 'Mi Agenda',       icon: Calendar },
      ],
    },
    {
      id: 'flujo-inspeccion',
      label: 'Flujo de inspección',
      items: [
        { href: '/dashboard/inspector/solicitudes',  label: 'Solicitudes',  icon: ClipboardList },
        { href: '/dashboard/inspector/certificados', label: 'Certificados', icon: Award },
      ],
    },
    {
      id: 'directorio',
      label: 'Directorio',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes',  label: 'Clientes',      icon: Building2 },
        { href: '/dashboard/admin/testigos',      label: 'Participantes', icon: BookUser },
        { href: '/dashboard/inspector/inversores',label: 'Inversores',    icon: Cpu },
        { href: '/dashboard/inspector/equipo',    label: 'Mi Equipo',     icon: UsersRound },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/conciliacion', label: 'Conciliación', icon: Receipt },
      ],
    },
  ],

  // ───────────────────────────────────────────── AUXILIAR
  auxiliar: [
    {
      id: 'mi-trabajo',
      label: 'Mi trabajo diario',
      items: [
        { href: '/dashboard/inspector',             label: 'Inicio',     icon: Home },
        { href: '/dashboard/inspector/expedientes', label: 'Expedientes',icon: FolderOpen },
        { href: '/dashboard/inspector/agenda',      label: 'Agenda',     icon: Calendar },
      ],
    },
    {
      id: 'flujo-inspeccion',
      label: 'Flujo de inspección',
      items: [
        { href: '/dashboard/inspector/solicitudes',  label: 'Solicitudes',  icon: ClipboardList },
        { href: '/dashboard/inspector/certificados', label: 'Certificados', icon: Award },
      ],
    },
    {
      id: 'directorio',
      label: 'Directorio',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes', label: 'Clientes',      icon: Building2 },
        { href: '/dashboard/admin/testigos',     label: 'Participantes', icon: BookUser },
      ],
    },
  ],

  // ───────────────────────────────────────────── CLIENTE
  cliente: [
    {
      id: 'mi-trabajo',
      label: 'Mi trabajo diario',
      items: [
        { href: '/dashboard/cliente', label: 'Mis Proyectos', icon: FolderOpen },
      ],
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useSafePathname() {
  const [mounted, setMounted] = useState(false)
  let pathname = ''
  try { pathname = usePathname() ?? '' } catch { pathname = '' }
  useEffect(() => setMounted(true), [])
  return mounted ? pathname : ''
}

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.items.some(i => isItemActive(pathname, i.href))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'relative flex items-center gap-3 pl-3.5 pr-3 py-2 rounded-lg transition-colors',
        // Tipografía: 13.5px, weight 500 (600 si activo), color white/78
        'text-[13.5px]',
        active
          ? 'font-semibold text-white bg-gradient-to-r from-brand-orange/15 to-transparent'
          : 'font-medium text-white/[0.78] hover:bg-white/[0.06] hover:text-white'
      )}
    >
      {/* Borde izquierdo naranja para item activo */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-orange"
        />
      )}
      <Icon className={cn('w-[16px] h-[16px] flex-shrink-0', active ? 'text-brand-orange' : 'text-white/55')} />
      <span className="flex-1 leading-tight truncate">{item.label}</span>
      {/* Badge numérico opcional */}
      {item.badge != null && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10px] font-bold leading-none bg-white/[0.12] text-white/85">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function GroupSection({
  group, pathname, onNavigate,
}: {
  group: NavGroup
  pathname: string
  onNavigate?: () => void
}) {
  const hasActive = groupHasActive(pathname, group)

  // Persist collapsed state in localStorage
  const storageKey = `ciae-sidebar-collapsed-${group.id}`
  const [open, setOpen] = useState(() => {
    if (!group.collapsible) return true
    return hasActive || (group.defaultOpen ?? false)
  })

  // Restaurar de localStorage al montar
  useEffect(() => {
    if (!group.collapsible) return
    if (typeof window === 'undefined') return
    const v = window.localStorage.getItem(storageKey)
    if (v === '1') setOpen(true)
    else if (v === '0' && !hasActive) setOpen(false)
    // si hasActive forzamos abierto siempre, sin importar storage
  }, [group.collapsible, hasActive, storageKey])

  function toggle() {
    setOpen(v => {
      const next = !v
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next ? '1' : '0')
      }
      return next
    })
  }

  // Auto-open si navegamos a un item dentro del grupo
  useEffect(() => {
    if (group.collapsible && hasActive) setOpen(true)
  }, [pathname, group.collapsible, hasActive])

  const showItems = !group.collapsible || open

  return (
    <div className="space-y-0.5">
      {/* Header de sección — 10px, weight 700, uppercase, letter-spacing 1.4 */}
      {group.label && (
        group.collapsible ? (
          <button
            onClick={toggle}
            className="w-full flex items-center justify-between px-3 py-2 group/sect"
          >
            <span
              className="text-[10px] font-bold uppercase text-white/40 group-hover/sect:text-white/60 transition-colors"
              style={{ letterSpacing: '1.4px' }}
            >
              {group.label}
            </span>
            <ChevronDown className={cn(
              'w-3 h-3 text-white/30 group-hover/sect:text-white/55 transition-all duration-200',
              open ? 'rotate-0' : '-rotate-90'
            )} />
          </button>
        ) : (
          <p
            className="px-3 py-2 text-[10px] font-bold uppercase text-white/40"
            style={{ letterSpacing: '1.4px' }}
          >
            {group.label}
          </p>
        )
      )}

      {/* Items */}
      {showItems && (
        <div className="space-y-0.5">
          {group.items.map(item => (
            <NavLink
              key={item.href}
              item={item}
              active={isItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Search ⌘K ────────────────────────────────────────────────────────────────
function SidebarSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  // El shortcut sólo se setea después de hidratar — evita hydration mismatch
  const [shortcut, setShortcut] = useState<string | null>(null)

  useEffect(() => {
    const isMac = /Mac|iP(hone|od|ad)/.test(navigator.userAgent)
    setShortcut(isMac ? '⌘K' : 'Ctrl K')
  }, [])

  // Atajo ⌘K / Ctrl+K para enfocar el search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar…"
        className="w-full pl-8 pr-12 py-2 rounded-[10px] bg-white/[0.07] border border-white/[0.08] text-[12.5px] text-white placeholder:text-white/40 focus:outline-none focus:bg-white/[0.10] focus:border-white/20 transition-colors"
        aria-label="Buscar (atajo Cmd+K / Ctrl+K)"
      />
      {/* kbd hint — sólo después de hidratar para evitar mismatch SSR/Client */}
      {shortcut && (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9.5px] font-medium text-white/45 bg-white/[0.08] border border-white/[0.08] tracking-wide">
          {shortcut}
        </kbd>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Sidebar({ rol, nombre, onLogout, isOpen, onClose }: {
  rol: UserRole
  nombre: string
  onLogout: () => void
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = useSafePathname()
  const groups = NAV[rol] ?? []

  // Iniciales del usuario (máx. 2)
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || nombre.charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        // Base
        'w-[248px] bg-sidebar-bg h-screen flex flex-col overflow-hidden z-40 relative',
        // Transición suave
        'transition-transform duration-300 ease-in-out',
        // Móvil: drawer fijo
        'fixed top-0 left-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: en flujo
        'md:sticky md:translate-x-0',
      )}
      // Radial gradient sutil naranja arriba a la izquierda — calidez
      style={{
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(239,159,39,0.08) 0%, rgba(239,159,39,0) 35%), radial-gradient(circle at 100% 100%, rgba(15,110,86,0.18) 0%, rgba(15,110,86,0) 50%)',
      }}
    >
      {/* ── Logo + cerrar móvil ── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm flex-shrink-0">
            <img src="/logo-ciae-icon.png" alt="CIAE" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[14px] leading-tight">CIAE</p>
            <p className="text-white/50 text-[10px] leading-tight tracking-wide">UIIE-CRE-021</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Search ⌘K ── */}
      <div className="px-3 pb-3">
        <SidebarSearch />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 pb-3 space-y-3 overflow-y-auto">
        {groups.map(group => (
          <GroupSection key={group.id} group={group} pathname={pathname} onNavigate={onClose} />
        ))}
      </nav>

      {/* ── User pill (card) + acciones ── */}
      <div className="px-2.5 pb-3 pt-2 border-t border-white/[0.08]">
        <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-2.5 flex items-center gap-2.5">
          {/* Avatar con gradient naranja */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundImage: 'linear-gradient(135deg, #EF9F27 0%, #d4881a 100%)' }}
          >
            <span className="text-white text-[12px] font-bold tracking-wide">{iniciales}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[12.5px] font-semibold truncate leading-tight">{nombre}</p>
            <p className="text-white/55 text-[10.5px] leading-tight truncate">{ROLE_LABELS[rol]}</p>
          </div>
          <NotificationBell />
        </div>

        {/* Acciones del footer */}
        <div className="mt-2 space-y-0.5">
          <Link
            href="/dashboard/ayuda"
            onClick={onClose}
            className="flex items-center gap-3 pl-3.5 pr-3 py-1.5 rounded-lg text-[13px] font-medium text-white/65 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-white/45" />
            Centro de ayuda
          </Link>
          <Link
            href="/dashboard/perfil"
            onClick={onClose}
            className="flex items-center gap-3 pl-3.5 pr-3 py-1.5 rounded-lg text-[13px] font-medium text-white/65 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-white/45" />
            Configuración
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 pl-3.5 pr-3 py-1.5 rounded-lg text-[13px] font-medium text-white/65 hover:bg-red-500/15 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-white/45" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}
