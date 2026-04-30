'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Save, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Inversor {
  id: string
  marca: string
  modelo: string
  potencia_kw: number
  fase: string
}

interface Cliente {
  nombre?: string
  firmante_nombre?: string
  firmante_correo?: string
  firmante_telefono?: string
  atiende_nombre?: string
  atiende_correo?: string
  atiende_telefono?: string
}

interface ExpedienteInfoFields {
  id: string
  // Cliente final
  nombre_cliente_final?: string
  // Dirección
  direccion_proyecto?: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad?: string
  estado_mx?: string
  // Instalación
  kwp?: number
  num_paneles?: number
  potencia_panel_wp?: number
  inversor_id?: string
  num_inversores?: number
  tipo_conexion?: string
  tipo_central?: string
  // Medidor
  numero_medidor?: string
  numero_serie_medidor?: string
  numero_cfe_medidor?: string
  // Subestación
  capacidad_subestacion_kva?: number | null
  // Protecciones
  tiene_i1_i2?: boolean
  tiene_interruptor_exclusivo?: boolean
  tiene_ccfp?: boolean
  tiene_proteccion_respaldo?: boolean
  // Resolutivo
  resolutivo_folio?: string
  resolutivo_fecha?: string
  resolutivo_tiene_cobro?: boolean
  resolutivo_monto?: number
  resolutivo_referencia?: string
  // Dictamen UVIE
  dictamen_folio_dvnp?: string
  dictamen_uvie_nombre?: string
  // Misc
  observaciones?: string
}

interface Props {
  expediente: ExpedienteInfoFields
  cliente?: Cliente
  inversores: Inversor[]
  readOnly?: boolean
}

// ─── Opciones ─────────────────────────────────────────────────────────────────

const TIPO_CONEXION_OPTS = [
  { value: 'generacion_distribuida', label: 'Generación Distribuida' },
  { value: 'net_metering',           label: 'Net Metering' },
  { value: 'autoconsumo',            label: 'Autoconsumo' },
  { value: 'isla',                   label: 'Sistema Aislado (Isla)' },
  { value: 'interconectado',         label: 'Interconectado a la Red' },
]

const TIPO_CENTRAL_OPTS = [
  { value: 'MT', label: 'Media Tensión (MT)' },
  { value: 'BT', label: 'Baja Tensión (BT)' },
]

// ─── Helper: fila de solo lectura ─────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-48 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words">
        {value ?? <span className="text-gray-400">—</span>}
      </span>
    </div>
  )
}

// ─── Helper: grupo de sección ──────────────────────────────────────────────────

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

// ─── Helper: campo de formulario ─────────────────────────────────────────────

function Field({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green'
const selectCls = inputCls

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InfoTecnicaForm({ expediente, cliente, inversores, readOnly }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Estado del formulario — inicializado con datos actuales
  const mkForm = (e: ExpedienteInfoFields) => ({
    nombre_cliente_final:  e.nombre_cliente_final  ?? '',
    direccion_proyecto:    e.direccion_proyecto    ?? '',
    colonia:               e.colonia               ?? '',
    codigo_postal:         e.codigo_postal         ?? '',
    municipio:             e.municipio             ?? '',
    ciudad:                e.ciudad                ?? '',
    estado_mx:             e.estado_mx             ?? '',
    kwp:                   String(e.kwp            ?? ''),
    num_paneles:           String(e.num_paneles    ?? ''),
    potencia_panel_wp:     String(e.potencia_panel_wp ?? ''),
    inversor_id:           e.inversor_id           ?? '',
    num_inversores:        String(e.num_inversores ?? '1'),
    tipo_conexion:         e.tipo_conexion         ?? 'generacion_distribuida',
    tipo_central:          e.tipo_central          ?? 'MT',
    numero_medidor:        e.numero_medidor        ?? '',
    numero_serie_medidor:  e.numero_serie_medidor  ?? '',
    numero_cfe_medidor:    e.numero_cfe_medidor    ?? '',
    // Subestación
    capacidad_subestacion_kva: String(e.capacidad_subestacion_kva ?? ''),
    // Protecciones
    tiene_i1_i2:               e.tiene_i1_i2               ?? false,
    tiene_interruptor_exclusivo: e.tiene_interruptor_exclusivo ?? false,
    tiene_ccfp:                e.tiene_ccfp                ?? false,
    tiene_proteccion_respaldo: e.tiene_proteccion_respaldo ?? false,
    // Resolutivo
    resolutivo_folio:      e.resolutivo_folio      ?? '',
    resolutivo_fecha:      e.resolutivo_fecha
      ? e.resolutivo_fecha.slice(0, 10)
      : '',
    resolutivo_tiene_cobro: e.resolutivo_tiene_cobro ?? false,
    resolutivo_monto:      String(e.resolutivo_monto ?? ''),
    resolutivo_referencia: e.resolutivo_referencia ?? '',
    dictamen_folio_dvnp:   e.dictamen_folio_dvnp   ?? '',
    dictamen_uvie_nombre:  e.dictamen_uvie_nombre  ?? '',
    observaciones:         e.observaciones         ?? '',
  })

  const [form, setForm] = useState(() => mkForm(expediente))

  useEffect(() => {
    if (!editing) setForm(mkForm(expediente))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expediente])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(prev => ({ ...prev, [field]: val }))
    }
  }

  function handleCancel() {
    setForm(mkForm(expediente))
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          expediente_id: expediente.id,
          ...form,
          // Convertir numéricos
          kwp:               form.kwp               ? parseFloat(form.kwp)               : null,
          num_paneles:       form.num_paneles        ? parseInt(form.num_paneles)         : null,
          potencia_panel_wp: form.potencia_panel_wp  ? parseFloat(form.potencia_panel_wp) : null,
          num_inversores:    form.num_inversores     ? parseInt(form.num_inversores)      : 1,
          resolutivo_monto:  form.resolutivo_monto   ? parseFloat(form.resolutivo_monto)  : null,
          // Subestación
          capacidad_subestacion_kva: form.capacidad_subestacion_kva ? parseFloat(form.capacidad_subestacion_kva) : null,
          // Vacíos a null
          inversor_id:       form.inversor_id        || null,
          resolutivo_fecha:  form.resolutivo_fecha   || null,
          resolutivo_referencia: form.resolutivo_referencia || null,
        }

        const res = await fetch('/api/expedientes/guardar', {
          method: 'PATCH',
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

  // ── Valores de solo lectura ───────────────────────────────────────────────

  const tipoConexionLabel = TIPO_CONEXION_OPTS.find(o => o.value === expediente.tipo_conexion)?.label ?? expediente.tipo_conexion
  const tipoCentralLabel  = TIPO_CENTRAL_OPTS.find(o => o.value === expediente.tipo_central)?.label  ?? expediente.tipo_central
  const inversorActual    = inversores.find(i => i.id === expediente.inversor_id)

  // ── Vista ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Botón editar */}
      <div className="flex justify-end mb-3">
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
              onClick={handleCancel}
              disabled={pending}
              className="btn-outline flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
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
        <div className="space-y-0">
          {/* Cliente final */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-1">Cliente final</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Nombre / Razón social" value={expediente.nombre_cliente_final} />
          </div>

          {/* Dirección */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-1">Dirección del proyecto</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Calle y número"   value={expediente.direccion_proyecto} />
            <Row label="Colonia"          value={expediente.colonia} />
            <Row label="Municipio"        value={expediente.municipio} />
            <Row label="Ciudad"           value={expediente.ciudad} />
            <Row label="Código Postal"    value={expediente.codigo_postal} />
            <Row label="Estado"           value={expediente.estado_mx} />
          </div>

          {/* Instalación */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Instalación</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Potencia (kWp)"       value={expediente.kwp} />
            <Row label="Núm. paneles"          value={expediente.num_paneles} />
            <Row label="Potencia por panel (Wp)" value={expediente.potencia_panel_wp} />
            <Row label="Inversor"             value={inversorActual ? `${inversorActual.marca} ${inversorActual.modelo} · ${inversorActual.potencia_kw} kW · ${inversorActual.fase}` : undefined} />
            <Row label="Núm. inversores"       value={expediente.num_inversores} />
            <Row label="Tipo de conexión"      value={tipoConexionLabel} />
            <Row label="Tipo de central"       value={tipoCentralLabel} />
            <Row label="Número de medidor CFE"      value={expediente.numero_medidor} />
            <Row label="Número de serie medidor"    value={expediente.numero_serie_medidor} />
            <Row label="Código C.F.E. (6 dígitos)"  value={expediente.numero_cfe_medidor} />
          </div>

          {/* Subestación */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subestación eléctrica</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Capacidad del transformador" value={expediente.capacidad_subestacion_kva != null ? `${expediente.capacidad_subestacion_kva} kVA` : undefined} />
          </div>

          {/* Protecciones */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Protecciones</p>
          <div className="divide-y divide-gray-50 mb-4">
            {([
              ['tiene_i1_i2',               'Interruptores I1/I2 instalados'],
              ['tiene_interruptor_exclusivo','Interruptor exclusivo de interconexión'],
              ['tiene_ccfp',               'CCFP / Centro de carga dedicado'],
              ['tiene_proteccion_respaldo', 'Protección de respaldo contra isla'],
            ] as const).map(([field, label]) => (
              <Row key={field} label={label} value={
                expediente[field]
                  ? <span className="inline-flex items-center gap-1 text-green-700 font-medium text-xs">✓ Sí</span>
                  : <span className="text-gray-400 text-xs">No</span>
              } />
            ))}
          </div>

          {/* Resolutivo */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Resolutivo CFE</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Folio del resolutivo" value={expediente.resolutivo_folio} />
            <Row label="Fecha del resolutivo" value={expediente.resolutivo_fecha
              ? new Date(expediente.resolutivo_fecha + 'T12:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined}
            />
            <Row label="¿Tiene cobro?"        value={expediente.resolutivo_tiene_cobro ? 'Sí' : 'No'} />
            {expediente.resolutivo_tiene_cobro && (
              <>
                <Row label="Monto"      value={expediente.resolutivo_monto != null ? `$${expediente.resolutivo_monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : undefined} />
                <Row label="Referencia" value={expediente.resolutivo_referencia} />
              </>
            )}
          </div>

          {/* Dictamen UVIE */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dictamen UVIE</p>
          <div className="divide-y divide-gray-50 mb-4">
            <Row label="Folio / DVNP"     value={expediente.dictamen_folio_dvnp} />
            <Row label="Nombre de la UVIE" value={expediente.dictamen_uvie_nombre} />
          </div>


          {/* Observaciones */}
          {expediente.observaciones && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Observaciones</p>
              <div className="divide-y divide-gray-50">
                <div className="py-2">
                  <span className="text-sm text-gray-800 whitespace-pre-wrap">{expediente.observaciones}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modo edición ── */}
      {editing && (
        <div className="space-y-5">

          {/* Cliente final */}
          <FormGroup title="Cliente final">
            <Field label="Nombre / Razón social" full>
              <input
                type="text"
                value={form.nombre_cliente_final}
                onChange={set('nombre_cliente_final')}
                className={inputCls}
                placeholder="Ej. Walmart México, S.A. de C.V."
              />
            </Field>
          </FormGroup>

          {/* Dirección del proyecto */}
          <FormGroup title="Dirección del proyecto">
            <Field label="Calle y número" full>
              <input type="text" value={form.direccion_proyecto} onChange={set('direccion_proyecto')} className={inputCls} placeholder="Av. Ejemplo 123" />
            </Field>
            <Field label="Colonia">
              <input type="text" value={form.colonia} onChange={set('colonia')} className={inputCls} placeholder="Col. Centro" />
            </Field>
            <Field label="Código Postal">
              <input type="text" value={form.codigo_postal} onChange={set('codigo_postal')} className={inputCls} placeholder="83000" maxLength={5} />
            </Field>
            <Field label="Municipio">
              <input type="text" value={form.municipio} onChange={set('municipio')} className={inputCls} placeholder="Hermosillo" />
            </Field>
            <Field label="Ciudad">
              <input type="text" value={form.ciudad} onChange={set('ciudad')} className={inputCls} placeholder="Hermosillo" />
            </Field>
            <Field label="Estado">
              <input type="text" value={form.estado_mx} onChange={set('estado_mx')} className={inputCls} placeholder="Sonora" />
            </Field>
          </FormGroup>

          {/* Instalación */}
          <FormGroup title="Instalación">
            <Field label="Potencia total (kWp)">
              <input type="number" step="0.01" min="0" value={form.kwp} onChange={set('kwp')} className={inputCls} placeholder="6.5" />
            </Field>
            <Field label="Número de paneles">
              <input type="number" min="0" value={form.num_paneles} onChange={set('num_paneles')} className={inputCls} placeholder="20" />
            </Field>
            <Field label="Potencia por panel (Wp)">
              <input type="number" step="1" min="0" value={form.potencia_panel_wp} onChange={set('potencia_panel_wp')} className={inputCls} placeholder="325" />
            </Field>
            <Field label="Número de inversores">
              <input type="number" min="1" value={form.num_inversores} onChange={set('num_inversores')} className={inputCls} placeholder="1" />
            </Field>
            <Field label="Inversor (catálogo)" full>
              <select value={form.inversor_id} onChange={set('inversor_id')} className={selectCls}>
                <option value="">— Sin seleccionar —</option>
                {inversores.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.marca} {inv.modelo} · {inv.potencia_kw} kW · {inv.fase}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de conexión">
              <select value={form.tipo_conexion} onChange={set('tipo_conexion')} className={selectCls}>
                {TIPO_CONEXION_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de central (esquema)">
              <select value={form.tipo_central} onChange={set('tipo_central')} className={selectCls}>
                {TIPO_CENTRAL_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Número de medidor CFE">
              <input type="text" value={form.numero_medidor} onChange={set('numero_medidor')} className={inputCls} placeholder="12345678" />
            </Field>
            <Field label="Número de serie (medidor)">
              <input type="text" value={form.numero_serie_medidor} onChange={set('numero_serie_medidor')} className={inputCls} placeholder="Núm. serie físico del medidor" />
            </Field>
            <Field label="Código C.F.E. (6 dígitos)">
              <input type="text" value={form.numero_cfe_medidor} onChange={set('numero_cfe_medidor')} className={inputCls} placeholder="ej. A3B2C1" maxLength={10} />
            </Field>
          </FormGroup>

          {/* Subestación */}
          <FormGroup title="Subestación eléctrica">
            <Field label="Capacidad del transformador (kVA)">
              <input type="number" step="0.01" min="0" value={form.capacidad_subestacion_kva} onChange={set('capacidad_subestacion_kva')} className={inputCls} placeholder="150" />
            </Field>
          </FormGroup>

          {/* Protecciones */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Protecciones</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                ['tiene_i1_i2',               'Interruptores I1/I2 instalados'],
                ['tiene_interruptor_exclusivo','Interruptor exclusivo de interconexión'],
                ['tiene_ccfp',               'CCFP / Centro de carga dedicado'],
                ['tiene_proteccion_respaldo', 'Protección de respaldo contra isla'],
              ] as const).map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-gray-200 hover:border-brand-green/40 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form[field] as boolean}
                    onChange={set(field)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Resolutivo CFE */}
          <FormGroup title="Resolutivo CFE">
            <Field label="Folio del resolutivo">
              <input type="text" value={form.resolutivo_folio} onChange={set('resolutivo_folio')} className={inputCls} placeholder="OEDE-123456" />
            </Field>
            <Field label="Fecha del resolutivo">
              <input type="date" value={form.resolutivo_fecha} onChange={set('resolutivo_fecha')} className={inputCls} />
            </Field>
            <Field label="¿Tiene cobro?" full>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={form.resolutivo_tiene_cobro}
                  onChange={set('resolutivo_tiene_cobro')}
                  className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">El resolutivo incluye cobro</span>
              </label>
            </Field>
            {form.resolutivo_tiene_cobro && (
              <>
                <Field label="Monto ($)">
                  <input type="number" step="0.01" min="0" value={form.resolutivo_monto} onChange={set('resolutivo_monto')} className={inputCls} placeholder="0.00" />
                </Field>
                <Field label="Referencia de pago">
                  <input type="text" value={form.resolutivo_referencia} onChange={set('resolutivo_referencia')} className={inputCls} placeholder="Ref. bancaria o folio" />
                </Field>
              </>
            )}
          </FormGroup>

          {/* Dictamen UVIE */}
          <FormGroup title="Dictamen UVIE">
            <Field label="Folio / DVNP">
              <input type="text" value={form.dictamen_folio_dvnp} onChange={set('dictamen_folio_dvnp')} className={inputCls} placeholder="DVNP-XXXX-XXXX" />
            </Field>
            <Field label="Nombre de la UVIE">
              <input type="text" value={form.dictamen_uvie_nombre} onChange={set('dictamen_uvie_nombre')} className={inputCls} placeholder="Nombre de la unidad verificadora" />
            </Field>
          </FormGroup>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
            <textarea
              rows={3}
              value={form.observaciones}
              onChange={set('observaciones')}
              className={`${inputCls} resize-none`}
              placeholder="Notas adicionales del expediente…"
            />
          </div>

        </div>
      )}
    </div>
  )
}
