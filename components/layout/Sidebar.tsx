'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn, ROLE_LABELS } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard, FileText, FolderOpen, Calendar,
  Users, Settings, LogOut, Zap, ChevronDown,
  ClipboardList, BarChart3, UserCog, Building2, BookUser,
  Cpu, Globe, FileSpreadsheet, Receipt, UsersRound, Award, X,
} from 'lucide-react'
import NotificationBell from './NotificationBell'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  id: string
  label?: string          // section header; omit for top-level items
  collapsible?: boolean   // can be toggled open/closed
  defaultOpen?: boolean   // initial state when collapsible
  items: NavItem[]
}

// ─── Nav structure per role ───────────────────────────────────────────────────

const NAV: Record<UserRole, NavGroup[]> = {
  inspector_responsable: [
    {
      id: 'inicio',
      items: [
        { href: '/dashboard',       label: 'KPIs Globales', icon: BarChart3 },
        { href: '/dashboard/admin', label: 'Panel Admin',   icon: LayoutDashboard },
      ],
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      items: [
        { href: '/dashboard/admin/solicitudes',        label: 'Solicitudes',    icon: ClipboardList },
        { href: '/dashboard/admin/folios',             label: 'Asignar Folios', icon: FileText },
        { href: '/dashboard/inspector/expedientes',    label: 'Expedientes',    icon: FolderOpen },
        { href: '/dashboard/inspector/agenda',         label: 'Agenda',         icon: Calendar },
      ],
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes', label: 'Clientes',          icon: Building2 },
        { href: '/dashboard/admin/testigos',     label: 'Participantes',     icon: BookUser },
        { href: '/dashboard/admin/inversores',   label: 'Inversores',        icon: Cpu },
        { href: '/dashboard/admin/usuarios',     label: 'Usuarios',          icon: Users },
        { href: '/dashboard/inspectores',        label: 'Inspectores',       icon: UserCog },
        { href: '/dashboard/admin/cne',          label: 'Certificados CRE',  icon: Globe },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/conciliacion',           label: 'Conciliación',       icon: BarChart3 },
        { href: '/dashboard/conciliacion/pagos',     label: 'Pagos / Facturas',   icon: Receipt },
        { href: '/dashboard/reporte-trimestral',     label: 'Reporte Trimestral', icon: FileSpreadsheet },
      ],
    },
  ],

  admin: [
    {
      id: 'inicio',
      items: [
        { href: '/dashboard/admin', label: 'Panel Admin', icon: LayoutDashboard },
      ],
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      items: [
        { href: '/dashboard/admin/solicitudes',       label: 'Solicitudes',    icon: ClipboardList },
        { href: '/dashboard/admin/folios',            label: 'Asignar Folios', icon: FileText },
        { href: '/dashboard/inspector/expedientes',   label: 'Expedientes',    icon: FolderOpen },
        { href: '/dashboard/admin/agenda',            label: 'Agenda',         icon: Calendar },
      ],
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/clientes', label: 'Clientes',         icon: Building2 },
        { href: '/dashboard/admin/testigos',     label: 'Participantes',    icon: BookUser },
        { href: '/dashboard/admin/inversores',   label: 'Inversores',       icon: Cpu },
        { href: '/dashboard/admin/usuarios',     label: 'Usuarios',         icon: Users },
        { href: '/dashboard/admin/cne',          label: 'Certificados CRE', icon: Globe },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/conciliacion',       label: 'Conciliación',       icon: BarChart3 },
        { href: '/dashboard/conciliacion/pagos', label: 'Pagos / Facturas',   icon: Receipt },
        { href: '/dashboard/reporte-trimestral', label: 'Reporte Trimestral', icon: FileSpreadsheet },
      ],
    },
  ],

  inspector: [
    {
      id: 'inicio',
      items: [
        { href: '/dashboard/inspector',             label: 'Mi Dashboard',    icon: LayoutDashboard },
        { href: '/dashboard/inspector/expedientes', label: 'Mis Expedientes', icon: FolderOpen },
        { href: '/dashboard/inspector/agenda',      label: 'Mi Agenda',       icon: Calendar },
      ],
    },
    {
      id: 'tramites',
      label: 'Trámites',
      items: [
        { href: '/dashboard/inspector/solicitudes', label: 'Solicitudes',   icon: ClipboardList },
        { href: '/dashboard/inspector/clientes',    label: 'Clientes',      icon: Building2 },
        { href: '/dashboard/admin/testigos',        label: 'Participantes', icon: BookUser },
      ],
    },
    {
      id: 'mas',
      label: 'Más',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: '/dashboard/inspector/certificados',  label: 'Certificados', icon: Award },
        { href: '/dashboard/inspector/inversores',   label: 'Inversores',   icon: Cpu },
        { href: '/dashboard/inspector/conciliacion', label: 'Conciliación', icon: Receipt },
        { href: '/dashboard/inspector/equipo',       label: 'Mi Equipo',    icon: UsersRound },
      ],
    },
  ],

  auxiliar: [
    {
      id: 'inicio',
      items: [
        { href: '/dashboard/inspector',             label: 'Dashboard',       icon: LayoutDashboard },
        { href: '/dashboard/inspector/expedientes', label: 'Expedientes',     icon: FolderOpen },
        { href: '/dashboard/inspector/agenda',      label: 'Agenda',          icon: Calendar },
      ],
    },
    {
      id: 'tramites',
      label: 'Trámites',
      items: [
        { href: '/dashboard/inspector/solicitudes',   label: 'Solicitudes',   icon: ClipboardList },
        { href: '/dashboard/inspector/clientes',      label: 'Clientes',      icon: Building2 },
        { href: '/dashboard/admin/testigos',          label: 'Participantes', icon: BookUser },
        { href: '/dashboard/inspector/certificados',  label: 'Certificados',  icon: Award },
      ],
    },
  ],

  cliente: [
    {
      id: 'inicio',
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-white/20 text-white'
          : 'text-white/65 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-white/50')} />
      <span className="flex-1 leading-tight">{item.label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />}
    </Link>
  )
}

function GroupSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup
  pathname: string
  onNavigate?: () => void
}) {
  const hasActive = groupHasActive(pathname, group)

  // Collapsible groups: open if there's an active item inside, otherwise default
  const [open, setOpen] = useState(() => {
    if (!group.collapsible) return true
    return hasActive || (group.defaultOpen ?? false)
  })

  // Auto-open if navigating to an item inside this group
  useEffect(() => {
    if (group.collapsible && hasActive) setOpen(true)
  }, [pathname, group.collapsible, hasActive])

  const showItems = !group.collapsible || open

  return (
    <div className="space-y-0.5">
      {/* Section header */}
      {group.label && (
        group.collapsible ? (
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 mt-1 group"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35 group-hover:text-white/55 transition-colors">
              {group.label}
            </span>
            <ChevronDown className={cn(
              'w-3 h-3 text-white/30 group-hover:text-white/50 transition-all duration-200',
              open ? 'rotate-0' : '-rotate-90'
            )} />
          </button>
        ) : (
          <p className="px-3 py-1.5 mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            {group.label}
          </p>
        )
      )}

      {/* Items */}
      {showItems && (
        <div className={cn('space-y-0.5', group.collapsible && 'overflow-hidden')}>
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

  return (
    <aside className={cn(
      // Base
      'w-56 bg-[#0A5C47] h-screen flex flex-col overflow-hidden z-40',
      // Transición suave
      'transition-transform duration-300 ease-in-out',
      // Móvil: drawer fijo a la izquierda, oculto/visible según isOpen
      'fixed top-0 left-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      // Desktop: en el flujo normal, siempre visible
      'md:sticky md:translate-x-0',
    )}>

      {/* ── Logo + botón cerrar móvil ── */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">CIAE</p>
            <p className="text-white/50 text-[10px] leading-tight tracking-wide">UIIE-CRE-021</p>
          </div>
          {/* Botón cerrar — solo móvil */}
          <button
            onClick={onClose}
            className="md:hidden text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── User pill ── */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">{nombre}</p>
            <p className="text-white/50 text-[10px] leading-tight">{ROLE_LABELS[rol]}</p>
          </div>
          {/* Campana de notificaciones */}
          <NotificationBell />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {groups.map((group, i) => (
          <div key={group.id}>
            {/* Visual separator between groups (not before the first) */}
            {i > 0 && !group.label && (
              <div className="my-2 border-t border-white/10" />
            )}
            <GroupSection group={group} pathname={pathname} onNavigate={onClose} />
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-2.5 py-3 border-t border-white/10 space-y-0.5">
        <Link
          href="/dashboard/perfil"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
