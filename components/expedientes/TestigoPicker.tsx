'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import {
  Search, X, UserCheck, UserPlus, ScanLine, Loader2,
  ChevronDown, Trash2, AlertTriangle, CheckCircle2, FileText,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TestigoInfo {
  id: string
  nombre: string
  apellidos?: string | null
  numero_ine?: string | null
  empresa?: string | null
  telefono?: string | null
  email?: string | null
}

interface Props {
  /** Testigo actualmente asignado (o null) */
  value: TestigoInfo | null
  /** Lista completa de testigos disponibles */
  testigos: TestigoInfo[]
  /** Se dispara cuando se asigna o quita un testigo */
  onChange: (testigo: TestigoInfo | null) => Promise<void> | void
  /** Se dispara cuando se crea un testigo nuevo (para que el padre actualice su lista) */
  onCreate?: (testigo: TestigoInfo) => void
  /** Etiqueta del campo */
  label: string
  /** ID del expediente (para crear testigos en contexto si es necesario) */
  expedienteId?: string
  /** Disabled */
  disabled?: boolean
  /** Cargando externamente (mientras se guarda en backend) */
  saving?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nombreCompleto(t: TestigoInfo) {
  return `${t.nombre}${t.apellidos ? ' ' + t.apellidos : ''}`.trim()
}

function matchSearch(t: TestigoInfo, q: string): boolean {
  if (!q) return true
  const haystack = [
    t.nombre, t.apellidos, t.empresa, t.numero_ine, t.telefono, t.email,
  ].filter(Boolean).join(' ').toLowerCase()
  // Cada palabra del query debe aparecer en el haystack
  return q.toLowerCase().split(/\s+/).every(part => haystack.includes(part))
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green'

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TestigoPicker({
  value, testigos, onChange, onCreate, label, disabled = false, saving = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Auto-focus search al abrir
  useEffect(() => {
    if (open && !creating) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open, creating])

  const filtered = useMemo(
    () => testigos.filter(t => matchSearch(t, query)).slice(0, 50),
    [testigos, query]
  )

  async function handleSelect(t: TestigoInfo) {
    setOpen(false)
    setQuery('')
    setCreating(false)
    await onChange(t)
  }

  async function handleClear() {
    await onChange(null)
  }

  function handleCreatedNew(t: TestigoInfo) {
    onCreate?.(t)
    handleSelect(t)
  }

  // ── UI ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
        {saving && <Loader2 className="w-3 h-3 animate-spin inline ml-1.5 text-brand-green" />}
      </label>

      {/* Botón principal: muestra el seleccionado o invita a buscar */}
      {!open && (
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={[
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
            value
              ? 'border-brand-green/30 bg-emerald-50/40 hover:bg-emerald-50'
              : 'border-dashed border-gray-300 text-gray-400 hover:border-brand-green hover:text-brand-green hover:bg-emerald-50/40',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {value ? (
            <>
              <UserCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{nombreCompleto(value)}</p>
                {(value.empresa || value.numero_ine) && (
                  <p className="text-xs text-gray-400 truncate">
                    {value.empresa}
                    {value.empresa && value.numero_ine && ' · '}
                    {value.numero_ine && <span className="font-mono">INE: {value.numero_ine}</span>}
                  </p>
                )}
              </div>
              {!disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); handleClear() }}
                  onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), handleClear())}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Quitar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Buscar o crear testigo…</span>
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            </>
          )}
        </button>
      )}

      {/* Panel abierto: search + lista + botón crear */}
      {open && (
        <div className="bg-white rounded-lg border-2 border-brand-green/40 shadow-lg overflow-hidden">

          {!creating ? (
            <>
              {/* Search bar */}
              <div className="relative border-b border-gray-100">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, INE, empresa…"
                  className="w-full pl-9 pr-9 py-2.5 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista de resultados */}
              <div className="max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-400 mb-2">
                      {query
                        ? `Sin resultados para "${query}"`
                        : 'No hay testigos en el catálogo'
                      }
                    </p>
                    <p className="text-xs text-gray-400">Crea uno nuevo abajo ↓</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {filtered.map(t => {
                      const isCurrent = value?.id === t.id
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(t)}
                            className={[
                              'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors',
                              isCurrent ? 'bg-emerald-50' : 'hover:bg-gray-50',
                            ].join(' ')}
                          >
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-brand-green">
                                {t.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {nombreCompleto(t)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                {t.empresa && <span className="truncate">{t.empresa}</span>}
                                {t.numero_ine && <span className="font-mono">INE: {t.numero_ine}</span>}
                                {t.telefono && <span className="font-mono">📱 {t.telefono}</span>}
                              </div>
                            </div>
                            {isCurrent && (
                              <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0 mt-1" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Botón "Crear nuevo" siempre al fondo */}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50 hover:bg-emerald-50 text-sm font-medium text-brand-green transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Crear nuevo testigo
                {query && <span className="text-xs text-gray-500 font-normal ml-auto">— "{query}"</span>}
              </button>
            </>
          ) : (
            <CrearTestigoForm
              initialName={query}
              onCancel={() => setCreating(false)}
              onCreated={handleCreatedNew}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subform de creación inline ──────────────────────────────────────────────

function CrearTestigoForm({
  initialName, onCancel, onCreated,
}: {
  initialName?: string
  onCancel: () => void
  onCreated: (t: TestigoInfo) => void
}) {
  // Si initialName tiene espacios, lo dividimos en nombre + apellidos
  const initial = (initialName ?? '').trim()
  const firstSpace = initial.indexOf(' ')
  const initialNombre    = firstSpace > 0 ? initial.slice(0, firstSpace) : initial
  const initialApellidos = firstSpace > 0 ? initial.slice(firstSpace + 1) : ''

  const [nombre,    setNombre]    = useState(initialNombre)
  const [apellidos, setApellidos] = useState(initialApellidos)
  const [numeroIne, setNumeroIne] = useState('')
  const [empresa,   setEmpresa]   = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [email,     setEmail]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Subir INE
  const fileRef = useRef<HTMLInputElement>(null)
  const [ineFile,    setIneFile]    = useState<File | null>(null)
  const [ineLoading, setIneLoading] = useState(false)
  const [ineOk,      setIneOk]      = useState(false)

  async function handleINE() {
    if (!ineFile) return
    setIneLoading(true)
    setError(null)
    setIneOk(false)
    try {
      const fd = new FormData()
      fd.append('ines', ineFile)
      const res = await fetch('/api/testigos/importar-ines', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo leer la INE')
      const p = (data.participantes ?? data.participants)?.[0]
      if (!p) throw new Error('La IA no extrajo datos de la INE')
      setNombre(p.nombre ?? '')
      setApellidos(p.apellidos ?? '')
      setNumeroIne(p.numero_ine ?? '')
      setIneOk(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIneLoading(false)
    }
  }

  async function handleSubmit() {
    if (!nombre.trim() || !apellidos.trim()) {
      setError('Nombre y apellidos son obligatorios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/testigos/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:     nombre.trim(),
          apellidos:  apellidos.trim(),
          numero_ine: numeroIne.trim() || null,
          empresa:    empresa.trim() || null,
          telefono:   telefono.trim() || null,
          email:      email.trim() || null,
          rol:        'testigo',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      // Si el endpoint detectó que ya existía (mismo INE), avisar al usuario.
      if (data.existing) {
        setError('Esta INE ya existe en el catálogo — usando registro existente')
      }
      onCreated({
        id:         data.id,
        nombre:     nombre.trim(),
        apellidos:  apellidos.trim(),
        numero_ine: numeroIne.trim() || null,
        empresa:    empresa.trim() || null,
        telefono:   telefono.trim() || null,
        email:      email.trim() || null,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Crear nuevo testigo</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← Volver a la búsqueda
        </button>
      </div>

      {/* Subir INE para auto-rellenar */}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setIneFile(f); setIneOk(false) } }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 text-xs px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-green hover:text-brand-green truncate"
        >
          <FileText className="w-3 h-3 inline mr-1" />
          {ineFile ? ineFile.name : 'Subir INE para auto-rellenar (opcional)'}
        </button>
        {ineFile && (
          <button
            type="button"
            onClick={handleINE}
            disabled={ineLoading}
            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {ineLoading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Leyendo…</>
              : <><ScanLine className="w-3 h-3" /> Leer</>}
          </button>
        )}
      </div>

      {ineOk && (
        <p className="text-xs text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Datos extraídos — revisa y guarda
        </p>
      )}

      {/* Campos */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre(s) *"
          className={inputCls}
          autoFocus
        />
        <input
          type="text"
          value={apellidos}
          onChange={e => setApellidos(e.target.value)}
          placeholder="Apellidos *"
          className={inputCls}
        />
        <input
          type="text"
          value={numeroIne}
          onChange={e => setNumeroIne(e.target.value)}
          placeholder="Número de INE (opcional)"
          className={inputCls + ' font-mono'}
        />
        <input
          type="text"
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
          placeholder="Empresa (opcional)"
          className={inputCls}
        />
        <input
          type="text"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="Teléfono (opcional)"
          className={inputCls}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo (opcional)"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !nombre.trim() || !apellidos.trim()}
          className="text-xs px-4 py-1.5 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 disabled:opacity-50 inline-flex items-center gap-1.5 font-semibold"
        >
          {saving
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando…</>
            : <><UserPlus className="w-3 h-3" /> Crear y asignar</>}
        </button>
      </div>
    </div>
  )
}
