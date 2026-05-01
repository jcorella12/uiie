'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getPrecioBase, calcularPorcentaje, requiereAutorizacion,
  formatCurrency, getPriceAlertLevel, UMBRAL_AUTORIZACION,
} from '@/lib/pricing'
import { TipoPersona } from '@/lib/types'
import { AlertTriangle, CheckCircle, Info, Loader2, ArrowLeft, Plus, UserCog } from 'lucide-react'
import Link from 'next/link'

interface Props {
  inspectorId: string
  inspectorNombre?: string
  clientes: { id: string; nombre: string }[]
  inspectores?: { id: string; nombre: string; apellidos?: string | null }[]
}

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua',
  'Ciudad de México','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'México','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro',
  'Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas',
]

export default function NuevaSolicitudForm({
  inspectorId, inspectorNombre = 'Yo', clientes, inspectores = [],
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // ── Inspector ejecutor (quien hará la visita física) ──
  // Por defecto = el usuario actual; si delega, cambia
  const [inspectorEjecutorId, setInspectorEjecutorId] = useState(inspectorId)
  const esDelegado = inspectorEjecutorId !== inspectorId
  const ejecutorSeleccionado = inspectores.find(i => i.id === inspectorEjecutorId)
  const [confirmoDelegacion, setConfirmoDelegacion] = useState(false)

  // ── Cliente EPC (quien contrata a CIAE) ──
  const [clienteId, setClienteId] = useState('')
  const [clienteNombreLibre, setClienteNombreLibre] = useState('')

  // ── Propietario del sitio (Walmart, 7-Eleven, etc.) ──
  const [propietarioNombre, setPropietarioNombre] = useState('')

  // ── Instalación ──
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>('moral')
  const [ciudad, setCiudad] = useState('')
  const [estadoMx, setEstadoMx] = useState('')
  const [kwp, setKwp] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')

  // ── Precio ──
  const [precioPropuesto, setPrecioPropuesto] = useState('')
  const [precioBase, setPrecioBase] = useState<number | null>(null)
  const [porcentaje, setPorcentaje] = useState(0)
  const [necesitaAuth, setNecesitaAuth] = useState(false)

  // ── Notas ──
  const [notasInspector, setNotasInspector] = useState('')

  // ── UI ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Nombre efectivo del cliente seleccionado
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId)
  const clienteNombreEfectivo = clienteSeleccionado?.nombre ?? clienteNombreLibre.trim()

  useEffect(() => {
    const kWpNum = parseFloat(kwp)
    const precioNum = parseFloat(precioPropuesto.replace(/,/g, ''))
    if (!isNaN(kWpNum) && kWpNum > 0) {
      const base = getPrecioBase(kWpNum)
      setPrecioBase(base)
      if (base && !isNaN(precioNum) && precioNum > 0) {
        const pct = calcularPorcentaje(base, precioNum)
        setPorcentaje(pct)
        setNecesitaAuth(pct < UMBRAL_AUTORIZACION * 100)
      } else {
        setPorcentaje(0); setNecesitaAuth(false)
      }
    } else {
      setPrecioBase(null); setPorcentaje(0); setNecesitaAuth(false)
    }
  }, [kwp, precioPropuesto])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clienteNombreEfectivo) {
      setError('Selecciona o escribe el nombre del cliente/integrador.')
      setLoading(false)
      return
    }

    // Si está delegando a otro inspector, debe haber confirmado el aviso
    if (esDelegado && !confirmoDelegacion) {
      setError('Confirma que tienes autorización del inspector seleccionado para usar su folio.')
      setLoading(false)
      return
    }

    const kWpNum = parseFloat(kwp)
    const precioNum = parseFloat(precioPropuesto.replace(/,/g, ''))

    if (isNaN(kWpNum) || kWpNum <= 0) { setError('Ingresa un kWp válido.'); setLoading(false); return }
    if (!precioBase) { setError('El kWp está fuera del rango del tabulador (0–499 kWp).'); setLoading(false); return }
    if (isNaN(precioNum) || precioNum <= 0) { setError('Ingresa un precio propuesto válido.'); setLoading(false); return }

    const status = necesitaAuth ? 'en_revision' : 'pendiente'

    const { error: insertError } = await supabase.from('solicitudes_folio').insert({
      inspector_id: inspectorId,
      // Si es la misma persona, dejamos null. Si es otro, guardamos el ejecutor
      inspector_ejecutor_id: esDelegado ? inspectorEjecutorId : null,
      // cliente_nombre ahora guarda el nombre del EPC (quien contrata a CIAE)
      cliente_nombre: clienteNombreEfectivo,
      tipo_persona: tipoPersona,
      ciudad: ciudad.trim(),
      estado_mx: estadoMx || null,
      kwp: kWpNum,
      fecha_estimada: fechaEstimada,
      // EPC vinculado al catálogo de clientes (si se seleccionó del dropdown)
      cliente_epc_id: clienteId || null,
      cliente_epc_nombre: clienteNombreLibre.trim() || null,
      // Propietario del sitio (Walmart, 7-Eleven, etc.)
      propietario_nombre: propietarioNombre.trim() || null,
      precio_propuesto: precioNum,
      precio_base: precioBase,
      porcentaje_precio: porcentaje,
      requiere_autorizacion: necesitaAuth,
      status,
      notas_inspector: notasInspector.trim() || null,
    })

    if (insertError) {
      setError('Error al guardar: ' + insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard/inspector/solicitudes'), 1500)
  }

  const alertLevel = getPriceAlertLevel(porcentaje)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── SECCIÓN 0: Inspector ejecutor de la visita ── */}
      {inspectores.length > 1 && (
        <div className="card space-y-3">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-brand-green" />
            <div>
              <h2 className="font-semibold text-gray-800 text-base">Inspector que realizará la visita</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Por default eres tú. Si otro inspector hará la visita física, selecciónalo aquí.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Solicitante (tú)</label>
              <input
                type="text"
                value={inspectorNombre}
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Inspector que sube documentos y gestiona el expediente</p>
            </div>
            <div>
              <label className="label">Ejecutor de la visita</label>
              <select
                className="input-field"
                value={inspectorEjecutorId}
                onChange={e => { setInspectorEjecutorId(e.target.value); setConfirmoDelegacion(false) }}
              >
                <option value={inspectorId}>{inspectorNombre} (yo)</option>
                {inspectores
                  .filter(i => i.id !== inspectorId)
                  .map(i => (
                    <option key={i.id} value={i.id}>
                      {`${i.nombre} ${i.apellidos ?? ''}`.trim()}
                    </option>
                  ))
                }
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Quien hará la visita física al sitio</p>
            </div>
          </div>

          {/* Alerta de delegación */}
          {esDelegado && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-amber-900">
                    Estás solicitando un folio a nombre de otro inspector
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    El folio quedará registrado a nombre de{' '}
                    <strong>{ejecutorSeleccionado ? `${ejecutorSeleccionado.nombre} ${ejecutorSeleccionado.apellidos ?? ''}`.trim() : '—'}</strong>{' '}
                    como ejecutor. Asegúrate de tener su <strong>autorización y permiso</strong> para usar su folio.
                    El expediente aparecerá en la lista de ambos.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmoDelegacion}
                  onChange={e => setConfirmoDelegacion(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-600"
                />
                <span className="text-xs text-amber-900 font-medium">
                  Confirmo que tengo autorización de{' '}
                  {ejecutorSeleccionado ? ejecutorSeleccionado.nombre : 'este inspector'}{' '}
                  para solicitar el folio en su nombre.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN 1: Cliente / EPC ── */}
      <div className="card space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="font-semibold text-gray-800 text-base">Cliente / Integrador EPC</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            La empresa o persona que contrata a CIAE para la inspección (Greenlux, Dicoma, Coronel…)
          </p>
        </div>

        {/* Dropdown de clientes registrados */}
        <div>
          <label className="label">Seleccionar cliente registrado *</label>
          <select
            className="input-field"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value)
              if (e.target.value) setClienteNombreLibre('')
            }}
          >
            <option value="">— Selecciona un cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* O escribir libremente si no está registrado */}
        {!clienteId && (
          <div>
            <label className="label">O escribir nombre si aún no está registrado</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Nombre del integrador / EPC"
                value={clienteNombreLibre}
                onChange={(e) => setClienteNombreLibre(e.target.value)}
              />
              <Link
                href="/dashboard/inspector/clientes/nuevo"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-green text-brand-green text-sm font-medium hover:bg-brand-green-light transition-colors shrink-0"
                title="Crear cliente nuevo"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Puedes registrar el cliente primero con el botón "Nuevo" y luego seleccionarlo arriba.
            </p>
          </div>
        )}

        {clienteSeleccionado && (
          <div className="flex items-center gap-2 p-3 bg-brand-green-light rounded-lg border border-brand-green/20">
            <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
            <p className="text-sm text-brand-green font-medium">{clienteSeleccionado.nombre}</p>
            <button
              type="button"
              onClick={() => setClienteId('')}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: Cliente Final ── */}
      <div className="card space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="font-semibold text-gray-800 text-base">Cliente Final</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Dueño de la instalación / a quien se emite el certificado (Walmart, 7-Eleven, CFE…). Opcional.
          </p>
        </div>

        <div>
          <label className="label">Tipo de persona</label>
          <div className="flex gap-4">
            {(['fisica', 'moral'] as TipoPersona[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_persona"
                  value={t}
                  checked={tipoPersona === t}
                  onChange={() => setTipoPersona(t)}
                  className="accent-brand-green"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Nombre / Razón social del cliente final</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej. Walmart de México S.A.P.I. de C.V."
            value={propietarioNombre}
            onChange={(e) => setPropietarioNombre(e.target.value)}
          />
        </div>
      </div>

      {/* ── SECCIÓN 3: Instalación ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
          Datos de la Instalación
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ciudad *</label>
            <input type="text" className="input-field" placeholder="Hermosillo"
              value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input-field" value={estadoMx} onChange={(e) => setEstadoMx(e.target.value)}>
              <option value="">Seleccionar…</option>
              {ESTADOS_MX.map((est) => <option key={est} value={est}>{est}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Potencia (kWp) *</label>
            <input type="number" className="input-field" placeholder="0–499"
              min="0" max="499" step="0.01" value={kwp}
              onChange={(e) => setKwp(e.target.value)} required />
          </div>
          <div>
            <label className="label">Fecha estimada de inspección *</label>
            <input type="date" className="input-field" value={fechaEstimada}
              onChange={(e) => setFechaEstimada(e.target.value)}
              required />
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 4: Precio ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
          Precio de Inspección
        </h2>

        {precioBase ? (
          <div className="flex items-center gap-3 bg-brand-green-light border border-brand-green/20 rounded-lg px-4 py-3">
            <Info className="w-4 h-4 text-brand-green flex-shrink-0" />
            <p className="text-sm text-brand-green">
              Precio base para <strong>{kwp} kWp</strong>: <strong>{formatCurrency(precioBase)}</strong>
              {' '}· Mínimo autorizable (70%): <strong>{formatCurrency(precioBase * 0.7)}</strong>
            </p>
          </div>
        ) : kwp ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">El valor de kWp está fuera del tabulador (0–499).</p>
          </div>
        ) : null}

        <div>
          <label className="label">Precio propuesto (sin IVA) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
            <input type="number" className="input-field pl-7" placeholder="0.00"
              min="0" step="100" value={precioPropuesto}
              onChange={(e) => setPrecioPropuesto(e.target.value)} required />
          </div>
        </div>

        {porcentaje > 0 && precioBase && (
          <div className={`rounded-lg px-4 py-3 border flex items-start gap-3 ${
            alertLevel === 'ok' ? 'bg-green-50 border-green-200' :
            alertLevel === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
          }`}>
            {alertLevel === 'ok'
              ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alertLevel === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
            }
            <div>
              <p className={`font-semibold text-sm ${
                alertLevel === 'ok' ? 'text-green-700' :
                alertLevel === 'warning' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {porcentaje.toFixed(1)}% del tabulador
              </p>
              {alertLevel === 'warning' && (
                <p className="text-xs text-yellow-600 mt-0.5">Entre 70% y 100% del tabulador. Se enviará como pendiente.</p>
              )}
              {alertLevel === 'danger' && (
                <p className="text-xs text-red-600 mt-0.5">
                  Por debajo del 70%. <strong>Requiere autorización del Inspector Responsable.</strong>
                </p>
              )}
              {alertLevel === 'ok' && (
                <p className="text-xs text-green-600 mt-0.5">Precio dentro o por encima del tabulador ✓</p>
              )}
              <div className="mt-3 bg-white/60 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="h-3 bg-red-300 rounded-l" style={{ width: '35%' }} />
                  <div className="h-3 bg-yellow-300" style={{ width: '30%' }} />
                  <div className="h-3 bg-green-400 rounded-r" style={{ width: '35%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span><span>70%</span><span>100%</span><span>+</span>
                </div>
                <div className="relative mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                      alertLevel === 'ok' ? 'bg-green-500' :
                      alertLevel === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(porcentaje, 150)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 5: Notas ── */}
      <div className="card">
        <label className="label">Notas adicionales (opcional)</label>
        <textarea className="input-field resize-none" rows={3}
          placeholder="Observaciones, condiciones especiales, etc."
          value={notasInspector} onChange={(e) => setNotasInspector(e.target.value)} />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />Solicitud enviada. Redirigiendo…
        </div>
      )}
      {necesitaAuth && !success && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Se requiere autorización</p>
            <p className="text-xs mt-0.5">Esta solicitud se enviará al Inspector Responsable para aprobación.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/dashboard/inspector/solicitudes" className="btn-outline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Cancelar
        </Link>
        <button type="submit" disabled={loading || success || !precioBase}
          className="btn-primary flex items-center gap-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
          ) : necesitaAuth ? 'Enviar para Autorización' : 'Enviar Solicitud'}
        </button>
      </div>
    </form>
  )
}
