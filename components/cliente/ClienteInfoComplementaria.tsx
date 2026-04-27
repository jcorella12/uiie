'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  PenLine, BookUser, ScanLine,
  Loader2, CheckCircle2, AlertTriangle, Save,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ParticipantePrevio {
  id: string
  nombre: string
  apellidos?: string | null
  curp?: string | null
  clave_elector?: string | null
  numero_ine?: string | null
  telefono?: string | null
  email?: string | null
}

interface ClienteData {
  id?: string | null
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
  clienteId?: string | null
  cliente?: ClienteData | null
  participantesPrevios?: ParticipantePrevio[]
  isLocked?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PersonaMode = 'manual' | 'anterior' | 'ine'

interface PersonaValues {
  nombre: string
  curp: string
  numero_ine: string
  telefono: string
  correo: string
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function PersonaEditor({
  title,
  values,
  onChange,
  participantesPrevios,
}: {
  title: string
  values: PersonaValues
  onChange: (v: Partial<PersonaValues>) => void
  participantesPrevios: ParticipantePrevio[]
}) {
  const [mode, setMode] = useState<PersonaMode>('manual')
  const [ineFile, setIneFile] = useState<File | null>(null)
  const [ineLoading, setIneLoading] = useState(false)
  const [ineError, setIneError] = useState<string | null>(null)
  const [ineOk, setIneOk] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TABS: { id: PersonaMode; label: string; Icon: React.ElementType; hidden?: boolean }[] = [
    { id: 'manual',   label: 'Escribir',       Icon: PenLine   },
    { id: 'anterior', label: 'Usar anterior',   Icon: BookUser, hidden: participantesPrevios.length === 0 },
    { id: 'ine',      label: 'Subir INE',      Icon: ScanLine  },
  ]

  function handleSelect(id: string) {
    const p = participantesPrevios.find(p => p.id === id)
    if (!p) return
    onChange({
      nombre:     `${p.nombre}${p.apellidos ? ' ' + p.apellidos : ''}`,
      curp:       p.curp ?? '',
      numero_ine: p.clave_elector ?? p.numero_ine ?? '',
      telefono:   p.telefono ?? '',
      correo:     p.email ?? '',
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
      if (!res.ok) throw new Error(data.error ?? 'Error al leer la INE')
      const p = (data.participantes ?? data.participants)?.[0]
      if (!p) throw new Error('No se pudo extraer información de la INE')

      const nombreCompleto = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim()
      onChange({
        nombre:     nombreCompleto,
        curp:       p.curp ?? '',
        numero_ine: p.clave_elector ?? p.numero_ine ?? '',
      })

      // Archive to testigos catalog (best-effort)
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
            ocr_domicilio:     p.domicilio || null,
          }),
        }).catch(() => {})
      }

      setIneOk(true)
    } catch (err: any) {
      setIneError(err.message)
    } finally {
      setIneLoading(false)
    }
  }

  const visibleTabs = TABS.filter(t => !t.hidden)

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600">{title}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {visibleTabs.map(({ id, label, Icon }) => (
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

        {/* Modo anterior */}
        {mode === 'anterior' && (
          <select
            className={inputCls}
            defaultValue=""
            onChange={e => handleSelect(e.target.value)}
          >
            <option value="" disabled>Seleccionar persona anterior…</option>
            {participantesPrevios.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}{p.apellidos ? ' ' + p.apellidos : ''}
                {p.clave_elector ? ` — ${p.clave_elector}` : p.numero_ine ? ` — ${p.numero_ine}` : ''}
              </option>
            ))}
          </select>
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
                {ineFile ? ineFile.name : 'Seleccionar foto o PDF de la INE…'}
              </button>
              <button
                type="button"
                onClick={handleINE}
                disabled={!ineFile || ineLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {ineLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Leyendo…</>
                  : <><ScanLine className="w-3.5 h-3.5" /> Leer INE</>
                }
              </button>
            </div>
            {ineError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{ineError}
              </p>
            )}
            {ineOk && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />Datos extraídos — verifica y ajusta si es necesario
              </p>
            )}
          </div>
        )}

        {/* Campos (siempre visibles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre completo">
            <input type="text" value={values.nombre} onChange={e => onChange({ nombre: e.target.value })} className={inputCls} placeholder="Nombre completo" />
          </Field>
          <Field label="CURP">
            <input type="text" value={values.curp} onChange={e => onChange({ curp: e.target.value })} className={inputCls} placeholder="18 caracteres" maxLength={18} />
          </Field>
          <Field label="Clave de elector / No. INE">
            <input type="text" value={values.numero_ine} onChange={e => onChange({ numero_ine: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input type="text" value={values.telefono} onChange={e => onChange({ telefono: e.target.value })} className={inputCls} placeholder="10 dígitos" />
          </Field>
          <Field label="Correo electrónico">
            <input type="email" value={values.correo} onChange={e => onChange({ correo: e.target.value })} className={inputCls} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function ClienteInfoComplementaria({
  expedienteId,
  clienteId: initialClienteId,
  cliente,
  participantesPrevios = [],
  isLocked = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [firmante, setFirmante] = useState<PersonaValues>({
    nombre:     cliente?.firmante_nombre    ?? '',
    curp:       cliente?.firmante_curp      ?? '',
    numero_ine: cliente?.firmante_numero_ine ?? '',
    telefono:   cliente?.firmante_telefono  ?? '',
    correo:     cliente?.firmante_correo    ?? '',
  })
  const [atiende, setAtiende] = useState<PersonaValues>({
    nombre:     cliente?.atiende_nombre    ?? '',
    curp:       '',
    numero_ine: cliente?.atiende_numero_ine ?? '',
    telefono:   cliente?.atiende_telefono  ?? '',
    correo:     cliente?.atiende_correo    ?? '',
  })

  async function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        let clienteId = initialClienteId ?? null

        if (!clienteId) {
          const nombre = firmante.nombre || atiende.nombre || 'Sin nombre'
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

        const res = await fetch('/api/clientes/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id:                  clienteId,
            firmante_nombre:     firmante.nombre     || null,
            firmante_curp:       firmante.curp       || null,
            firmante_numero_ine: firmante.numero_ine || null,
            firmante_telefono:   firmante.telefono   || null,
            firmante_correo:     firmante.correo     || null,
            atiende_nombre:      atiende.nombre      || null,
            atiende_numero_ine:  atiende.numero_ine  || null,
            atiende_telefono:    atiende.telefono    || null,
            atiende_correo:      atiende.correo      || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
        setSaved(true)
        router.refresh()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-800">Participantes de la Inspección</h2>
        {!isLocked && (
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3 disabled:opacity-50"
          >
            {pending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            Guardar
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Indica quién firmará el acta y quién estará presente durante la visita del inspector.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />Información guardada correctamente.
        </div>
      )}

      {isLocked ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
          El expediente ya no puede ser modificado.
        </p>
      ) : (
        <div className="space-y-4">
          <PersonaEditor
            title="Quien firma el contrato / acta"
            values={firmante}
            onChange={p => setFirmante(f => ({ ...f, ...p }))}
            participantesPrevios={participantesPrevios}
          />
          <PersonaEditor
            title="Quien atiende la visita"
            values={atiende}
            onChange={p => setAtiende(a => ({ ...a, ...p }))}
            participantesPrevios={participantesPrevios}
          />
        </div>
      )}
    </div>
  )
}
