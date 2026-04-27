'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react'

interface Props {
  expediente: any
  userId: string
}

type Resultado = 'aprobado' | 'rechazado' | 'condicionado'

const RESULTADO_OPTIONS: { value: Resultado; label: string }[] = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'condicionado', label: 'Condicionado' },
]

export default function DictamenForm({ expediente, userId }: Props) {
  const router = useRouter()

  const [fechaInspeccion, setFechaInspeccion] = useState('')
  const [resultado, setResultado] = useState<Resultado>('aprobado')
  const [potenciaKwp, setPotenciaKwp] = useState<string>(
    expediente.kwp != null ? String(expediente.kwp) : ''
  )
  const [normaAplicable, setNormaAplicable] = useState('NOM-001-SEDE-2012')
  const [cumpleNorma, setCumpleNorma] = useState(true)
  const [observacionesGenerales, setObservacionesGenerales] = useState('')
  const [observacionesTecnicas, setObservacionesTecnicas] = useState('')
  const [recomendaciones, setRecomendaciones] = useState('')

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fechaInspeccion) {
      setStatus({ type: 'error', message: 'La fecha de inspección es obligatoria.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/dictamenes/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: expediente.id,
          fecha_inspeccion: fechaInspeccion,
          resultado,
          potencia_kwp: potenciaKwp ? parseFloat(potenciaKwp) : null,
          norma_aplicable: normaAplicable || 'NOM-001-SEDE-2012',
          cumple_norma: cumpleNorma,
          observaciones_generales: observacionesGenerales || null,
          observaciones_tecnicas: observacionesTecnicas || null,
          recomendaciones: recomendaciones || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.error ?? 'Error al guardar el dictamen. Intenta de nuevo.',
        })
        return
      }

      setStatus({ type: 'success', message: 'Dictamen creado correctamente.' })
      router.refresh()
    } catch {
      setStatus({ type: 'error', message: 'Ocurrió un error inesperado. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const cliente = expediente.cliente as any

  return (
    <div className="max-w-2xl">
      {/* Context card */}
      <div className="card mb-6 bg-brand-green-light border-brand-green/20">
        <div className="flex items-start gap-3">
          <ClipboardList className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-green">Nuevo dictamen</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Cliente:{' '}
              <span className="font-medium text-gray-800">{cliente?.nombre ?? '—'}</span>
              {expediente.kwp != null && (
                <>
                  {' '}
                  &middot; <span className="font-medium text-gray-800">{expediente.kwp} kWp</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Datos del Dictamen</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha de inspección */}
          <div>
            <label className="label" htmlFor="fecha_inspeccion">
              Fecha de inspección <span className="text-red-500">*</span>
            </label>
            <input
              id="fecha_inspeccion"
              type="date"
              value={fechaInspeccion}
              onChange={(e) => setFechaInspeccion(e.target.value)}
              required
              disabled={loading}
              className="input-field"
            />
          </div>

          {/* Resultado */}
          <div>
            <label className="label">
              Resultado <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-1">
              {RESULTADO_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 cursor-pointer select-none rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    resultado === opt.value
                      ? opt.value === 'aprobado'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : opt.value === 'rechazado'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-brand-orange bg-brand-orange-light text-brand-orange-dark'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="resultado"
                    value={opt.value}
                    checked={resultado === opt.value}
                    onChange={() => setResultado(opt.value)}
                    disabled={loading}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Potencia kWp + Norma aplicable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="potencia_kwp">
                Potencia (kWp)
              </label>
              <input
                id="potencia_kwp"
                type="number"
                step="0.01"
                min="0"
                value={potenciaKwp}
                onChange={(e) => setPotenciaKwp(e.target.value)}
                placeholder="Ej. 12.5"
                disabled={loading}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="norma_aplicable">
                Norma aplicable
              </label>
              <input
                id="norma_aplicable"
                type="text"
                value={normaAplicable}
                onChange={(e) => setNormaAplicable(e.target.value)}
                placeholder="NOM-001-SEDE-2012"
                disabled={loading}
                className="input-field"
              />
            </div>
          </div>

          {/* Cumple norma */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cumpleNorma}
                onChange={(e) => setCumpleNorma(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green accent-brand-green"
              />
              <span className="text-sm font-medium text-gray-700">
                ¿Cumple con la norma aplicable?
              </span>
            </label>
          </div>

          {/* Observaciones generales */}
          <div>
            <label className="label" htmlFor="obs_generales">
              Observaciones generales
            </label>
            <textarea
              id="obs_generales"
              rows={4}
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              placeholder="Descripción general de los hallazgos durante la inspección…"
              disabled={loading}
              className="input-field resize-none"
            />
          </div>

          {/* Observaciones técnicas */}
          <div>
            <label className="label" htmlFor="obs_tecnicas">
              Observaciones técnicas
            </label>
            <textarea
              id="obs_tecnicas"
              rows={4}
              value={observacionesTecnicas}
              onChange={(e) => setObservacionesTecnicas(e.target.value)}
              placeholder="Detalle técnico: especificaciones, mediciones, condiciones eléctricas…"
              disabled={loading}
              className="input-field resize-none"
            />
          </div>

          {/* Recomendaciones */}
          <div>
            <label className="label" htmlFor="recomendaciones">
              Recomendaciones{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="recomendaciones"
              rows={3}
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              placeholder="Acciones correctivas o recomendaciones al propietario…"
              disabled={loading}
              className="input-field resize-none"
            />
          </div>

          {/* Status message */}
          {status && (
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${
                status.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {status.message}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando dictamen…
                </>
              ) : (
                'Emitir dictamen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
