'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Certificacion = 'ul1741' | 'ieee1547' | 'ninguna'
type Fase = 'monofasico' | 'bifasico' | 'trifasico'
type Tipo = 'string' | 'microinversor' | 'hibrido'

interface Props {
  inversor?: any
}

const CERT_OPTIONS: { value: Certificacion; label: string; icon: string; desc: string }[] = [
  {
    value: 'ul1741',
    label: 'UL1741',
    icon: '✅',
    desc: 'Certificado UL — cumple DACGS automáticamente',
  },
  {
    value: 'ieee1547',
    label: 'IEEE 1547',
    icon: '⚡',
    desc: 'Norma IEEE — requiere justificación en el acta',
  },
  {
    value: 'ninguna',
    label: 'Sin certificación',
    icon: '—',
    desc: 'Sin certificado reconocido — requiere justificación',
  },
]

export default function InversorForm({ inversor }: Props) {
  const router = useRouter()
  const esEdicion = Boolean(inversor?.id)

  const [form, setForm] = useState({
    marca: inversor?.marca ?? '',
    modelo: inversor?.modelo ?? '',
    potencia_kw: inversor?.potencia_kw ?? '',
    fase: (inversor?.fase ?? 'monofasico') as Fase,
    tipo: (inversor?.tipo ?? 'string') as Tipo,
    eficiencia: inversor?.eficiencia ?? '',
    tension_ac: inversor?.tension_ac ?? '',
    corriente_max: inversor?.corriente_max ?? '',
    certificacion: (inversor?.certificacion ?? 'ul1741') as Certificacion,
    justificacion_ieee1547: inversor?.justificacion_ieee1547 ?? '',
    activo: inversor?.activo ?? true,
  })

  const [fichaTecnicaFile, setFichaTecnicaFile] = useState<File | null>(null)
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null)
  const fichaTecnicaRef = useRef<HTMLInputElement>(null)
  const certificadoRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm((prev) => ({ ...prev, [name]: val }))
  }

  function setCertificacion(val: Certificacion) {
    setForm((prev) => ({ ...prev, certificacion: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()

      if (esEdicion) fd.append('id', inversor.id)
      fd.append('marca', form.marca.trim())
      fd.append('modelo', form.modelo.trim())
      fd.append('potencia_kw', String(form.potencia_kw))
      fd.append('fase', form.fase)
      fd.append('tipo', form.tipo)
      fd.append('eficiencia', String(form.eficiencia))
      fd.append('tension_ac', String(form.tension_ac))
      fd.append('corriente_max', String(form.corriente_max))
      fd.append('certificacion', form.certificacion)
      fd.append('justificacion_ieee1547', form.justificacion_ieee1547)
      fd.append('activo', String(form.activo))

      if (fichaTecnicaFile) fd.append('ficha_tecnica', fichaTecnicaFile)
      if (certificadoFile) fd.append('certificado', certificadoFile)

      const res = await fetch('/api/inversores/guardar', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Error al guardar el inversor')
      }

      router.push('/dashboard/admin/inversores')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const necesitaJustificacion =
    form.certificacion === 'ieee1547' || form.certificacion === 'ninguna'

  const justPlaceholder =
    form.marca || form.modelo
      ? `EL INVERSOR ${form.marca.toUpperCase() || '[MARCA]'} ${form.modelo.toUpperCase() || '[MODELO]'} NO CUENTA CON certificación UL1741, sin embargo cumple con los requerimientos de la norma IEEE 1547...`
      : 'EL INVERSOR [MARCA] [MODELO] NO CUENTA CON certificación UL1741...'

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

      {/* Sección 1 — Datos del equipo */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          1. Datos del equipo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="marca">Marca <span className="text-red-500">*</span></label>
            <input
              id="marca"
              name="marca"
              type="text"
              required
              value={form.marca}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej. SMA, Fronius, Huawei"
            />
          </div>
          <div>
            <label className="label" htmlFor="modelo">Modelo <span className="text-red-500">*</span></label>
            <input
              id="modelo"
              name="modelo"
              type="text"
              required
              value={form.modelo}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej. Sunny Boy 5.0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="potencia_kw">Potencia (kW) <span className="text-red-500">*</span></label>
            <input
              id="potencia_kw"
              name="potencia_kw"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.potencia_kw}
              onChange={handleChange}
              className="input-field"
              placeholder="5.00"
            />
          </div>
          <div>
            <label className="label" htmlFor="fase">Fase <span className="text-red-500">*</span></label>
            <select
              id="fase"
              name="fase"
              required
              value={form.fase}
              onChange={handleChange}
              className="input-field"
            >
              <option value="monofasico">Monofásico</option>
              <option value="bifasico">Bifásico</option>
              <option value="trifasico">Trifásico</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tipo">Tipo <span className="text-red-500">*</span></label>
            <select
              id="tipo"
              name="tipo"
              required
              value={form.tipo}
              onChange={handleChange}
              className="input-field"
            >
              <option value="string">String</option>
              <option value="microinversor">Microinversor</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="eficiencia">Eficiencia (%) <span className="text-gray-400 font-normal">(opc.)</span></label>
            <input
              id="eficiencia"
              name="eficiencia"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.eficiencia}
              onChange={handleChange}
              className="input-field"
              placeholder="97.60"
            />
          </div>
          <div>
            <label className="label" htmlFor="tension_ac">Tensión AC (V) <span className="text-gray-400 font-normal">(opc.)</span></label>
            <input
              id="tension_ac"
              name="tension_ac"
              type="number"
              step="0.1"
              min="0"
              value={form.tension_ac}
              onChange={handleChange}
              className="input-field"
              placeholder="220"
            />
          </div>
          <div>
            <label className="label" htmlFor="corriente_max">Corriente máx. (A) <span className="text-gray-400 font-normal">(opc.)</span></label>
            <input
              id="corriente_max"
              name="corriente_max"
              type="number"
              step="0.01"
              min="0"
              value={form.corriente_max}
              onChange={handleChange}
              className="input-field"
              placeholder="25.00"
            />
          </div>
        </div>
      </div>

      {/* Sección 2 — Certificación */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          2. Certificación
          <span className="ml-2 text-xs font-normal text-brand-orange">(determina el texto del acta)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CERT_OPTIONS.map((opt) => {
            const isSelected = form.certificacion === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCertificacion(opt.value)}
                className={[
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                  isSelected
                    ? 'border-brand-green bg-brand-green-light'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                ].join(' ')}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className={`font-semibold text-sm ${isSelected ? 'text-brand-green' : 'text-gray-700'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-gray-500 leading-tight">{opt.desc}</span>
              </button>
            )
          })}
        </div>

        {/* Nota contextual */}
        {form.certificacion === 'ul1741' && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3">
            <span className="font-semibold">Texto generado automáticamente en el acta:</span>{' '}
            &ldquo;LOS [N] INVERSORES {form.marca.toUpperCase() || '[MARCA]'} {form.modelo.toUpperCase() || '[MODELO]'} CUENTAN CON certificado UL1741 por lo cual cumple con los requerimientos establecidos en las DACGS...&rdquo;
          </div>
        )}

        {/* Textarea de justificación */}
        {necesitaJustificacion && (
          <div>
            <label className="label" htmlFor="justificacion_ieee1547">
              Texto base para el acta <span className="text-gray-400 font-normal">(cuando no hay UL1741)</span>
            </label>
            <textarea
              id="justificacion_ieee1547"
              name="justificacion_ieee1547"
              rows={4}
              value={form.justificacion_ieee1547}
              onChange={handleChange}
              className="input-field resize-y"
              placeholder={justPlaceholder}
            />
            <p className="text-xs text-gray-400 mt-1">
              Este texto se insertará en el acta de inspección y en el reporte de hallazgos.
            </p>
          </div>
        )}
      </div>

      {/* Sección 3 — Documentos */}
      <div className="card space-y-5">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
          3. Documentos
        </h2>

        {/* Ficha técnica */}
        <div>
          <label className="label">Ficha técnica (PDF)</label>
          {inversor?.ficha_tecnica_url && !fichaTecnicaFile && (
            <div className="flex items-center gap-3 mb-2 text-sm text-gray-600">
              <span className="text-green-600">📄 Archivo actual cargado</span>
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogos/${inversor.ficha_tecnica_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-green hover:underline font-medium"
              >
                Ver actual
              </a>
            </div>
          )}
          <input
            ref={fichaTecnicaRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFichaTecnicaFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green-light file:text-brand-green hover:file:bg-green-100 cursor-pointer"
          />
          {fichaTecnicaFile && (
            <p className="text-xs text-gray-500 mt-1">Seleccionado: {fichaTecnicaFile.name}</p>
          )}
        </div>

        {/* Certificado */}
        <div>
          <label className="label">Certificado UL / IEEE (PDF)</label>
          {inversor?.certificado_url && !certificadoFile ? (
            <div className="flex items-center gap-3 mb-2 text-sm text-gray-600">
              <span className="text-green-600">✅ Certificado cargado</span>
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogos/${inversor.certificado_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-green hover:underline font-medium"
              >
                Ver actual
              </a>
            </div>
          ) : !inversor?.certificado_url && !certificadoFile ? (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 mb-2">
              ⚠ Sin certificado — el inversor no se podrá usar en inspecciones hasta cargar el certificado
            </div>
          ) : null}
          <input
            ref={certificadoRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setCertificadoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green-light file:text-brand-green hover:file:bg-green-100 cursor-pointer"
          />
          {certificadoFile && (
            <p className="text-xs text-gray-500 mt-1">Seleccionado: {certificadoFile.name}</p>
          )}
        </div>
      </div>

      {/* Sección 4 — Estado (solo edición) */}
      {esEdicion && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">
            4. Estado del registro
          </h2>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-brand-green"
            />
            <span className="text-sm font-medium text-gray-700">
              Inversor activo — aparecerá disponible para selección en nuevas inspecciones
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear inversor'}
        </button>
        <a
          href="/dashboard/admin/inversores"
          className="btn-outline"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
