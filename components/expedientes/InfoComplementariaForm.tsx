'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Loader2, ScanLine, AlertTriangle, CheckCircle2,
  Search, UserPlus, ChevronDown, Sparkles,
} from 'lucide-react'
import TestigoPicker from './TestigoPicker'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TestigoInfo {
  id: string
  nombre: string
  apellidos?: string | null
  numero_ine?: string | null
  empresa?: string | null
  telefono?: string | null
  email?: string | null
}

interface ClienteComplementario {
  id: string
  nombre?: string | null
  representante?: string | null
  figura_juridica?: string | null
  firmante_nombre?: string | null
  firmante_curp?: string | null
  firmante_numero_ine?: string | null
  firmante_telefono?: string | null
  firmante_correo?: string | null
  atiende_nombre?: string | null
  atiende_numero_ine?: string | null
  atiende_telefono?: string | null
  atiende_correo?: string | null
}

interface Props {
  expedienteId: string
  cliente?: ClienteComplementario | null
  testigo1?: TestigoInfo | null
  testigo2?: TestigoInfo | null
  testigos: TestigoInfo[]
  /** Correo CFE del expediente (sobreescribe clientes.correo_cfe). */
  correoCfe?: string | null
  readOnly?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIGURA_LABELS: Record<string, string> = {
  representante_legal: 'Representante Legal',
  gestor:              'Gestor',
  propietario:         'Propietario',
}

const inputCls  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green'
const selectCls = inputCls

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-44 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words">
        {value ?? <span className="text-gray-400">—</span>}
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

// ─── Persona editor: search + create + INE picker → fills editable fields ───

interface PersonaValues {
  nombre: string
  curp: string
  numero_ine: string
  telefono: string
  correo: string
}

function PersonaEditor({
  title,
  values,
  onChange,
  testigos,
  onCatalogAdd,
  showCurp = false,
}: {
  title: string
  values: PersonaValues
  onChange: (v: Partial<PersonaValues>) => void
  testigos: TestigoInfo[]
  onCatalogAdd?: (t: TestigoInfo) => void
  showCurp?: boolean
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [creating, setCreating]     = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)

  // Subir INE inline
  const fileRef = useRef<HTMLInputElement>(null)
  const [ineFile,    setIneFile]    = useState<File | null>(null)
  const [ineLoading, setIneLoading] = useState(false)
  const [ineError,   setIneError]   = useState<string | null>(null)
  const [ineOk,      setIneOk]      = useState(false)

  // Form crear nuevo
  const [newApellidos, setNewApellidos] = useState('')
  const [newSaving,    setNewSaving]    = useState(false)
  const [newError,     setNewError]     = useState<string | null>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
        setCreating(false)
        setQuery('')
        setIneError(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  useEffect(() => {
    if (pickerOpen && !creating) setTimeout(() => searchRef.current?.focus(), 50)
  }, [pickerOpen, creating])

  const filtered = useMemo(() => {
    return testigos.filter(t => {
      if (!query) return true
      const hay = [t.nombre, t.apellidos, t.empresa, t.numero_ine, t.telefono, t.email]
        .filter(Boolean).join(' ').toLowerCase()
      return query.toLowerCase().split(/\s+/).every(p => hay.includes(p))
    }).slice(0, 30)
  }, [testigos, query])

  function handleSelect(t: TestigoInfo) {
    onChange({
      nombre:     `${t.nombre}${t.apellidos ? ' ' + t.apellidos : ''}`,
      numero_ine: t.numero_ine ?? '',
      telefono:   t.telefono ?? '',
      correo:     t.email ?? '',
    })
    setPickerOpen(false)
    setQuery('')
    setCreating(false)
  }

  async function handleINE() {
    if (!ineFile) return
    setIneLoading(true); setIneError(null); setIneOk(false)
    try {
      const fd = new FormData()
      fd.append('ines', ineFile)
      const res  = await fetch('/api/testigos/importar-ines', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al leer INE')
      const p = (data.participantes ?? data.participants)?.[0]
      if (!p) throw new Error('No se pudo extraer información de la INE')

      const nombreCompleto = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim()
      onChange({
        nombre:     nombreCompleto,
        curp:       p.curp ?? '',
        numero_ine: p.numero_ine ?? '',
      })

      // Guardar en catálogo (best-effort) y actualizar lista local
      if (nombreCompleto && p.apellidos) {
        fetch('/api/testigos/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre:        p.nombre?.trim() || nombreCompleto,
            apellidos:     p.apellidos?.trim() || '-',
            curp:          p.curp || null,
            numero_ine:    p.numero_ine || null,
            clave_elector: p.clave_elector || null,
            domicilio:     p.domicilio || null,
            colonia:       p.colonia || null,
            cp:            p.cp || null,
            ciudad:        p.ciudad || null,
            estado:        p.estado || null,
            ocr_curp:          p.curp || null,
            ocr_clave_elector: p.clave_elector || null,
            ocr_numero_ine:    p.numero_ine || null,
            ocr_domicilio:     p.domicilio ? `${p.domicilio}${p.colonia ? ', ' + p.colonia : ''}${p.ciudad ? ', ' + p.ciudad : ''}` : null,
          }),
        })
        .then(r => r.json())
        .then(d => {
          if (d?.id && onCatalogAdd) {
            onCatalogAdd({
              id:         d.id,
              nombre:     p.nombre?.trim() || nombreCompleto,
              apellidos:  p.apellidos?.trim() || null,
              numero_ine: p.numero_ine ?? null,
              empresa:    null,
              telefono:   null,
              email:      null,
            })
          }
        })
        .catch(() => { /* no-op */ })
      }

      setIneOk(true)
      setIneFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => { setPickerOpen(false); setIneOk(false) }, 800)
    } catch (err: any) {
      setIneError(err.message)
    } finally {
      setIneLoading(false)
    }
  }

  async function handleCreate() {
    // Si query tiene espacios → el primer espacio separa nombre / apellidos
    const q = query.trim()
    const sp = q.indexOf(' ')
    const nombre    = sp > 0 ? q.slice(0, sp) : q
    const apellidos = newApellidos.trim() || (sp > 0 ? q.slice(sp + 1) : '')

    if (!nombre || !apellidos) {
      setNewError('Nombre y apellidos son obligatorios')
      return
    }
    setNewSaving(true); setNewError(null)
    try {
      const res = await fetch('/api/testigos/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellidos, rol: 'testigo' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')

      const newT: TestigoInfo = {
        id: data.id, nombre, apellidos, numero_ine: null,
        empresa: null, telefono: null, email: null,
      }
      onCatalogAdd?.(newT)
      handleSelect(newT)
      setNewApellidos('')
    } catch (err: any) {
      setNewError(err.message)
    } finally {
      setNewSaving(false)
    }
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-600">{title}</span>
        {values.nombre && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
            <CheckCircle2 className="w-3 h-3" /> Datos cargados
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* Botón principal — abre picker */}
        {!pickerOpen ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-green hover:text-brand-green hover:bg-emerald-50/40 transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Buscar persona, crear nueva o subir INE</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="rounded-lg border-2 border-brand-green/40 bg-white overflow-hidden">

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
                  <button type="button" onClick={() => { setPickerOpen(false); setQuery('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de resultados */}
                <div className="max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm text-gray-400 mb-1">
                        {query ? `Sin resultados para "${query}"` : 'No hay personas en el catálogo'}
                      </p>
                      <p className="text-xs text-gray-400">Crea una nueva o sube su INE ↓</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {filtered.map(t => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(t)}
                            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-emerald-50 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-brand-green">
                                {t.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {t.nombre}{t.apellidos ? ' ' + t.apellidos : ''}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                {t.empresa && <span className="truncate">{t.empresa}</span>}
                                {t.numero_ine && <span className="font-mono">INE: {t.numero_ine}</span>}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer: opciones de creación */}
                <div className="border-t border-gray-100 bg-gray-50">
                  {/* Subir INE */}
                  <div className="p-2 border-b border-gray-100 space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setIneFile(f); setIneOk(false); setIneError(null) } }}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex-1 text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-brand-green hover:text-brand-green truncate bg-white">
                        <ScanLine className="w-3 h-3 inline mr-1" />
                        {ineFile ? ineFile.name : 'Subir foto/PDF de INE para auto-rellenar'}
                      </button>
                      {ineFile && (
                        <button type="button" onClick={handleINE} disabled={ineLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
                          {ineLoading
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Leyendo…</>
                            : <><Sparkles className="w-3 h-3" /> Leer</>}
                        </button>
                      )}
                    </div>
                    {ineError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{ineError}
                      </p>
                    )}
                    {ineOk && (
                      <p className="text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Datos extraídos — los rellené abajo
                      </p>
                    )}
                  </div>

                  {/* Crear nuevo */}
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 text-sm font-medium text-brand-green transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Crear nueva persona en el catálogo
                    {query && <span className="text-xs text-gray-500 font-normal ml-auto">— "{query}"</span>}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Crear nueva persona</p>
                  <button type="button" onClick={() => { setCreating(false); setNewError(null) }}
                    className="text-xs text-gray-400 hover:text-gray-600">
                    ← Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Nombre(s) *" className={inputCls} autoFocus />
                  <input type="text" value={newApellidos} onChange={e => setNewApellidos(e.target.value)}
                    placeholder="Apellidos *" className={inputCls} />
                </div>
                {newError && <p className="text-xs text-red-600">{newError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setCreating(false)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleCreate}
                    disabled={newSaving || !query.trim() || !newApellidos.trim()}
                    className="text-xs px-3 py-1.5 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 disabled:opacity-50 inline-flex items-center gap-1.5 font-semibold">
                    {newSaving
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Creando…</>
                      : <><UserPlus className="w-3 h-3" /> Crear y usar</>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  💡 Para más datos (CURP, INE, teléfono…) edítalos abajo después de crear.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Campos editables (siempre visibles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre completo" full>
            <input type="text" value={values.nombre} onChange={e => onChange({ nombre: e.target.value })} className={inputCls} placeholder="Nombre completo" />
          </Field>
          {showCurp && (
            <Field label="CURP">
              <input type="text" value={values.curp} onChange={e => onChange({ curp: e.target.value })} className={inputCls} placeholder="18 caracteres" maxLength={18} />
            </Field>
          )}
          <Field label="Número de INE (MRZ reverso)">
            <input type="text" value={values.numero_ine} onChange={e => onChange({ numero_ine: e.target.value })} className={inputCls} placeholder="12 dígitos del reverso" />
          </Field>
          <Field label="Teléfono">
            <input type="text" value={values.telefono} onChange={e => onChange({ telefono: e.target.value })} className={inputCls} placeholder="10 dígitos" />
          </Field>
          <Field label="Correo electrónico">
            <input type="email" value={values.correo} onChange={e => onChange({ correo: e.target.value })} className={inputCls} placeholder="correo@ejemplo.com" />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InfoComplementariaForm({
  expedienteId,
  cliente,
  testigo1: initialTestigo1,
  testigo2: initialTestigo2,
  testigos,
  correoCfe: initialCorreoCfe,
  readOnly = false,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [testigo1, setTestigo1] = useState<TestigoInfo | null>(initialTestigo1 ?? null)
  const [testigo2, setTestigo2] = useState<TestigoInfo | null>(initialTestigo2 ?? null)
  const [savingT, setSavingT] = useState<1 | 2 | null>(null)

  // Lista local de testigos: empieza con la del padre y se actualiza cuando se crean nuevos
  const [testigosLocal, setTestigosLocal] = useState<TestigoInfo[]>(testigos)
  useEffect(() => { setTestigosLocal(testigos) }, [testigos])

  useEffect(() => { setTestigo1(initialTestigo1 ?? null) }, [initialTestigo1])
  useEffect(() => { setTestigo2(initialTestigo2 ?? null) }, [initialTestigo2])

  const mkForm = (c?: ClienteComplementario | null) => ({
    representante:   c?.representante   ?? '',
    figura_juridica: c?.figura_juridica ?? '',
    firmante: {
      nombre:    c?.firmante_nombre    ?? c?.nombre ?? '',
      curp:      c?.firmante_curp      ?? '',
      numero_ine: c?.firmante_numero_ine ?? '',
      telefono:  c?.firmante_telefono  ?? '',
      correo:    c?.firmante_correo    ?? '',
    } as PersonaValues,
    atiende: {
      nombre:    c?.atiende_nombre    ?? '',
      curp:      '',
      numero_ine: c?.atiende_numero_ine ?? '',
      telefono:  c?.atiende_telefono  ?? '',
      correo:    c?.atiende_correo    ?? '',
    } as PersonaValues,
  })

  const [form, setForm] = useState(mkForm(cliente))
  // Sincroniza desde el padre cuando cambia el cliente, pero solo si no estamos guardando
  useEffect(() => {
    if (saveStatus !== 'saving') setForm(mkForm(cliente))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  // Auto-guardado con debounce
  const dirtyRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  async function doSave(currentForm: typeof form) {
    if (readOnly) return
    setSaveStatus('saving')
    setError(null)
    try {
      let clienteId = cliente?.id ?? null

      // Si no hay cliente vinculado, crear uno y vincularlo al expediente
      if (!clienteId) {
        const nombre = currentForm.firmante.nombre || currentForm.atiende.nombre || 'Sin nombre'
        const crearRes = await fetch('/api/clientes/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre }),
        })
        const crearData = await crearRes.json()
        if (!crearRes.ok) throw new Error(crearData.error ?? 'Error al crear cliente')
        clienteId = crearData.id

        await fetch('/api/expedientes/guardar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expediente_id: expedienteId, cliente_id: clienteId }),
        })
      }

      const body = {
        id:                  clienteId,
        representante:       currentForm.representante       || null,
        figura_juridica:     currentForm.figura_juridica     || null,
        firmante_nombre:     currentForm.firmante.nombre     || null,
        firmante_curp:       currentForm.firmante.curp       || null,
        firmante_numero_ine: currentForm.firmante.numero_ine || null,
        firmante_telefono:   currentForm.firmante.telefono   || null,
        firmante_correo:     currentForm.firmante.correo     || null,
        atiende_nombre:      currentForm.atiende.nombre      || null,
        atiende_numero_ine:  currentForm.atiende.numero_ine  || null,
        atiende_telefono:    currentForm.atiende.telefono    || null,
        atiende_correo:      currentForm.atiende.correo      || null,
      }
      const res = await fetch('/api/clientes/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      setSaveStatus('saved')
      router.refresh()
      // Volver a 'idle' después de 2 segundos
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
    } catch (err: any) {
      setError(err.message)
      setSaveStatus('error')
    }
  }

  // Disparar auto-save cuando cambia form
  useEffect(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true   // primera vez es la inicialización, no guardar
      return
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      doSave(form)
    }, 1500)   // 1.5s después de la última edición
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(form)])

  async function handleTestigoChange(orden: 1 | 2, testigo: TestigoInfo | null) {
    setSavingT(orden)
    setError(null)
    try {
      const res = await fetch('/api/expedientes/testigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId, orden, testigo_id: testigo?.id ?? null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al asignar testigo')
        return
      }
      if (orden === 1) setTestigo1(testigo)
      else setTestigo2(testigo)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingT(null)
    }
  }

  // Cuando el picker crea un testigo nuevo, lo agregamos a la lista local
  function handleTestigoCreated(t: TestigoInfo) {
    setTestigosLocal(prev => {
      if (prev.find(x => x.id === t.id)) return prev
      return [t, ...prev]
    })
  }

  const testigoNombre = (t: TestigoInfo) =>
    `${t.nombre}${t.apellidos ? ' ' + t.apellidos : ''}`

  // ── Correo CFE — vive en `expedientes.correo_cfe`, no en `clientes` ──────
  // Se persiste con su propio PATCH (independiente del autosave del cliente)
  // porque cada expediente puede tener un correo CFE distinto.
  const [correoCfe, setCorreoCfe] = useState<string>(initialCorreoCfe ?? '')
  const [correoCfeStatus, setCorreoCfeStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const correoCfeDirtyRef = useRef(false)
  const correoCfeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { setCorreoCfe(initialCorreoCfe ?? '') }, [initialCorreoCfe])

  async function saveCorreoCfe(valor: string) {
    if (readOnly) return
    setCorreoCfeStatus('saving')
    try {
      const res = await fetch('/api/expedientes/guardar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expedienteId,
          correo_cfe: valor.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Error al guardar')
      }
      setCorreoCfeStatus('saved')
      router.refresh()
      setTimeout(() => setCorreoCfeStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
    } catch (err: any) {
      setError(err.message)
      setCorreoCfeStatus('error')
    }
  }

  useEffect(() => {
    if (!correoCfeDirtyRef.current) {
      correoCfeDirtyRef.current = true
      return
    }
    if (correoCfeTimeoutRef.current) clearTimeout(correoCfeTimeoutRef.current)
    correoCfeTimeoutRef.current = setTimeout(() => {
      saveCorreoCfe(correoCfe)
    }, 1500)
    return () => {
      if (correoCfeTimeoutRef.current) clearTimeout(correoCfeTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correoCfe])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Indicador de auto-guardado */}
      <div className="flex justify-end items-center gap-2 mb-4 h-5">
        {saveStatus === 'saving' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Guardando…
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            Guardado
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            Error al guardar
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">

        <PersonaEditor
          title="Firmante del contrato / acta"
          values={form.firmante}
          onChange={partial => setForm(f => ({ ...f, firmante: { ...f.firmante, ...partial } }))}
          testigos={testigosLocal}
          onCatalogAdd={handleTestigoCreated}
          showCurp
        />

        <PersonaEditor
          title="Persona que atiende la visita"
          values={form.atiende}
          onChange={partial => setForm(f => ({ ...f, atiende: { ...f.atiende, ...partial } }))}
          testigos={testigosLocal}
          onCatalogAdd={handleTestigoCreated}
        />

        {/* Representación legal */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600">Representación legal (si aplica)</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre del representante" full>
              <input type="text" value={form.representante} onChange={e => setForm(f => ({ ...f, representante: e.target.value }))} className={inputCls} placeholder="Nombre completo" disabled={readOnly} />
            </Field>
            <Field label="Figura jurídica">
              <select value={form.figura_juridica} onChange={e => setForm(f => ({ ...f, figura_juridica: e.target.value }))} className={selectCls} disabled={readOnly}>
                <option value="">— Sin especificar —</option>
                <option value="propietario">Propietario</option>
                <option value="representante_legal">Representante Legal</option>
                <option value="gestor">Gestor</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Testigos */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600">Testigos</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TestigoPicker
              label="Testigo 1"
              value={testigo1}
              testigos={testigosLocal}
              onChange={t => handleTestigoChange(1, t)}
              onCreate={handleTestigoCreated}
              disabled={readOnly}
              saving={savingT === 1}
            />
            <TestigoPicker
              label="Testigo 2"
              value={testigo2}
              testigos={testigosLocal}
              onChange={t => handleTestigoChange(2, t)}
              onCreate={handleTestigoCreated}
              disabled={readOnly}
              saving={savingT === 2}
            />
          </div>
        </div>

        {/* Correo CFE — al cual se enviará el certificado */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600">
              Correo CFE — destinatario del certificado
            </span>
            {correoCfeStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Guardando…
              </span>
            )}
            {correoCfeStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Guardado
              </span>
            )}
          </div>
          <div className="p-4">
            <input
              type="email"
              value={correoCfe}
              onChange={e => setCorreoCfe(e.target.value)}
              disabled={readOnly}
              placeholder="contacto-zona@cfe.mx"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Editable por inspector y cliente. Si cambia el contacto en CFE, actualiza aquí
              y los próximos envíos se harán al nuevo correo.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
