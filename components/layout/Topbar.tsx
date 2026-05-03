'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// ─── Mapa de rutas → título y subtítulo ──────────────────────────────────────
// Las rutas más específicas deben ir primero. Soporta dynamic segments con [id].
type RouteMeta = {
  pattern: RegExp
  title: string
  subtitle?: string
  /** Cómo se rotula este segmento en el breadcrumb */
  crumb?: string
}

const ROUTE_META: RouteMeta[] = [
  // ─── Cliente
  { pattern: /^\/dashboard\/cliente\/cambiar-password$/, title: 'Cambiar contraseña', crumb: 'Cambiar contraseña' },
  { pattern: /^\/dashboard\/cliente\/[^/]+$/,            title: 'Detalle del proyecto', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/cliente$/,                   title: 'Mis proyectos', crumb: 'Mis proyectos' },

  // ─── Expedientes
  { pattern: /^\/dashboard\/inspector\/expedientes\/[^/]+\/dictamen$/, title: 'Dictamen del expediente', crumb: 'Dictamen' },
  { pattern: /^\/dashboard\/inspector\/expedientes\/[^/]+$/,           title: 'Detalle del expediente', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/inspector\/expedientes$/,                  title: 'Mis Expedientes', subtitle: 'Arrastra para reordenar tu prioridad' },
  { pattern: /^\/dashboard\/admin\/expedientes\/[^/]+$/,               title: 'Detalle del expediente', crumb: 'Detalle' },

  // ─── Solicitudes
  { pattern: /^\/dashboard\/inspector\/solicitudes\/nueva$/, title: 'Nueva solicitud', subtitle: 'Captura los datos para que admin asigne folio', crumb: 'Nueva' },
  { pattern: /^\/dashboard\/inspector\/solicitudes$/,        title: 'Solicitudes' },
  { pattern: /^\/dashboard\/admin\/solicitudes\/[^/]+$/,     title: 'Detalle de la solicitud', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/admin\/solicitudes$/,            title: 'Solicitudes', subtitle: 'Aprobar / rechazar solicitudes y asignar folios' },
  { pattern: /^\/dashboard\/solicitudes$/,                   title: 'Solicitudes' },

  // ─── Folios
  { pattern: /^\/dashboard\/admin\/folios$/, title: 'Folios CRE', subtitle: 'Asignación de folios a solicitudes aprobadas' },

  // ─── Agenda
  { pattern: /^\/dashboard\/inspector\/agenda\/nueva$/, title: 'Programar inspección', crumb: 'Nueva' },
  { pattern: /^\/dashboard\/inspector\/agenda$/,        title: 'Mi Agenda' },
  { pattern: /^\/dashboard\/admin\/agenda$/,            title: 'Agenda' },

  // ─── Catálogos / Directorio
  { pattern: /^\/dashboard\/inspector\/clientes\/duplicados$/, title: 'Clientes duplicados', crumb: 'Duplicados' },
  { pattern: /^\/dashboard\/inspector\/clientes\/nuevo$/,      title: 'Nuevo cliente', crumb: 'Nuevo' },
  { pattern: /^\/dashboard\/inspector\/clientes\/[^/]+$/,      title: 'Detalle del cliente', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/inspector\/clientes$/,             title: 'Clientes' },

  { pattern: /^\/dashboard\/admin\/testigos\/importar$/,       title: 'Importar participantes', crumb: 'Importar' },
  { pattern: /^\/dashboard\/admin\/testigos\/nuevo$/,          title: 'Nuevo participante', crumb: 'Nuevo' },
  { pattern: /^\/dashboard\/admin\/testigos\/[^/]+$/,          title: 'Detalle del participante', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/admin\/testigos$/,                 title: 'Participantes' },

  { pattern: /^\/dashboard\/admin\/inversores\/carga-masiva$/, title: 'Carga masiva de inversores', crumb: 'Carga masiva' },
  { pattern: /^\/dashboard\/admin\/inversores\/nuevo$/,        title: 'Nuevo inversor', crumb: 'Nuevo' },
  { pattern: /^\/dashboard\/admin\/inversores\/[^/]+$/,        title: 'Detalle del inversor', crumb: 'Detalle' },
  { pattern: /^\/dashboard\/admin\/inversores$/,               title: 'Inversores' },
  { pattern: /^\/dashboard\/inspector\/inversores\/agregar$/,  title: 'Agregar inversor', crumb: 'Agregar' },
  { pattern: /^\/dashboard\/inspector\/inversores$/,           title: 'Inversores' },

  { pattern: /^\/dashboard\/admin\/usuarios\/[^/]+\/editar$/,  title: 'Editar usuario', crumb: 'Editar' },
  { pattern: /^\/dashboard\/admin\/usuarios\/nuevo$/,          title: 'Nuevo usuario', crumb: 'Nuevo' },
  { pattern: /^\/dashboard\/admin\/usuarios$/,                 title: 'Usuarios' },

  { pattern: /^\/dashboard\/admin\/cne$/,                      title: 'Bóveda CNE', subtitle: 'Certificados emitidos por la CNE' },
  { pattern: /^\/dashboard\/inspector\/certificados$/,         title: 'Mis certificados' },
  { pattern: /^\/dashboard\/inspector\/equipo$/,               title: 'Mi equipo' },
  { pattern: /^\/dashboard\/inspectores$/,                     title: 'Inspectores' },

  // ─── Finanzas
  { pattern: /^\/dashboard\/conciliacion\/pagos$/,             title: 'Pagos / Facturas', crumb: 'Pagos' },
  { pattern: /^\/dashboard\/conciliacion$/,                    title: 'Conciliación' },
  { pattern: /^\/dashboard\/inspector\/conciliacion$/,         title: 'Mi Conciliación' },
  { pattern: /^\/dashboard\/reporte-trimestral$/,              title: 'Reporte trimestral', crumb: 'Reportes' },
  { pattern: /^\/dashboard\/ai-costos$/,                       title: 'Gastos en IA', subtitle: 'Costos de Claude API por usuario y expediente' },

  // ─── Sistema
  { pattern: /^\/dashboard\/ayuda$/,    title: 'Centro de ayuda' },
  { pattern: /^\/dashboard\/perfil$/,   title: 'Configuración', crumb: 'Configuración' },

  // ─── Dashboard roots
  { pattern: /^\/dashboard\/admin$/,     title: 'Panel Admin' },
  { pattern: /^\/dashboard\/inspector$/, title: 'Mi Dashboard' },
  { pattern: /^\/dashboard$/,            title: 'Inicio' },
]

function metaFor(path: string): RouteMeta | null {
  for (const m of ROUTE_META) {
    if (m.pattern.test(path)) return m
  }
  return null
}

// Los segmentos breadcrumb son los prefijos del path con su rótulo
function buildBreadcrumb(path: string): { label: string; href?: string }[] {
  // Construye prefijos progresivos y busca su meta
  const segments = path.split('/').filter(Boolean)
  const crumbs: { label: string; href?: string }[] = [{ label: 'Inicio', href: '/dashboard' }]

  let acc = ''
  for (let i = 0; i < segments.length; i++) {
    acc += '/' + segments[i]
    if (acc === '/dashboard') continue   // ya está como Inicio
    const meta = metaFor(acc)
    if (meta) {
      const label = meta.crumb ?? meta.title
      // último crumb: sin href (no clickable)
      const isLast = i === segments.length - 1
      crumbs.push({ label, href: isLast ? undefined : acc })
    }
  }
  return crumbs
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function Topbar() {
  const pathname = usePathname() ?? ''
  const meta = metaFor(pathname)

  // Si no hay match, ocultar el topbar (ej. /login no entra al dashboard layout)
  if (!meta) return null

  const crumbs = buildBreadcrumb(pathname)

  return (
    <header className="bg-white border-b border-border px-4 sm:px-7 pt-[18px] pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div className="min-w-0 flex-1">
        {/* Breadcrumb — 11.5px, color muted, separator chevron */}
        {crumbs.length > 1 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-[11.5px] text-muted">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={i} className="inline-flex items-center gap-1">
                  {i === 0 && <Home className="w-3 h-3 text-muted/70" />}
                  {c.href && !isLast ? (
                    <Link href={c.href} className="hover:text-ink2 transition-colors">{c.label}</Link>
                  ) : (
                    <span className={isLast ? 'font-semibold text-ink2' : ''}>{c.label}</span>
                  )}
                  {!isLast && <ChevronRight className="w-3 h-3 text-muted/50 mx-0.5" />}
                </span>
              )
            })}
          </nav>
        )}

        {/* Título */}
        <h1
          className="text-[22px] font-bold text-ink leading-tight truncate"
          style={{ letterSpacing: '-0.3px' }}
        >
          {meta.title}
        </h1>

        {/* Subtítulo opcional */}
        {meta.subtitle && (
          <p className="text-[13px] text-muted mt-0.5">{meta.subtitle}</p>
        )}
      </div>

      {/* Slot para acciones — pages pueden usar el componente <TopbarActions /> */}
      <div id="topbar-actions" className="flex items-center gap-2 flex-shrink-0" />
    </header>
  )
}
