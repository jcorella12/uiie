'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building2, Info, ChevronDown, Briefcase, Store } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
]

const FIGURA_INFO: Record<string, string> = {
  representante_legal: "En contrato: 'en su carácter de representante legal'",
  gestor: "En contrato: 'en su carácter de gestor'",
  propietario: "En contrato: 'en su carácter de propietario'",
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoPersona = 'fisica' | 'moral'
type FiguraJuridica = 'representante_legal' | 'gestor' | 'propietario' | ''

interface InspectorOpcion {
  id: string
  nombre: string
  apellidos: string | null
}

interface ClienteFormProps {
  modo: 'crear' | 'editar'
  cliente?: any
  /** Lista de inspectores asignables. Pasa esto solo si el usuario actual
   *  tiene permisos para reasignar (admin / inspector_responsable). */
  inspectores?: InspectorOpcion[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6 pb-2 border-b border-gray-100 first:mt-0">
      {children}
    </h3>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function PersonSubForm({
  prefix,
  values,
  onChange,
}: {
  prefix: string
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <Field label="Nombre completo" required>
        <input
          type="text"
          value={values[`${prefix}_nombre`] ?? ''}
          onChange={(e) => onChange(`${prefix}_nombre`, e.target.value)}
          className="input-field"
          placeholder="Nombre tal como aparece en INE"
        />
      </Field>
      <Field label="CURP">
        <input
          type="text"
          value={values[`${prefix}_curp`] ?? ''}
          onChange={(e) => onChange(`${prefix}_curp`, e.target.value.toUpperCase())}
          className="input-field font-mono"
          placeholder="ABCD123456HXXXXX00"
          maxLength={18}
        />
      </Field>
      <Field label="Número de INE">
        <input
          type="text"
          value={values[`${prefix}_numero_ine`] ?? ''}
          onChange={(e) => onChange(`${prefix}_numero_ine`, e.target.value)}
          className="input-field"
          placeholder="Clave de elector"
        />
      </Field>
      <Field label="Teléfono">
        <input
          type="tel"
          value={values[`${prefix}_telefono`] ?? ''}
          onChange={(e) => onChange(`${prefix}_telefono`, e.target.value)}
          className="input-field"
          placeholder="10 dígitos"
        />
      </Field>
      <Field label="Correo electrónico" hint="Para notificaciones relacionadas con el trámite">
        <input
          type="email"
          value={values[`${prefix}_correo`] ?? ''}
          onChange={(e) => onChange(`${prefix}_correo`, e.target.value)}
          className="input-field sm:col-span-2"
          placeholder="correo@ejemplo.com"
        />
      </Field>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClienteForm({ modo, cliente, inspectores }: ClienteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [inspectorId, setInspectorId] = useState<string>(cliente?.inspector_id ?? '')

  // ── Form state ──
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>(
    cliente?.tipo_persona ?? 'fisica'
  )
  const [figuraJuridica, setFiguraJuridica] = useState<FiguraJuridica>(
    cliente?.figura_juridica ?? ''
  )
  const [firmanteMismo, setFirmanteMismo] = useState<boolean>(
    cliente?.firmante_mismo !== false
  )
  const [atiendeMismo, setAtiendeMismo] = useState<boolean>(
    cliente?.atiende_mismo !== false
  )
  const [error, setError] = useState<string | null>(null)

  // Generic field values
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    nombre: cliente?.nombre ?? '',
    nombre_comercial: cliente?.nombre_comercial ?? '',
    rfc: cliente?.rfc ?? '',
    curp: cliente?.curp ?? '',
    representante: cliente?.representante ?? '',
    email: cliente?.email ?? '',
    telefono: cliente?.telefono ?? '',
    direccion: cliente?.direccion ?? '',
    numero_exterior: cliente?.numero_exterior ?? '',
    numero_interior: cliente?.numero_interior ?? '',
    colonia: cliente?.colonia ?? '',
    cp: cliente?.cp ?? '',
    ciudad: cliente?.ciudad ?? '',
    municipio: cliente?.municipio ?? '',
    estado: cliente?.estado ?? '',
    correo_cfe: cliente?.correo_cfe ?? '',
    notas: cliente?.notas ?? '',
    // Firmante
    firmante_nombre: cliente?.firmante_nombre ?? '',
    firmante_curp: cliente?.firmante_curp ?? '',
    firmante_numero_ine: cliente?.firmante_numero_ine ?? '',
    firmante_telefono: cliente?.firmante_telefono ?? '',
    firmante_correo: cliente?.firmante_correo ?? '',
    // Atiende
    atiende_nombre: cliente?.atiende_nombre ?? '',
    atiende_curp: cliente?.atiende_curp ?? '',
    atiende_numero_ine: cliente?.atiende_numero_ine ?? '',
    atiende_telefono: cliente?.atiende_telefono ?? '',
    atiende_correo: cliente?.atiende_correo ?? '',
  }))

  // Default true — casi siempre es un EPC/integrador quien contrata a CIAE
  const [esEpc, setEsEpc] = useState<boolean>(cliente?.es_epc ?? true)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const body: Record<string, any> = {
      ...fields,
      tipo_persona: tipoPersona,
      figura_juridica: tipoPersona === 'moral' ? figuraJuridica : null,
      es_epc: esEpc,
      firmante_mismo: firmanteMismo,
      // Solo enviamos inspector_id cuando el form fue renderizado con la
      // lista (admin/responsable). Para otros roles el server lo descarta.
      ...(inspectores ? { inspector_id: inspectorId || null } : {}),
      atiende_mismo: atiendeMismo,
    }

    // Clear irrelevant fields
    if (tipoPersona === 'fisica') {
      body.nombre_comercial = null
      body.representante = null
      body.figura_juridica = null
    } else {
      body.curp = null
    }

    if (firmanteMismo) {
      body.firmante_nombre = null
      body.firmante_curp = null
      body.firmante_numero_ine = null
      body.firmante_telefono = null
      body.firmante_correo = null
    }

    if (atiendeMismo) {
      body.atiende_nombre = null
      body.atiende_curp = null
      body.atiende_numero_ine = null
      body.atiende_telefono = null
      body.atiende_correo = null
    }

    if (modo === 'editar' && cliente?.id) {
      body.id = cliente.id
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/clientes/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Ocurrió un error al guardar el cliente.')
          return
        }

        if (modo === 'crear') {
          router.push(`/dashboard/inspector/clientes/${data.id}`)
        } else {
          router.refresh()
        }
      } catch (err) {
        setError('Error de conexión. Intenta de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">

      {/* ── Sección 0: Tipo de cliente ── */}
      <SectionTitle>Tipo de cliente</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {/* EPC / Integrador */}
        <label className={`flex items-start gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all select-none ${
          esEpc
            ? 'border-brand-green bg-brand-green-light'
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          <input
            type="radio"
            name="es_epc"
            checked={esEpc}
            onChange={() => setEsEpc(true)}
            className="sr-only"
          />
          <Briefcase className={`w-5 h-5 mt-0.5 shrink-0 ${esEpc ? 'text-brand-green' : 'text-gray-400'}`} />
          <div>
            <p className={`font-semibold text-sm ${esEpc ? 'text-brand-green' : 'text-gray-700'}`}>
              EPC / Integrador
              <span className="ml-2 text-[10px] font-normal bg-brand-green text-white rounded-full px-2 py-0.5">más común</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-normal">
              Empresa que contrata a CIAE directamente (Greenlux, Dicoma, Coronel, Powen…)
            </p>
          </div>
        </label>

        {/* Cliente final / propietario */}
        <label className={`flex items-start gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all select-none ${
          !esEpc
            ? 'border-brand-green bg-brand-green-light'
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          <input
            type="radio"
            name="es_epc"
            checked={!esEpc}
            onChange={() => setEsEpc(false)}
            className="sr-only"
          />
          <Store className={`w-5 h-5 mt-0.5 shrink-0 ${!esEpc ? 'text-brand-green' : 'text-gray-400'}`} />
          <div>
            <p className={`font-semibold text-sm ${!esEpc ? 'text-brand-green' : 'text-gray-700'}`}>
              Cliente por su cuenta
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-normal">
              Contrata a CIAE directamente sin pasar por un integrador
            </p>
          </div>
        </label>
      </div>

      {/* ══════════════════════════════════════════════════════
           FORM EPC — corto y operativo
          ══════════════════════════════════════════════════════ */}
      {esEpc ? (
        <>
          <SectionTitle>Datos generales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Razón social / Nombre" required>
              <input
                type="text"
                value={fields.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                className="input-field"
                placeholder="Ej. Greenlux Solar S.A. de C.V."
                required
              />
            </Field>

            <Field label="Nombre comercial" hint="Opcional">
              <input
                type="text"
                value={fields.nombre_comercial}
                onChange={(e) => setField('nombre_comercial', e.target.value)}
                className="input-field"
                placeholder="Ej. Greenlux"
              />
            </Field>

            <Field label="RFC" hint="Para facturación">
              <input
                type="text"
                value={fields.rfc}
                onChange={(e) => setField('rfc', e.target.value.toUpperCase())}
                className="input-field font-mono"
                placeholder="ABC123456XYZ"
                maxLength={13}
              />
            </Field>

            <Field label="Ciudad">
              <input
                type="text"
                value={fields.ciudad}
                onChange={(e) => setField('ciudad', e.target.value)}
                className="input-field"
                placeholder="Ciudad"
              />
            </Field>

            <Field label="Estado">
              <div className="relative">
                <select
                  value={fields.estado}
                  onChange={(e) => setField('estado', e.target.value)}
                  className="input-field appearance-none pr-9"
                >
                  <option value="">Selecciona un estado...</option>
                  {ESTADOS_MX.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
          </div>

          <SectionTitle>Contacto</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del contacto">
              <input
                type="text"
                value={fields.representante}
                onChange={(e) => setField('representante', e.target.value)}
                className="input-field"
                placeholder="Persona de contacto principal"
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                value={fields.email}
                onChange={(e) => setField('email', e.target.value)}
                className="input-field"
                placeholder="contacto@empresa.com"
              />
            </Field>

            <Field label="Teléfono">
              <input
                type="tel"
                value={fields.telefono}
                onChange={(e) => setField('telefono', e.target.value)}
                className="input-field"
                placeholder="10 dígitos"
              />
            </Field>
          </div>

          <SectionTitle>Notas</SectionTitle>
          <Field label="Notas internas" hint="Opcional">
            <textarea
              value={fields.notas}
              onChange={(e) => setField('notas', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Observaciones o datos útiles..."
            />
          </Field>
        </>
      ) : (

      /* ══════════════════════════════════════════════════════
           FORM CLIENTE FINAL — completo (para inspecciones)
          ══════════════════════════════════════════════════════ */
        <>
          <SectionTitle>Datos Generales</SectionTitle>

          {/* Tipo persona */}
          <div className="mb-4">
            <label className="label">Tipo de persona <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {(['fisica', 'moral'] as TipoPersona[]).map((tipo) => (
                <label
                  key={tipo}
                  className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all select-none ${
                    tipoPersona === tipo
                      ? 'border-brand-green bg-brand-green-light text-brand-green'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input type="radio" name="tipo_persona" value={tipo} checked={tipoPersona === tipo} onChange={() => setTipoPersona(tipo)} className="sr-only" />
                  {tipo === 'fisica'
                    ? <User className={`w-5 h-5 shrink-0 ${tipoPersona === tipo ? 'text-brand-green' : 'text-gray-400'}`} />
                    : <Building2 className={`w-5 h-5 shrink-0 ${tipoPersona === tipo ? 'text-brand-green' : 'text-gray-400'}`} />}
                  <div>
                    <p className="font-semibold text-sm">{tipo === 'fisica' ? 'Persona Física' : 'Persona Moral'}</p>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">{tipo === 'fisica' ? 'Tiene CURP propio' : 'Empresa o sociedad'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={tipoPersona === 'fisica' ? 'Nombre completo' : 'Razón social'} required>
              <input type="text" value={fields.nombre} onChange={(e) => setField('nombre', e.target.value)} className="input-field" placeholder={tipoPersona === 'fisica' ? 'Nombre como aparece en INE' : 'Razón social completa'} required />
            </Field>

            {tipoPersona === 'moral' && (
              <Field label="Nombre comercial" hint="Opcional">
                <input type="text" value={fields.nombre_comercial} onChange={(e) => setField('nombre_comercial', e.target.value)} className="input-field" placeholder="Ej. Walmart" />
              </Field>
            )}

            <Field label="RFC" required>
              <input type="text" value={fields.rfc} onChange={(e) => setField('rfc', e.target.value.toUpperCase())} className="input-field font-mono" placeholder={tipoPersona === 'fisica' ? 'ABCD123456XYZ' : 'ABC123456XYZ'} maxLength={13} required />
            </Field>

            {tipoPersona === 'fisica' && (
              <Field label="CURP">
                <input type="text" value={fields.curp} onChange={(e) => setField('curp', e.target.value.toUpperCase())} className="input-field font-mono" placeholder="ABCD123456HXXXXX00" maxLength={18} />
              </Field>
            )}
          </div>

          {tipoPersona === 'moral' && (
            <>
              <SectionTitle>Representante</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre del representante" required>
                  <input type="text" value={fields.representante} onChange={(e) => setField('representante', e.target.value)} className="input-field" placeholder="Nombre completo del representante" />
                </Field>
                <Field label="Figura jurídica" required>
                  <div className="relative">
                    <select value={figuraJuridica} onChange={(e) => setFiguraJuridica(e.target.value as FiguraJuridica)} className="input-field appearance-none pr-9">
                      <option value="">Selecciona una figura...</option>
                      <option value="representante_legal">Representante Legal</option>
                      <option value="gestor">Gestor del Trámite</option>
                      <option value="propietario">Propietario</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
                {figuraJuridica && FIGURA_INFO[figuraJuridica] && (
                  <div className="sm:col-span-2 flex items-start gap-2 p-3 bg-brand-green-light rounded-lg border border-brand-green/20">
                    <Info className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-green italic">{FIGURA_INFO[figuraJuridica]}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <SectionTitle>Contacto y Dirección</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Correo electrónico">
              <input type="email" value={fields.email} onChange={(e) => setField('email', e.target.value)} className="input-field" placeholder="contacto@empresa.com" />
            </Field>
            <Field label="Teléfono">
              <input type="tel" value={fields.telefono} onChange={(e) => setField('telefono', e.target.value)} className="input-field" placeholder="10 dígitos" />
            </Field>
            <Field label="Calle / Avenida">
              <input type="text" value={fields.direccion} onChange={(e) => setField('direccion', e.target.value)} className="input-field" placeholder="Nombre de la calle" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Núm. exterior">
                <input type="text" value={fields.numero_exterior} onChange={(e) => setField('numero_exterior', e.target.value)} className="input-field" placeholder="123" />
              </Field>
              <Field label="Núm. interior">
                <input type="text" value={fields.numero_interior} onChange={(e) => setField('numero_interior', e.target.value)} className="input-field" placeholder="A" />
              </Field>
            </div>
            <Field label="Colonia">
              <input type="text" value={fields.colonia} onChange={(e) => setField('colonia', e.target.value)} className="input-field" placeholder="Nombre de la colonia" />
            </Field>
            <Field label="Código Postal">
              <input type="text" value={fields.cp} onChange={(e) => setField('cp', e.target.value)} className="input-field" placeholder="12345" maxLength={5} />
            </Field>
            <Field label="Ciudad">
              <input type="text" value={fields.ciudad} onChange={(e) => setField('ciudad', e.target.value)} className="input-field" placeholder="Ciudad" />
            </Field>
            <Field label="Municipio">
              <input type="text" value={fields.municipio} onChange={(e) => setField('municipio', e.target.value)} className="input-field" placeholder="Municipio" />
            </Field>
            <Field label="Estado">
              <div className="relative">
                <select value={fields.estado} onChange={(e) => setField('estado', e.target.value)} className="input-field appearance-none pr-9">
                  <option value="">Selecciona un estado...</option>
                  {ESTADOS_MX.map((est) => <option key={est} value={est}>{est}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Correo CFE" hint="Puede ser diferente al correo de contacto">
              <input type="email" value={fields.correo_cfe} onChange={(e) => setField('correo_cfe', e.target.value)} className="input-field" placeholder="correo-cfe@ejemplo.com" />
            </Field>
          </div>

          <SectionTitle>Quien Firma el Contrato</SectionTitle>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={firmanteMismo} onChange={(e) => setFirmanteMismo(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">La misma persona que el solicitante firma el contrato</span>
          </label>
          {!firmanteMismo && <PersonSubForm prefix="firmante" values={fields} onChange={setField} />}

          <SectionTitle>Quien Atiende la Visita</SectionTitle>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={atiendeMismo} onChange={(e) => setAtiendeMismo(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">La misma persona que firma atiende la visita</span>
          </label>
          {!atiendeMismo && <PersonSubForm prefix="atiende" values={fields} onChange={setField} />}

          <SectionTitle>Notas</SectionTitle>
          <Field label="Notas internas" hint="Opcional — información adicional para el inspector">
            <textarea value={fields.notas} onChange={(e) => setField('notas', e.target.value)} className="input-field resize-none" rows={3} placeholder="Observaciones, aclaraciones o cualquier dato relevante..." />
          </Field>

          {inspectores && (
            <>
              <SectionTitle>Inspector responsable</SectionTitle>
              <Field
                label="Inspector vinculado"
                hint="Solo admin / inspector responsable puede reasignar. El inspector elegido verá este cliente en su catálogo. Deja en blanco para mantenerlo sin asignar."
              >
                <select
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  className="input-field"
                >
                  <option value="">— Sin asignar —</option>
                  {inspectores.map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {[insp.nombre, insp.apellidos].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </>
      )}

      {/* ── Error message ── */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-500 text-sm font-medium">Error:</span>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="pt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending
            ? modo === 'crear' ? 'Guardando...' : 'Actualizando...'
            : modo === 'crear' ? 'Crear cliente' : 'Guardar cambios'}
        </button>
        {modo === 'crear' && (
          <a
            href="/dashboard/inspector/clientes"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </a>
        )}
      </div>
    </form>
  )
}
