'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronDown } from 'lucide-react'

interface InspectorOption {
  id: string
  nombre: string
  apellidos?: string | null
}

export default function SolicitudesFilters({
  inspectores = [],
}: { inspectores?: InspectorOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  // Estado del input — debounce 300ms para no spam-querar
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  useEffect(() => { setQuery(initialQ) }, [initialQ])

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString())
      if (query) sp.set('q', query); else sp.delete('q')
      sp.delete('page')   // resetear paginación
      startTransition(() => {
        router.replace(`?${sp.toString()}`, { scroll: false })
      })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams.toString())
    if (value) sp.set(key, value); else sp.delete(key)
    sp.delete('page')
    startTransition(() => router.replace(`?${sp.toString()}`, { scroll: false }))
  }

  const inspectorActual = searchParams.get('inspector') ?? ''
  const kwpActual       = searchParams.get('kwp') ?? ''
  const periodoActual   = searchParams.get('periodo') ?? ''

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search ghost — full-width prominente */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por cliente, sitio, folio o número de solicitud…"
          className={`
            w-full pl-9 pr-9 py-2.5 rounded-[10px] text-[13px]
            bg-bg/50 border border-border focus:bg-white
            focus:outline-none focus:ring-2 focus:ring-brand-green/15 focus:border-brand-green/40
            transition-colors
            ${pending ? 'opacity-90' : ''}
          `}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg text-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Inspector filter */}
      <FilterDropdown
        label="Inspector"
        value={inspectorActual}
        onChange={v => setParam('inspector', v || null)}
        options={[
          { value: '', label: 'Todos los inspectores' },
          ...inspectores.map(i => ({
            value: i.id,
            label: `${i.nombre} ${i.apellidos ?? ''}`.trim(),
          })),
        ]}
        currentLabel={inspectorActual
          ? (inspectores.find(i => i.id === inspectorActual)
              ? `${inspectores.find(i => i.id === inspectorActual)!.nombre}`.split(' ')[0]
              : 'Inspector')
          : 'Inspector'}
      />

      {/* kWp filter */}
      <FilterDropdown
        label="kWp"
        value={kwpActual}
        onChange={v => setParam('kwp', v || null)}
        options={[
          { value: '',          label: 'Cualquier potencia' },
          { value: '0-50',      label: '0 — 50 kWp' },
          { value: '50-150',    label: '50 — 150 kWp' },
          { value: '150-300',   label: '150 — 300 kWp' },
          { value: '300+',      label: '300+ kWp' },
        ]}
        currentLabel={kwpActual ? `kWp: ${kwpActual}` : 'kWp'}
      />

      {/* Período filter */}
      <FilterDropdown
        label="Período"
        value={periodoActual}
        onChange={v => setParam('periodo', v || null)}
        options={[
          { value: '',     label: 'Todo el tiempo' },
          { value: '7d',   label: 'Últimos 7 días' },
          { value: '30d',  label: 'Últimos 30 días' },
          { value: '90d',  label: 'Últimos 3 meses' },
          { value: 'year', label: 'Este año' },
        ]}
        currentLabel={periodoActual
          ? ({ '7d': '7 días', '30d': '30 días', '90d': '3 meses', 'year': 'Este año' } as any)[periodoActual] ?? 'Período'
          : 'Período'}
      />
    </div>
  )
}

// ─── Dropdown nativo estilizado ──────────────────────────────────────────────
function FilterDropdown({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  /** unused — kept for backwards compat */
  currentLabel?: string
}) {
  const isActive = !!value
  // Cuando el filtro NO está activo, mostramos solo el label corto (ej. "Inspector").
  // Cuando SÍ, mostramos las opciones (incluyendo el "Todos…").
  const displayOptions = isActive
    ? options
    : [{ value: '', label }].concat(options.filter(o => o.value !== ''))

  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`
          appearance-none pl-3 pr-7 py-2 text-[12.5px] font-medium rounded-[10px]
          border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/15
          ${isActive
            ? 'bg-brand-green-light text-brand-green-dark border-brand-green/30'
            : 'bg-white text-ink2 border-border hover:bg-bg/40'}
        `}
      >
        {displayOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isActive ? 'text-brand-green' : 'text-muted'}`} />
    </div>
  )
}
