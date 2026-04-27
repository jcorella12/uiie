'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, Wand2, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Loader2, RotateCcw, Save,
  CreditCard, X, ImageIcon, FileIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParticipantePreview {
  nombre: string
  apellidos: string
  empresa?: string
  email?: string
  telefono?: string
  rol?: string
  curp?: string
  numero_ine?: string
  clave_elector?: string
  domicilio?: string
  colonia?: string
  cp?: string
  ciudad?: string
  estado?: string
  _archivo?: string   // nombre del archivo INE de origen
  _excluir?: boolean
  _rowIndex?: number
}

interface ArchivoINE {
  file: File
  id: string   // para key en lista
}

type Modo = 'ines' | 'csv' | 'texto'

const ROL_LABELS: Record<string, string> = {
  testigo: 'Testigo',
  representante: 'Representante',
  firmante: 'Firmante',
  atiende: 'Atiende visita',
  otro: 'Otro',
}

const ROLES_VALIDOS = ['testigo', 'representante', 'firmante', 'atiende', 'otro']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esImagen(f: File) { return f.type.startsWith('image/') }
function esPDF(f: File)    { return f.type === 'application/pdf' }
function esINE(f: File)    { return esImagen(f) || esPDF(f) }

function uid() { return Math.random().toString(36).slice(2) }

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportarTestigosForm() {
  const router = useRouter()

  const [modo, setModo] = useState<Modo>('ines')

  // INE files
  const ineRef = useRef<HTMLInputElement>(null)
  const [archivosINE, setArchivosINE] = useState<ArchivoINE[]>([])
  const [dragINE, setDragINE] = useState(false)

  // CSV / texto
  const csvRef = useRef<HTMLInputElement>(null)
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null)
  const [textoLibre, setTextoLibre] = useState('')
  const [dragCsv, setDragCsv] = useState(false)

  // Estado general
  const [estado, setEstado] = useState<'idle' | 'analizando' | 'preview' | 'guardando' | 'listo' | 'error'>('idle')
  const [error, setError] = useState('')
  const [fallidos, setFallidos] = useState<{ archivo: string; error: string }[]>([])

  // Preview
  const [participantes, setParticipantes] = useState<ParticipantePreview[]>([])
  const [guardados, setGuardados] = useState(0)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [progreso, setProgreso] = useState('')

  // ── Agregar archivos INE ────────────────────────────────────────────────────

  const agregarINEs = useCallback((files: FileList | File[]) => {
    const nuevos: ArchivoINE[] = []
    for (const f of Array.from(files)) {
      if (esINE(f)) nuevos.push({ file: f, id: uid() })
    }
    setArchivosINE(prev => [...prev, ...nuevos])
  }, [])

  function quitarINE(id: string) {
    setArchivosINE(prev => prev.filter(a => a.id !== id))
  }

  // ── Drag & Drop INE ─────────────────────────────────────────────────────────

  function onDragOverINE(e: React.DragEvent) { e.preventDefault(); setDragINE(true) }
  function onDragLeaveINE() { setDragINE(false) }
  function onDropINE(e: React.DragEvent) {
    e.preventDefault(); setDragINE(false)
    agregarINEs(e.dataTransfer.files)
  }

  // ── Drag & Drop CSV ─────────────────────────────────────────────────────────

  function onDropCsv(e: React.DragEvent) {
    e.preventDefault(); setDragCsv(false)
    const f = e.dataTransfer.files[0]
    if (f) setArchivoCsv(f)
  }

  // ── Analizar ─────────────────────────────────────────────────────────────────

  async function analizar() {
    setError('')
    setFallidos([])
    setEstado('analizando')

    try {
      if (modo === 'ines') {
        // ── Modo INEs: enviar todos los archivos al endpoint OCR masivo ─────────
        if (!archivosINE.length) {
          setError('Agrega al menos una INE.')
          setEstado('idle'); return
        }

        setProgreso(`Leyendo ${archivosINE.length} INE${archivosINE.length !== 1 ? 's' : ''}…`)

        const fd = new FormData()
        for (const { file } of archivosINE) fd.append('ines', file)

        const res = await fetch('/api/testigos/importar-ines', { method: 'POST', body: fd })
        const json = await res.json()

        if (!res.ok) { setError(json.error ?? 'Error al procesar INEs'); setEstado('error'); return }

        setParticipantes(
          (json.participantes as ParticipantePreview[]).map((p, i) => ({
            ...p, rol: p.rol ?? 'testigo', _excluir: false, _rowIndex: i,
          }))
        )
        setFallidos(json.fallidos ?? [])

      } else {
        // ── Modo CSV / texto: endpoint de texto ─────────────────────────────────
        setProgreso('Analizando con IA…')
        const fd = new FormData()
        if (modo === 'csv' && archivoCsv) fd.append('archivo', archivoCsv)
        else if (modo === 'texto' && textoLibre.trim()) fd.append('texto', textoLibre.trim())
        else { setError('Selecciona un archivo o pega texto.'); setEstado('idle'); return }
        fd.append('confirmar', 'false')

        const res = await fetch('/api/testigos/importar', { method: 'POST', body: fd })
        const json = await res.json()

        if (!res.ok) { setError(json.error ?? 'Error al analizar'); setEstado('error'); return }

        setParticipantes(
          (json.participantes as ParticipantePreview[]).map((p, i) => ({
            ...p, _excluir: false, _rowIndex: i,
          }))
        )
        if (json.errores?.length) setFallidos(json.errores.map((e: string) => ({ archivo: '—', error: e })))
      }

      setProgreso('')
      setEstado('preview')
    } catch (e: any) {
      setError(e?.message ?? 'Error de conexión')
      setEstado('error')
    }
  }

  // ── Toggle campos editables ───────────────────────────────────────────────────

  function toggleExcluir(idx: number) {
    setParticipantes(prev => prev.map(p => p._rowIndex === idx ? { ...p, _excluir: !p._excluir } : p))
  }

  function setRol(idx: number, rol: string) {
    setParticipantes(prev => prev.map(p => p._rowIndex === idx ? { ...p, rol } : p))
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────

  async function guardar() {
    setError('')
    setEstado('guardando')
    const seleccionados = participantes.filter(p => !p._excluir)
    if (!seleccionados.length) { setError('Sin participantes seleccionados.'); setEstado('preview'); return }

    try {
      const res = await fetch('/api/testigos/importar-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantes: seleccionados }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Error al guardar'); setEstado('preview'); return }
      setGuardados(json.guardados ?? seleccionados.length)
      setEstado('listo')
    } catch (e: any) {
      setError(e?.message ?? 'Error de conexión')
      setEstado('preview')
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function reset() {
    setArchivosINE([]); setArchivoCsv(null); setTextoLibre('')
    setParticipantes([]); setFallidos([]); setError(''); setGuardados(0)
    setExpandido(null); setProgreso(''); setEstado('idle')
    if (ineRef.current) ineRef.current.value = ''
    if (csvRef.current) csvRef.current.value = ''
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const seleccionados = participantes.filter(p => !p._excluir)

  // ── Pantalla final ───────────────────────────────────────────────────────────
  if (estado === 'listo') {
    return (
      <div className="card p-10 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">
          {guardados} participante{guardados !== 1 ? 's' : ''} importado{guardados !== 1 ? 's' : ''}
        </h2>
        <p className="text-gray-500 text-sm">Ya están disponibles en tu catálogo de participantes.</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Importar más
          </button>
          <button onClick={() => router.push('/dashboard/admin/testigos')} className="btn-primary">
            Ver participantes →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ══ PASO 1: seleccionar fuente ══════════════════════════════════════════ */}
      {(estado === 'idle' || estado === 'error') && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0A5C47] text-white text-xs flex items-center justify-center font-bold">1</span>
            Elige tu fuente de datos
          </h2>

          {/* Tabs ─────────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setModo('ines')}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                modo === 'ines' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <CreditCard className="w-3.5 h-3.5" /> INE / IFE
            </button>
            <button
              onClick={() => setModo('csv')}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                modo === 'csv' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <FileText className="w-3.5 h-3.5" /> CSV / Excel
            </button>
            <button
              onClick={() => setModo('texto')}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                modo === 'texto' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Texto libre
            </button>
          </div>

          {/* ── Modo INE ───────────────────────────────────────────────────── */}
          {modo === 'ines' && (
            <div className="space-y-3">
              {/* Zona de drop */}
              <div
                onDragOver={onDragOverINE}
                onDragLeave={onDragLeaveINE}
                onDrop={onDropINE}
                onClick={() => ineRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  dragINE
                    ? 'border-[#0A5C47] bg-green-50'
                    : 'border-gray-200 hover:border-[#0A5C47] hover:bg-gray-50',
                )}
              >
                <input
                  ref={ineRef}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && agregarINEs(e.target.files)}
                />
                <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Arrastra las INEs aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF con una o ambas caras · JPG · PNG · WEBP — puedes subir varias a la vez
                </p>
              </div>

              {/* Lista de archivos seleccionados */}
              {archivosINE.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">
                    {archivosINE.length} archivo{archivosINE.length !== 1 ? 's' : ''} seleccionado{archivosINE.length !== 1 ? 's' : ''}
                  </p>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden max-h-52 overflow-y-auto">
                    {archivosINE.map(({ file, id }) => (
                      <div key={id} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50">
                        {esPDF(file)
                          ? <FileIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                          : <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        }
                        <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          onClick={e => { e.stopPropagation(); quitarINE(id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); ineRef.current?.click() }}
                    className="text-xs text-[#0A5C47] hover:underline"
                  >
                    + Agregar más archivos
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400">
                La IA leerá cada INE y extraerá nombre, apellidos, CURP, número INE, domicilio y más.
              </p>
            </div>
          )}

          {/* ── Modo CSV ───────────────────────────────────────────────────── */}
          {modo === 'csv' && (
            <div className="space-y-3">
              <div
                onDragOver={e => { e.preventDefault(); setDragCsv(true) }}
                onDragLeave={() => setDragCsv(false)}
                onDrop={onDropCsv}
                onClick={() => csvRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  dragCsv ? 'border-[#0A5C47] bg-green-50' : 'border-gray-200 hover:border-[#0A5C47] hover:bg-gray-50',
                  archivoCsv && 'border-[#0A5C47] bg-green-50'
                )}
              >
                <input
                  ref={csvRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={e => setArchivoCsv(e.target.files?.[0] ?? null)}
                />
                {archivoCsv ? (
                  <div className="space-y-1">
                    <FileText className="w-7 h-7 text-[#0A5C47] mx-auto" />
                    <p className="font-semibold text-sm text-gray-800">{archivoCsv.name}</p>
                    <p className="text-xs text-gray-400">{(archivoCsv.size / 1024).toFixed(1)} KB</p>
                    <button onClick={e => { e.stopPropagation(); setArchivoCsv(null) }} className="text-xs text-red-400 hover:underline">Quitar</button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Arrastra tu CSV o haz clic</p>
                    <p className="text-xs text-gray-400 mt-1">CSV, TXT, TSV — Excel: Archivo → Guardar como CSV</p>
                  </>
                )}
              </div>
              <details className="mt-1">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver formato esperado</summary>
                <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">{`nombre,apellidos,empresa,email,rol\nJuan,García López,CFE,juan@cfe.mx,testigo\nMaría Elena,Rodríguez Soto,,maria@sol.com,representante`}</pre>
              </details>
            </div>
          )}

          {/* ── Modo texto libre ───────────────────────────────────────────── */}
          {modo === 'texto' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pega tu lista de participantes</label>
              <textarea
                rows={9}
                value={textoLibre}
                onChange={e => setTextoLibre(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#0A5C47]/30"
                placeholder={`Ejemplos aceptados:\n\nJuan García López, CFE, juan@cfe.mx\nMaría Rodríguez Soto - Sonora Solar\n\nO copiado de Excel:\nnombre\tapellidos\tempresa\nJuan\tGarcía López\tCFE`}
              />
              <p className="text-xs text-gray-400">La IA entiende CSV, Excel copiado, listas con comas, guiones o saltos de línea.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={analizar}
            disabled={
              (modo === 'ines' && archivosINE.length === 0) ||
              (modo === 'csv'  && !archivoCsv) ||
              (modo === 'texto' && !textoLibre.trim())
            }
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            {modo === 'ines'
              ? `Leer ${archivosINE.length || ''} INE${archivosINE.length !== 1 ? 's' : ''} con IA`
              : 'Analizar con IA'}
          </button>
        </div>
      )}

      {/* ══ Procesando ══════════════════════════════════════════════════════════ */}
      {estado === 'analizando' && (
        <div className="card p-12 text-center space-y-3">
          <Loader2 className="w-9 h-9 text-[#0A5C47] animate-spin mx-auto" />
          <p className="font-medium text-gray-700">{progreso || 'Procesando con IA…'}</p>
          <p className="text-xs text-gray-400">
            {modo === 'ines'
              ? 'Se lee cada INE individualmente — puede tardar unos segundos por credencial.'
              : 'Extrayendo participantes del archivo…'}
          </p>
        </div>
      )}

      {/* ══ PASO 2: Preview ══════════════════════════════════════════════════════ */}
      {(estado === 'preview' || estado === 'guardando') && (
        <div className="space-y-4">

          {/* Header */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0A5C47] text-white text-xs flex items-center justify-center font-bold">2</span>
                Revisar y confirmar
              </h2>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Volver a subir
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-600"><span className="font-bold text-gray-900">{participantes.length}</span> detectados</span>
              <span className="text-gray-300">·</span>
              <span className="text-green-700"><span className="font-bold">{seleccionados.length}</span> para importar</span>
              {participantes.length - seleccionados.length > 0 && (
                <><span className="text-gray-300">·</span>
                <span className="text-gray-400">{participantes.length - seleccionados.length} excluidos</span></>
              )}
            </div>

            {/* INEs con error */}
            {fallidos.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                <p className="text-xs font-semibold text-amber-800">No se pudo leer {fallidos.length} archivo{fallidos.length !== 1 ? 's' : ''}:</p>
                {fallidos.map((f, i) => (
                  <p key={i} className="text-xs text-amber-700">• <span className="font-mono">{f.archivo}</span>: {f.error}</p>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Lista */}
          <div className="card p-0 overflow-hidden divide-y divide-gray-50">
            {participantes.map(p => {
              const idx = p._rowIndex!
              const isOpen = expandido === idx
              const subtitulo = [p.curp, p.ciudad && p.estado ? `${p.ciudad}, ${p.estado}` : (p.ciudad ?? p.estado)].filter(Boolean).join(' · ')
              return (
                <div key={idx} className={cn('transition-colors', p._excluir ? 'bg-gray-50 opacity-40' : 'bg-white')}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!p._excluir}
                      onChange={() => toggleExcluir(idx)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#0A5C47] cursor-pointer flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className={cn('font-medium text-sm', p._excluir ? 'line-through text-gray-400' : 'text-gray-800')}>
                        {p.nombre} {p.apellidos}
                      </p>
                      {subtitulo && <p className="text-xs text-gray-400 truncate">{subtitulo}</p>}
                      {p._archivo && <p className="text-[10px] text-gray-300 truncate">{p._archivo}</p>}
                    </div>

                    {/* Selector de rol inline */}
                    <select
                      value={p.rol ?? 'testigo'}
                      onChange={e => setRol(idx, e.target.value)}
                      disabled={p._excluir}
                      className="text-xs bg-gray-100 border-0 rounded-full px-2 py-0.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0A5C47]/30 cursor-pointer flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      {ROLES_VALIDOS.map(r => (
                        <option key={r} value={r}>{ROL_LABELS[r]}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandido(isOpen ? null : idx)}
                      className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-t border-gray-50 bg-gray-50/60">
                      {([
                        ['CURP',          p.curp],
                        ['Núm. INE',      p.numero_ine],
                        ['Clave elector', p.clave_elector],
                        ['Domicilio',     p.domicilio],
                        ['Colonia',       p.colonia],
                        ['CP',            p.cp],
                        ['Ciudad',        p.ciudad],
                        ['Estado',        p.estado],
                        ['Email',         p.email],
                        ['Teléfono',      p.telefono],
                        ['Empresa',       p.empresa],
                      ] as [string, string | undefined][]).map(([label, val]) => val ? (
                        <div key={label} className="flex gap-1.5">
                          <span className="text-gray-400 w-24 flex-shrink-0">{label}:</span>
                          <span className="text-gray-700 font-mono break-all">{val}</span>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Desmarca los que no quieras importar. Puedes cambiar el rol de cada uno.</p>
            <button
              onClick={guardar}
              disabled={seleccionados.length === 0 || estado === 'guardando'}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {estado === 'guardando' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              ) : (
                <><Save className="w-4 h-4" /> Importar {seleccionados.length} participante{seleccionados.length !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
