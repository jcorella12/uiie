# Handoff: CIAE — Mejoras de UI del sistema de gestión

## Overview
Propuesta de rediseño de la interfaz del sistema CIAE (Unidad de Inspección UIIE-CRE-021), construido en Next.js 14 (App Router) + Tailwind CSS + Supabase. El objetivo es hacer la app **más amigable, ordenada y entendible** sin reescribir lógica de negocio: solo navegación, jerarquía visual, densidad y consistencia de componentes.

## About the Design Files
Los archivos en este paquete son **referencias de diseño creadas en HTML/JSX** — prototipos que muestran la apariencia y el comportamiento deseado, **no código de producción para copiar directo**. La tarea es **recrear estos diseños en el codebase real** (`iisac-app/`, Next.js + Tailwind), usando los patrones, componentes y tokens ya existentes (`globals.css`, `tailwind.config.ts`, `components/ui/`).

## Fidelity
**High-fidelity (hifi)**. Colores exactos, tipografía, espaciado, badges y estados están definidos. El desarrollador debe replicar pixel-perfect usando los utilities Tailwind del proyecto y sus componentes (`StatusBadge`, `KPICard`, `EmptyState`, `Sidebar`, `DashboardLayout`).

---

## Screens / Views

### 1. Sidebar (rediseñado) — `components/layout/Sidebar.tsx`

**Propósito:** Navegación primaria, búsqueda global, acceso a perfil y notificaciones.

**Layout:** `width: 248px`, fondo `#073929` (verde más profundo que el actual `#0A5C47`), con un radial-gradient muy sutil de naranja arriba a la izquierda para calidez.

**Cambios estructurales clave (vs. actual):**
- **Reagrupar items por flujo de trabajo, no por entidad técnica.** Nuevas secciones:
  - `Mi trabajo diario` → Inicio, Mis tareas, Agenda
  - `Flujo de inspección` → Solicitudes, Folios CRE, Expedientes, Certificados
  - `Directorio` → Clientes, Participantes, Inversores, Equipo
  - `Finanzas` → Conciliación, Pagos, Reportes
- **Search bar global ⌘K** justo debajo del logo. Estilo: `bg: rgba(255,255,255,.07)`, `border: rgba(255,255,255,.08)`, `radius: 10px`, `padding: 8px 10px`.
- **Badges de número** al lado de items con pendientes (`5`, `2 hoy`). Estilo: `bg: rgba(255,255,255,.12)`, `font-size: 10px`, `font-weight: 700`, `border-radius: 999px`, `padding: 2px 7px`.
- **Item activo** ya no se rellena con `bg-white/20`. Usa borde izquierdo de 3px en `#EF9F27` + gradient muy sutil naranja, y `font-weight: 600`.
- **User pill** abajo dentro de una "card" `bg: rgba(255,255,255,.06)` con borde sutil; avatar con gradient naranja (`#EF9F27 → #d4881a`).

**Tipografía:**
- Títulos de sección: 10px, weight 700, letter-spacing 1.4, color `rgba(255,255,255,.4)`, uppercase.
- Items: 13.5px, weight 500 (600 si activo), color `rgba(255,255,255,.78)`.

---

### 2. Topbar global (nueva) — añadir a `DashboardLayout.tsx`

**Propósito:** Breadcrumbs + título contextual + acciones primarias por pantalla.

**Layout:** `padding: 18px 28px 16px`, `background: #fff`, `border-bottom: 1px solid #E5E8EE`, `display: flex; justify-content: space-between; align-items: flex-end`.

**Estructura:**
- Breadcrumb (11.5px, color `#6B7689`, separador `chevron-right`). Último crumb en peso 600.
- Título: 22px, weight 700, letter-spacing -0.3, color `#0F1B2D`.
- Subtítulo opcional: 13px, color `#6B7689`.
- Acciones a la derecha: search "ghost" + botones (primario verde `#0F6E56`, secundarios outline).

---

### 3. Dashboard Admin — `app/dashboard/admin/page.tsx`

**Cambios:**
1. **Bloque "Requiere tu atención"** arriba (en lugar de mezclarse con KPIs). Card blanca con `border-left: 4px solid #EF9F27`, icono ámbar circular, copy específico (ej: "4 solicitudes con precio bajo el umbral del 70% del tabulador") y CTA naranja "Revisar ahora →".
2. **KPIs operativos rediseñados.** Quitar gradientes saturados. Usar:
   - Card blanca, `border: 1px solid #E5E8EE`, `radius: 14px`, `padding: 18px`.
   - Label arriba (11.5px, color muted) + dot accent de color (6px circle).
   - Valor en 30px, weight 700, letter-spacing -0.6, color `#0F1B2D`.
   - Pill de delta (+9 este mes) en verde `#E6F4EE/#0F6E56`, ámbar o naranja según signo.
3. **Cola de revisión:**
   - Filtros tipo segmented arriba de la tabla: `Todas | Pendientes | En revisión | Con alerta` (chip activo en `bg: #e8f4f1` con borde verde).
   - Filas urgentes con `background: #FFFBF2` para destacar visualmente.
   - Avatar circular del inspector (24-26px, fondo `#EEF2F6`, iniciales `#27374D`).
   - Badge de estado consistente (usar `StatusBadge` con tonos: `gray=Pendiente`, `purple=En revisión`, `amber=Devuelto`, `red=Rechazado`, `green=Folio asignado`).
   - Acción agrupada al final: botón link "Asignar →" en verde.
4. **Sidebar derecho (col 1fr):** Card "Agenda de hoy" con la siguiente cita destacada en verde + card "Ingresos del mes" con bar-chart de 7 días (último día naranja, resto verde traslúcido).

---

### 4. Dashboard Inspector — `app/dashboard/inspector/page.tsx`

**Cambios:**
1. **Una sola "carta de prioridad"** en la parte superior con `border-top: 3px solid #EF9F27`, ícono ámbar grande, copy con la observación literal entre comillas y dos botones (outline + naranja primario).
2. **Pipeline visual del expediente** — nueva sección clave. Grid de 5 columnas representando las etapas del flujo:
   `Solicitud → Folio asignado → En proceso → En revisión CIAE → Certificados`
   Cada etapa es una mini-card:
   - `radius: 12px`, `padding: 14px`, `border: 1px solid #E5E8EE`, `bg: #FAFBFC`.
   - Icono pequeño 28×28 dentro de un cuadrado blanco.
   - Número grande (26px, weight 700) + label (12.5px) + sub (11px).
   - Etapa activa ("Tu foco") con `bg: #FFF8EC`, `border: 1px solid rgba(239,159,39,0.4)` y badge "Tu foco".
   - Conector circular (14×14, blanco con borde) entre cards con chevron derecho.
3. **2 columnas abajo:**
   - "Próximas inspecciones" con día/fecha grande a la izquierda + barra vertical verde si es hoy.
   - "Mis solicitudes recientes" con lista compacta (cliente + sitio + kWp + badge + fecha).

---

### 5. Lista de Solicitudes — `app/dashboard/admin/solicitudes/page.tsx`

**Cambios:**
1. **Stat-chips actuales → tabs segmented** dentro de un container blanco con padding 6px. Cada tab muestra dot de color del estado + label + count en pill.
2. **Search bar prominente full-width** arriba: ghost input con placeholder "Buscar por cliente, sitio, folio o número de solicitud…".
3. **Fila de filtros** al lado: `Inspector ▾`, `kWp ▾`, `Período ▾`, `Más filtros ▾`.
4. **Tabla con columna nueva "% Tabulador":**
   - Mini-bar inline (60×5px, radius 3) + valor en 11.5px weight 700.
   - Color: verde si ≥100%, naranja `#EF9F27` si 70-99%, rojo `#EF4444` si <70%.
5. **Acciones agrupadas:** botones de 28×28 con borde sutil para `ver / editar / más` (no link de texto).
6. **Paginación numerada** abajo (1, 2, 3… con activo en verde sólido).

---

## Design Tokens

### Colores (mantener los ya definidos en `tailwind.config.ts`)

```ts
brand: {
  green:        '#0F6E56',  // primario
  'green-dark': '#0a5040',
  'green-light':'#e8f4f1',
  orange:       '#EF9F27',  // acento
  'orange-dark':'#d4881a',
  'orange-light':'#fdf3e3',
}
```

### Colores nuevos a añadir

```ts
// Sidebar oscuro
sidebar: {
  bg:    '#073929',  // verde más profundo (era #0A5C47)
}

// Tinta y muted (más ricos que gray-* genéricos)
ink:   '#0F1B2D',  // títulos
ink2:  '#27374D',  // texto cuerpo
muted: '#6B7689',  // meta/labels
border:'#E5E8EE',
bg:    '#F6F7F9',  // fondo app
```

### Tonos de estado canónicos (usar siempre `<StatusBadge>`)

| Estado            | Tone    | bg       | fg       | border   |
|-------------------|---------|----------|----------|----------|
| pendiente         | gray    | #F1F3F6  | #4B5563  | #E5E7EB  |
| en_revision       | purple  | #EDE9FE  | #5B21B6  | #DDD6FE  |
| aprobado/cerrado  | green   | #E6F4EE  | #0a5040  | #BFE3D2  |
| devuelto          | amber   | #FEF3C7  | #854D0E  | #FDE68A  |
| rechazado         | red     | #FEE2E2  | #9F1239  | #FECACA  |
| folio_asignado    | green   | #E6F4EE  | #0a5040  | #BFE3D2  |

### Tipografía

```
H1 (page title):   22px / weight 700 / -0.3 letter-spacing
H2 (section):      14.5px / weight 700
KPI value:         30px / weight 700 / -0.6 letter-spacing
Body:              13px
Meta/labels:       11.5px
Section heading:   10–11px / weight 700 / uppercase / letter-spacing 1.2–1.4
```

Familia: `Inter` (ya configurada).

### Espaciado y radios

- Card radius: `14px` (era mezcla de 12/`rounded-xl`).
- Card padding: `18-22px`.
- Card border: `1px solid #E5E8EE`.
- Botones: `radius: 10px`, `padding: 8-10px x 14-18px`.
- Badges/pills: `radius: 999px`, `padding: 2px 8px`.
- Inputs: `radius: 10px`, `padding: 10px 14px`.
- Sombras: usar muy sutiles. `shadow-sm` para botón primario, ninguna en cards (solo borde).

---

## Interactions & Behavior

- **Sidebar**: al click en sección con sub-items colapsables, animar `chevron` 90° y altura. Búsqueda ⌘K abre un command palette (a definir, fuera de scope inmediato).
- **Botones**: hover `opacity: 0.92` o `darken 4%`. Transition 150ms.
- **Filas de tabla**: hover `bg: #FAFBFC`. Click en cualquier celda (no solo el link) abre el detalle.
- **Tabs segmented**: click cambia el filtro de la tabla sin recargar página (URL search param `?status=pendiente`).
- **Badge de estado**: tooltip al hover con timestamp "Cambiado a En Revisión hace 3 días".
- **CTA de prioridad**: focus visible con outline ámbar.

## State Management

No cambia respecto al actual. Mantener Server Components con Supabase. Los filtros de tabla se manejan vía URL search params (Next.js `searchParams` prop). El sidebar guarda estado de colapso en `localStorage` (key: `ciae-sidebar-collapsed-{sectionId}`).

## Assets

- `public/logo-ciae-icon.png`, `public/logo-ciae.png`, `public/logo-ciae-64.png` — ya existen, mantener.
- Iconos: seguir usando **lucide-react** (ya instalado). En los mocks JSX hay SVGs inline solo porque no se podía importar lucide-react en el HTML; en el codebase real se usa `import { Search, Bell, ... } from 'lucide-react'`.

## Files

Archivos de referencia incluidos en este paquete:

- `Propuesta CIAE.html` — entry point del lienzo de diseño.
- `design-canvas.jsx` — wrapper del canvas (no replicar; solo es presentación).
- `mejoras/components.jsx` — Sidebar (Antes y Después), Topbar, Card, Badge, set de iconos.
- `mejoras/dashboard-admin.jsx` — Dashboard Admin Antes y Después.
- `mejoras/screens-extra.jsx` — Dashboard Inspector, Lista de Solicitudes, Notas.

**Archivos a modificar en `iisac-app/`:**
- `components/layout/Sidebar.tsx` — reorganizar grupos, agregar search ⌘K, badges, fondo oscuro.
- `components/layout/DashboardLayout.tsx` — añadir Topbar global con breadcrumbs.
- `app/dashboard/admin/page.tsx` — bloque atención + KPIs limpios + tabla con filtros segmented.
- `app/dashboard/inspector/page.tsx` — pipeline visual + reorganización de cards.
- `app/dashboard/admin/solicitudes/page.tsx` — tabs segmented + columna % tabulador + acciones icon.
- `components/dashboard/KPICard.tsx` — variante "neutral" con dot accent y delta pill.
- `components/ui/StatusBadge.tsx` — sin cambios mayores; ya está bien estructurado.
- `app/globals.css` — agregar utilities `.tab-segmented`, `.kpi-delta-pill`, etc.
- `tailwind.config.ts` — agregar tokens `ink`, `ink2`, `muted`, `border` y `sidebar.bg: #073929`.

## Notas finales

- **No tocar la lógica de Supabase ni los queries.** Las mejoras son exclusivamente de presentación.
- Mantener la accesibilidad: contraste WCAG AA en todos los badges (ya cumplido en el diseño actual).
- Probar el sidebar mobile drawer — la nueva estructura debe seguir funcionando con `isOpen/onClose`.
- El gradient radial del sidebar puede implementarse con un pseudo-elemento `::before` o como background-image directo en el `<aside>`.
