'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud, Loader2, CheckCircle, AlertTriangle,
  Sparkles, FileText, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoIA = 'resolutivo' | 'dictamen' | 'plano' | 'memoria_tecnica'

interface ExistingDoc {
  id: string
  nombre: string
  tipo: string
  analisis_ia: Record<string, any> | null
  analizado_en: string | null
  created_at: string
}

interface Props {
  expedienteId: string
  tipo: TipoIA
  existingDoc: ExistingDoc | null
  readOnly?: boolean
}

// ─── Config por tipo ──────────────────────────────────────────────────────────

const CONFIG: Record<TipoIA, {
  label: string
  hint: string
  accept: string
  camposLabel: Record<string, string>
}> = {
  resolutivo: {
    label: 'Oficio Resolutivo CFE',
    hint: 'PDF del oficio resolutivo de interconexión emitido por CFE',
    accept: '.pdf,.jpg,.jpeg,.png',
    camposLabel: {
      nombre_cliente_final: 'Cliente final (solicitante)',
      folio:        'Folio del resolutivo',
      zona_cfe:     'Zona CFE',
      division_cfe: 'División CFE',
      fecha:        'Fecha de emisión',
      kwp:          'Potencia aprobada (kWp)',
      tiene_cobro:  '¿Incluye cobro?',
      monto:        'Monto ($)',
      referencia:   'Referencia de pago',
    },
  },
  dictamen: {
    label: 'Dictamen UVIE',
    hint: 'PDF del dictamen de verificación de instalaciones eléctricas',
    accept: '.pdf,.jpg,.jpeg,.png',
    camposLabel: {
      nombre_cliente_final: 'Cliente final (propietario)',
      folio_dvnp:      'Folio / DVNP',
      nombre_uvie:     'Nombre de la UVIE',
      fecha_emision:   'Fecha de emisión',
      fecha_vigencia:  'Vigencia hasta',
      resultado:       'Resultado',
      observaciones:   'Observaciones',
    },
  },
  plano: {
    label: 'Diagrama Unifilar',
    hint: 'PDF o imagen del diagrama eléctrico unifilar del sistema FV',
    accept: '.pdf,.jpg,.jpeg,.png',
    camposLabel: {
      kwp:              'Potencia del sistema (kWp)',
      num_paneles:      'Número de paneles',
      potencia_panel_wp:'Potencia por panel (Wp)',
      marca_inversor:   'Inversor (marca/modelo)',
      num_inversores:   'Número de inversores',
      tipo_conexion:    'Tipo de conexión',
      tipo_central:     'Tipo de central',
      numero_medidor:   'Núm. medidor CFE',
      tension_vdc:      'Tensión del sistema (VDC)',
    },
  },
  memoria_tecnica: {
    label: 'Memoria de Cálculo',
    hint: 'PDF de la memoria técnica / de cálculo del sistema fotovoltaico',
    accept: '.pdf,.jpg,.jpeg,.png',
    camposLabel: {
      kwp:              'Potencia del sistema (kWp)',
      num_paneles:      'Número de paneles',
      potencia_panel_wp:'Potencia por panel (Wp)',
      marca_inversor:   'Inversor (marca/modelo)',
      num_inversores:   'Número de inversores',
      tipo_conexion:    'Tipo de conexión',
      tipo_central:     'Tipo de central',
      numero_medidor:   'Núm. medidor CFE',
      isc_a:            'Corriente cortocircuito (A)',
      voc_v:            'Tensión circuito abierto (V)',
    },
  },
}

// ─── Helpers de visualización ─────────────────────────────────────────────────

function renderValue(key: string, value: any): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(' · ') : '—'
  if (key.includes('fecha') || key === 'fecha') {
    try {
      return new Date(value + 'T12:00:00').toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch { return String(value) }
  }
  if (key === 'monto' && typeof value === 'number') {
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }
  if (key === 'kwp' && typeof value === 'number') return `${value} kWp`
  return String(value)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SubirDocumentoIA({ expedienteId, tipo, existingDoc, readOnly = false }: Props) {
  const cfg = CONFIG[tipo]
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploading,  setUploading]  = useState(false)
  const [analyzing,  setAnalyzing]  = useState(false)
  const [applying,   setApplying]   = useState(false)
  const [applied,    setApplied]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Documento actual (puede ser el existente o uno recién subido)
  const [currentDoc, setCurrentDoc] = useState<ExistingDoc | null>(existingDoc)
  // Análisis activo (del doc existente si ya viene analizado, o del recién subido)
  const [analysis,   setAnalysis]   = useState<Record<string, any> | null>(existingDoc?.analisis_ia ?? null)
  const [showDetail, setShowDetail] = useState(false)

  // ── Subir archivo ──────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    setError(null)
    setAnalysis(null)
    setApplied(false)
    setUploading(true)

    try {
      // 1. Subir documento
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', tipo)
      fd.append('nombre', file.name.replace(/\.[^/.]+$/, '') || file.name)
      fd.append('expediente_id', expedienteId)

      const uploadRes  = await fetch('/api/documentos/subir', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Error al subir archivo')

      // El endpoint subir no devuelve id directamente, necesitamos obtenerlo
      // Hacemos un fetch para encontrar el doc recién subido
      const docsRes  = await fetch(`/api/documentos/listar?expediente_id=${expedienteId}&tipo=${tipo}`)
      const docsData = await docsRes.json()
      const latest   = docsData?.docs?.[0] ?? null

      if (!latest?.id) throw new Error('No se pudo obtener el documento subido')

      const doc: ExistingDoc = {
        id:          latest.id,
        nombre:      latest.nombre,
        tipo:        latest.tipo ?? tipo,
        analisis_ia: null,
        analizado_en: null,
        created_at:  latest.created_at,
      }
      setCurrentDoc(doc)
      setUploading(false)

      // 2. Analizar automáticamente
      setAnalyzing(true)
      const analyzeRes  = await fetch('/api/documentos/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_id: latest.id }),
      })
      const analyzeData = await analyzeRes.json()
      if (!analyzeRes.ok) throw new Error(analyzeData.error ?? 'Error en el análisis IA')

      setAnalysis(analyzeData.analysis)
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  // ── Re-analizar documento existente ───────────────────────────
  async function handleReanalyze() {
    if (!currentDoc) return
    setError(null)
    setAnalysis(null)
    setApplied(false)
    setAnalyzing(true)
    try {
      const res  = await fetch('/api/documentos/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento_id: currentDoc.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error en análisis')
      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Aplicar campos al expediente ──────────────────────────────
  const [conflictoCliente, setConflictoCliente] = useState<{ actual: string; nuevo: string } | null>(null)

  async function handleApply() {
    if (!currentDoc || !analysis) return
    setApplying(true)
    setError(null)
    setConflictoCliente(null)
    try {
      const res  = await fetch('/api/documentos/aplicar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id:  currentDoc.id,
          tipo,
          expediente_id: expedienteId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al aplicar')
      if (data.conflicto_cliente_final) {
        setConflictoCliente(data.conflicto_cliente_final)
      }
      setApplied(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  const isLoading = uploading || analyzing

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">

      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-7 h-7 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-brand-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
          <p className="text-xs text-gray-400 truncate">{cfg.hint}</p>
        </div>
        {/* Estado */}
        {currentDoc && !isLoading && (() => {
          const CLIENT_TIPOS: Record<string, string> = {
            oficio_resolutivo: 'resolutivo', diagrama: 'plano',
            memoria_calculo: 'memoria_tecnica', dictamen_uvie: 'dictamen',
          }
          const esCliente = currentDoc.tipo in CLIENT_TIPOS
          return esCliente ? (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
              Subido por cliente
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
              Subido
            </span>
          )
        })()}
        {isLoading && (
          <Loader2 className="w-4 h-4 text-brand-green animate-spin flex-shrink-0" />
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Archivo actual */}
        {currentDoc && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="flex-1 truncate font-medium text-gray-700">{currentDoc.nombre}</span>
            <span className="flex-shrink-0 text-gray-400">
              {new Date(currentDoc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Zona de subida */}
        {!readOnly && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept={cfg.accept}
              className="hidden"
              onChange={handleFile}
              disabled={isLoading}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-green/50 hover:text-brand-green hover:bg-brand-green-light/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo archivo…</>
              ) : analyzing ? (
                <><Sparkles className="w-4 h-4 animate-pulse" /> Analizando con IA…</>
              ) : (
                <><UploadCloud className="w-4 h-4" /> {currentDoc ? 'Reemplazar archivo' : 'Seleccionar archivo'}</>
              )}
            </button>
          </div>
        )}

        {/* Estado de carga */}
        {uploading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />
            Subiendo archivo al servidor…
          </div>
        )}
        {analyzing && !uploading && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 animate-pulse" />
            Claude está leyendo el documento y extrayendo los datos…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Resultados del análisis IA */}
        {analysis && !isLoading && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 overflow-hidden">

            {/* Header resultados */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/60 border-b border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-purple-800 flex-1">Datos extraídos por IA</p>
              <button
                onClick={() => setShowDetail(v => !v)}
                className="text-purple-500 hover:text-purple-700 transition-colors"
              >
                {showDetail
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </button>
            </div>

            {/* Resumen siempre visible */}
            {analysis.resumen && (
              <p className="px-3 pt-2 text-xs text-purple-700 leading-relaxed">{analysis.resumen}</p>
            )}

            {/* Badge folio generado automáticamente */}
            {analysis.folio_generado && analysis.folio && (
              <div className="mx-3 mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <span className="text-amber-600 text-xs">⚡</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    Folio generado automáticamente: <span className="font-mono">{analysis.folio}</span>
                  </p>
                  <p className="text-[10px] text-amber-600">
                    El documento no tenía número de oficio — se generó con zona CFE + fecha
                  </p>
                </div>
              </div>
            )}

            {/* Campos extraídos (colapsable) */}
            {showDetail && (
              <div className="px-3 pb-3 pt-1 space-y-1.5 mt-1">
                {Object.entries(cfg.camposLabel).map(([key, label]) => {
                  const val = analysis[key]
                  if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) return null
                  return (
                    <div key={key} className="flex items-baseline gap-2">
                      <span className="text-[10px] font-medium text-purple-500 w-32 shrink-0">{label}</span>
                      <span className="text-xs text-purple-900 font-medium">
                        {renderValue(key, val)}
                        {key === 'folio' && analysis.folio_generado && (
                          <span className="ml-1.5 text-[10px] font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">auto</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Acciones */}
            <div className="px-3 pb-3 pt-2 flex items-center gap-2 border-t border-purple-200 mt-2">
              {!readOnly && (
                applied ? (
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Campos aplicados al expediente
                    </div>
                    {conflictoCliente && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                        <span className="font-semibold">Cliente final actualizado — verifica si es correcto:</span>
                        <div className="mt-0.5 grid grid-cols-[auto_1fr] gap-x-2">
                          <span className="text-amber-500">Anterior:</span><span className="line-through opacity-70">{conflictoCliente.actual}</span>
                          <span className="text-amber-700 font-medium">Nuevo:</span><span className="font-medium">{conflictoCliente.nuevo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {applying
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Aplicando…</>
                      : <><CheckCircle className="w-3 h-3" /> Aplicar al expediente</>
                    }
                  </button>
                )
              )}
              {currentDoc && !readOnly && (
                <button
                  onClick={handleReanalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-analizar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botón analizar si doc existe pero no hay análisis */}
        {currentDoc && !analysis && !isLoading && !readOnly && (
          <button
            onClick={handleReanalyze}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analizar documento con IA
          </button>
        )}

      </div>
    </div>
  )
}
