'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil, X, Save, Loader2, Users, UserCheck,
  ScanLine, BookUser, PenLine, AlertTriangle, CheckCircle2,
} from 'lucide-react'

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

// ─── Persona fields (campos de una persona con 3 modos de carga) ──────────────

type PersonaMode = 'manual' | 'catalogo' | 'ine'

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
  showCurp = false,
}: {
  title: string
  values: PersonaValues
  onChange: (v: Partial<PersonaValues>) => void
  testigos: TestigoInfo[]
  showCurp?: boolean
}) {
  const [mode, setMode] = useState<PersonaMode>('manual')
  const [ineFile, setIneFile] = useState<File | null>(null)
  const [ineLoading, setIneLoading] = useState(false)
  const [ineError, setIneError] = useState<string | null>(null)
  const [ineOk, setIneOk] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TABS: { id: PersonaMode; label: string; Icon: React.ElementType }[] = [
    { id: 'manual',   label: 'Manual',      Icon: PenLine   },
    { id: 'catalogo', label: 'Del catálogo', Icon: BookUser  },
    { id: 'ine',      label: 'Subir INE',   Icon: ScanLine  },
  ]

  function handleCatalogoSelect(id: string) {
    const t = testigos.find(t => t.id === id)
    if (!t) return
    onChange({
      nombre:    `${t.nombre}${t.apellidos ? ' ' + t.apellidos : ''}`,
      numero_ine: t.numero_ine ?? '',
      telefono:  t.telefono ?? '',
      correo:    t.email ?? '',
    })
  }

  async function handleINE() {
    if (!ineFile) return
    setIneLoading(true)
    setIneError(null)
    setIneOk(false)
    try {
      const fd = new FormData()
      fd.append('ines', ineFile)
      const res  = await fetch('/api/testigos/importar-ines', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al leer INE')
      // API returns `participantes` (not `participants`)
      const p = (data.participantes ?? data.participants)?.[0]
      if (!p) throw new Error('No se pudo extraer información de la INE')

      // p.nombre = first names only, p.apellidos = combined last names
      const nombreCompleto = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim()
      onChange({
        nombre:     nombreCompleto,
        curp:       p.curp ?? '',
        numero_ine: p.numero_ine ?? '',
      })

      // Archive full INE data to testigos catalog (best-effort)
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
        }).catch(() => { /* no-op */ })
      }

      setIneOk(true)
    } catch (err: any) {
      setIneError(err.message)
    } finally {
      setIneLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">{title}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setIneError(null); setIneOk(false) }}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === id
                  ? 'bg-white text-brand-green shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Modo catálogo */}
        {mode === 'catalogo' && (
          <div>
            {testigos.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                No hay personas en el catálogo. Agrega testigos desde administración.
              </p>
            ) : (
              <select
                className={selectCls}
                defaultValue=""
                onChange={e => handleCatalogoSelect(e.target.value)}
              >
                <option value="" disabled>Seleccionar persona del catálogo…</option>
                {testigos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}{t.apellidos ? ' ' + t.apellidos : ''}{t.empresa ? ' · ' + t.empresa : ''}{t.numero_ine ? ' — ' + t.numero_ine : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Modo INE */}
        {mode === 'ine' && (
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setIneFile(f) }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 text-xs px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-green hover:text-brand-green transition-colors truncate"
              >
                {ineFile ? ineFile.name : 'Seleccionar foto / PDF de la INE…'}
              </button>
              <button
                type="button"
                onClick={handleINE}
                disabled={!ineFile || ineLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {ineLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Leyendo…</>
                  : <><ScanLine className="w-3.5 h-3.5" /> Leer INE</>}
              </button>
            </div>
            {ineError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{ineError}
              </p>
            )}
            {ineOk && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />Datos extraídos — revisa y ajusta si es necesario
              </p>
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
  readOnly = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [testigo1, setTestigo1] = useState<TestigoInfo | null>(initialTestigo1 ?? null)
  const [testigo2, setTestigo2] = useState<TestigoInfo | null>(initialTestigo2 ?? null)
  const [savingT, setSavingT] = useState<1 | 2 | null>(null)

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
  useEffect(() => { if (!editing) setForm(mkForm(cliente)) }, [cliente, editing])

  async function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        let clienteId = cliente?.id ?? null

        // If no client linked, create one first then link it to the expediente
        if (!clienteId) {
          const nombre = form.firmante.nombre || form.atiende.nombre || 'Sin nombre'
          const crearRes = await fetch('/api/clientes/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre }),
          })
          const crearData = await crearRes.json()
          if (!crearRes.ok) throw new Error(crearData.error ?? 'Error al crear cliente')
          clienteId = crearData.id

          // Link new client to expediente
          await fetch('/api/expedientes/guardar', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expediente_id: expedienteId, cliente_id: clienteId }),
          })
        }

        const body = {
          id:                  clienteId,
          representante:       form.representante       || null,
          figura_juridica:     form.figura_juridica     || null,
          firmante_nombre:     form.firmante.nombre     || null,
          firmante_curp:       form.firmante.curp       || null,
          firmante_numero_ine: form.firmante.numero_ine || null,
          firmante_telefono:   form.firmante.telefono   || null,
          firmante_correo:     form.firmante.correo     || null,
          atiende_nombre:      form.atiende.nombre      || null,
          atiende_numero_ine:  form.atiende.numero_ine  || null,
          atiende_telefono:    form.atiende.telefono    || null,
          atiende_correo:      form.atiende.correo      || null,
        }
        const res = await fetch('/api/clientes/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
        setEditing(false)
        router.refresh()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  async function handleTestigoChange(orden: 1 | 2, testigo_id: string | null) {
    setSavingT(orden)
    try {
      const res = await fetch('/api/expedientes/testigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expediente_id: expedienteId, orden, testigo_id }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al asignar testigo')
        return
      }
      const found = testigos.find(t => t.id === testigo_id) ?? null
      if (orden === 1) setTestigo1(found)
      else setTestigo2(found)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingT(null)
    }
  }

  const testigoNombre = (t: TestigoInfo) =>
    `${t.nombre}${t.apellidos ? ' ' + t.apellidos : ''}`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={readOnly}
            className="btn-outline flex items-center gap-1.5 text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setForm(mkForm(cliente)); setError(null) }}
              disabled={pending}
              className="btn-outline flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              {pending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
              Guardar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Modo lectura ── */}
      {!editing && (
        <div>
          <SectionTitle>Firmante del contrato / acta</SectionTitle>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Nombre completo"    value={cliente?.firmante_nombre ?? cliente?.nombre} />
            <Row label="CURP"               value={cliente?.firmante_curp} />
            <Row label="Número de INE"      value={cliente?.firmante_numero_ine} />
            <Row label="Teléfono"           value={cliente?.firmante_telefono} />
            <Row label="Correo"             value={cliente?.firmante_correo} />
          </div>

          {(cliente?.representante || cliente?.figura_juridica) && (
            <>
              <SectionTitle>Representación legal</SectionTitle>
              <div className="divide-y divide-gray-50 mb-4">
                <Row label="Nombre del representante" value={cliente?.representante} />
                <Row label="Figura jurídica"          value={cliente?.figura_juridica ? FIGURA_LABELS[cliente.figura_juridica] ?? cliente.figura_juridica : undefined} />
              </div>
            </>
          )}

          <SectionTitle>Persona que atiende la visita</SectionTitle>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Nombre completo" value={cliente?.atiende_nombre} />
            <Row label="Número de INE"  value={cliente?.atiende_numero_ine} />
            <Row label="Teléfono"       value={cliente?.atiende_telefono} />
            <Row label="Correo"         value={cliente?.atiende_correo} />
          </div>

          <SectionTitle>Testigos</SectionTitle>
          <div className="divide-y divide-gray-50 mb-3">
            {[testigo1, testigo2].map((t, i) => (
              <Row
                key={i}
                label={`Testigo ${i + 1}`}
                value={t ? (
                  <span className="flex items-center gap-2 flex-wrap">
                    <UserCheck className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
                    {testigoNombre(t)}
                    {t.numero_ine && <span className="text-xs text-gray-400 font-mono">{t.numero_ine}</span>}
                  </span>
                ) : undefined}
              />
            ))}
          </div>

          {/* Asignación rápida de testigos */}
          {!readOnly && testigos.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([1, 2] as const).map(orden => {
                const current = orden === 1 ? testigo1 : testigo2
                const isSaving = savingT === orden
                return (
                  <div key={orden}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Asignar Testigo {orden}
                      {isSaving && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
                    </label>
                    <select
                      value={current?.id ?? ''}
                      disabled={isSaving}
                      onChange={e => handleTestigoChange(orden, e.target.value || null)}
                      className={selectCls}
                    >
                      <option value="">— Sin asignar —</option>
                      {testigos.map(t => (
                        <option key={t.id} value={t.id}>
                          {testigoNombre(t)}{t.empresa ? ' · ' + t.empresa : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modo edición ── */}
      {editing && (
        <div className="space-y-5">

          <PersonaEditor
            title="Firmante del contrato / acta"
            values={form.firmante}
            onChange={partial => setForm(f => ({ ...f, firmante: { ...f.firmante, ...partial } }))}
            testigos={testigos}
            showCurp
          />

          <PersonaEditor
            title="Persona que atiende la visita"
            values={form.atiende}
            onChange={partial => setForm(f => ({ ...f, atiende: { ...f.atiende, ...partial } }))}
            testigos={testigos}
          />

          {/* Representación legal */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600">Representación legal (si aplica)</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre del representante" full>
                <input type="text" value={form.representante} onChange={e => setForm(f => ({ ...f, representante: e.target.value }))} className={inputCls} placeholder="Nombre completo" />
              </Field>
              <Field label="Figura jurídica">
                <select value={form.figura_juridica} onChange={e => setForm(f => ({ ...f, figura_juridica: e.target.value }))} className={selectCls}>
                  <option value="">— Sin especificar —</option>
                  <option value="propietario">Propietario</option>
                  <option value="representante_legal">Representante Legal</option>
                  <option value="gestor">Gestor</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Testigos — también en edición */}
          {testigos.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-600">Testigos</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([1, 2] as const).map(orden => {
                  const current = orden === 1 ? testigo1 : testigo2
                  const isSaving = savingT === orden
                  return (
                    <Field key={orden} label={`Testigo ${orden}`}>
                      <div className="flex items-center gap-2">
                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green flex-shrink-0" />}
                        <select
                          value={current?.id ?? ''}
                          disabled={isSaving}
                          onChange={e => handleTestigoChange(orden, e.target.value || null)}
                          className={selectCls}
                        >
                          <option value="">— Sin asignar —</option>
                          {testigos.map(t => (
                            <option key={t.id} value={t.id}>
                              {testigoNombre(t)}{t.empresa ? ' · ' + t.empresa : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Field>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
