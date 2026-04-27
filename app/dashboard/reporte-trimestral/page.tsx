'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileSpreadsheet, Download, Loader2, ChevronLeft, ChevronRight,
  Calendar, Users, Zap, MapPin, CheckCircle2, Clock,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface InspeccionRow {
  numero_folio:       string
  cliente_nombre:     string
  tipo_persona:       string
  kwp:                number
  inspector_nombre:   string
  ciudad:             string
  estado_mx:          string
  fecha_inspeccion:   string | null
  status_inspeccion:  string | null
  status_expediente:  string
  precio_propuesto:   number | null
  // Extra fields for CNE export
  cliente_email:      string | null
  cliente_telefono:   string | null
  cliente_contacto:   string | null
  cliente_direccion:  string | null
  fecha_solicitud:    string | null
  duracion_min:       number | null
  inspector_apellidos: string | null
}

interface ResumenInspector {
  nombre:        string
  inspecciones:  number
  kwp_total:     number
  ingresos:      number
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const TRIMESTRES = [
  { label: 'Q1 — Enero a Marzo',       q: 1, meses: [0, 1, 2]   },
  { label: 'Q2 — Abril a Junio',       q: 2, meses: [3, 4, 5]   },
  { label: 'Q3 — Julio a Septiembre',  q: 3, meses: [6, 7, 8]   },
  { label: 'Q4 — Octubre a Diciembre', q: 4, meses: [9, 10, 11] },
]

const STATUS_INSP_LABEL: Record<string, string> = {
  realizada:  'Realizada',
  programada: 'Programada',
  en_curso:   'En Curso',
  cancelada:  'Cancelada',
}

const STATUS_INSP_BADGE: Record<string, string> = {
  realizada:  'bg-green-100 text-green-800',
  programada: 'bg-yellow-100 text-yellow-800',
  en_curso:   'bg-blue-100 text-blue-800',
  cancelada:  'bg-red-100 text-red-800',
}

// ─── Helper: rango de fechas del trimestre ────────────────────────────────────
function rangoTrimestre(year: number, q: number) {
  const mesInicio = (q - 1) * 3
  const inicio = new Date(year, mesInicio, 1).toISOString()
  const fin    = new Date(year, mesInicio + 3, 1).toISOString()
  return { inicio, fin }
}

// ─── Helper: Excel serial date ────────────────────────────────────────────────
function toExcelDate(dateStr: string | null | undefined): number | '' {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30))
  return Math.floor((d.getTime() - EXCEL_EPOCH.getTime()) / 86400000)
}

// ─── Exportar Excel ───────────────────────────────────────────────────────────
async function exportarExcel(
  rows: InspeccionRow[],
  resumen: ResumenInspector[],
  year: number,
  q: number,
) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()
  const tri  = TRIMESTRES.find(t => t.q === q)!
  const titulo = `REPORTE TRIMESTRAL ${tri.label.toUpperCase()} ${year} — UIIE-CRE-021`

  // ── Hoja 1: Informe CNE ────────────────────────────────────────────────────
  // Row 0 – all empty (26 cols)
  const emptyRow = Array(26).fill('')

  // Row 1 – meta header
  const row1: (string | number)[] = Array(26).fill('')
  row1[3]  = 'Razón Social de la Unidad de Inspección'
  row1[7]  = 'Autorización'
  row1[8]  = 'Fecha de envío'
  row1[9]  = 'Informe correspondiente al'
  row1[11] = `Trimestre ${q}`
  row1[12] = 'del año'
  row1[13] = year

  // Row 2 – company / auth
  const row2: string[] = Array(26).fill('')
  row2[3] = 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.'
  row2[7] = 'UI-IC/CNE/021'

  // Row 3 – empty
  // Row 4 – section headers
  const row4: string[] = Array(26).fill('')
  row4[1]  = 'CERTIFICADO'
  row4[4]  = 'SOLICITANTE'
  row4[8]  = 'INSTALACIÓN'
  row4[16] = 'INSPECCIÓN'

  // Row 5 – column headers
  const row5 = [
    '',
    'No.',
    'Número de Certificado',
    'Fecha de emisión',
    'Razón Social o Nombre del Solicitante',
    'Nombre de Contacto',
    'Teléfono',
    'Correo Electrónico',
    'Tipo de Instalación ',
    'Tipo de Tecnología ',
    'No. Permiso \r\nCNE o CRE',
    'Tension de Interconexión o Conexión (V)',
    'Capacidad Instalada \r\n(MW)',
    'Municipio o Alcaldía',
    'Entidad Federativa',
    'Dirección',
    'No. de Oficio Resolutivo \r\nCENACE o CFE',
    'Fecha de la solicitud de inspección',
    'Monto de la cotización del servicio de inspección\r\n(MXN)',
    'Fecha inicio de la inspección en sitio',
    'Número de Acta de Inspección',
    'Fecha del Acta de Inspección',
    'Hora de cierre del Acta de Inspección',
    'Inspector o inspectores que realizaron la inspección',
    'Inspector que autorizó',
    'Comentarios',
  ]

  // Data rows
  const dataRows = rows.map((r, i) => {
    const fechaSolicitudExcel = toExcelDate(r.fecha_solicitud)
    const fechaInicioExcel    = toExcelDate(r.fecha_inspeccion)
    const fechaActaExcel      = fechaInicioExcel  // acta date = inspection date

    // horaCierre: fraction of day
    let horaCierreDecimal: number | '' = ''
    if (r.fecha_inspeccion && r.duracion_min != null) {
      const endMs  = new Date(r.fecha_inspeccion).getTime() + r.duracion_min * 60000
      const endD   = new Date(endMs)
      const hours  = endD.getHours()
      const minutes = endD.getMinutes()
      horaCierreDecimal = (hours * 60 + minutes) / 1440
    }

    const inspectorFull = r.inspector_nombre !== '—'
      ? r.inspector_nombre.toUpperCase()
      : ''

    const razonSocial = r.cliente_nombre !== '—' ? r.cliente_nombre.toUpperCase() : ''

    return [
      '',                                       // A – always empty
      i + 1,                                    // no
      '',                                       // numeroCertificado
      '',                                       // fechaEmision
      razonSocial,                              // razonSocial
      (r.cliente_contacto ?? '').toUpperCase(), // nombreContacto
      r.cliente_telefono ?? '',                 // telefono
      r.cliente_email ?? '',                    // correo
      'Central de Generación Distribuida',      // tipoInstalacion
      'Fotovoltaica',                           // tipoTecnologia
      'N/A',                                    // noPermiso
      '',                                       // tension
      r.kwp ? r.kwp / 1000 : '',               // capacidadMW (kWp → MW)
      r.ciudad !== '—' ? r.ciudad : '',         // municipio
      r.estado_mx !== '—' ? r.estado_mx : '',   // entidadFed
      r.cliente_direccion ?? '',                // direccion
      '',                                       // noOficioResolutivo
      fechaSolicitudExcel,                      // fechaSolicitud
      r.precio_propuesto ?? '',                 // monto
      fechaInicioExcel,                         // fechaInicio
      r.numero_folio !== '—' ? r.numero_folio : '', // numeroActa
      fechaActaExcel,                           // fechaActa
      horaCierreDecimal,                        // horaCierre
      inspectorFull,                            // inspectores
      'JOAQUIN CORELLA PUENTE',                 // inspectorAutorizo
      'Generación Distribuída',                 // comentarios
    ]
  })

  const informeData = [
    emptyRow,
    row1,
    row2,
    emptyRow,
    row4,
    row5,
    ...dataRows,
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(informeData)

  // Column widths (26 columns)
  ws1['!cols'] = [
    {wch:2},{wch:6},{wch:22},{wch:14},{wch:50},{wch:28},{wch:14},{wch:32},
    {wch:28},{wch:18},{wch:14},{wch:10},{wch:10},{wch:24},{wch:24},{wch:40},
    {wch:20},{wch:14},{wch:14},{wch:14},{wch:22},{wch:14},{wch:10},{wch:35},
    {wch:28},{wch:22},
  ]

  // Apply date format to date columns in data rows (rows 6+)
  const dateColIndices = [3, 17, 19, 21]  // fechaEmision(unused), fechaSolicitud, fechaInicio, fechaActa — cols D(3), R(17), T(19), V(21)
  const dataStartRow = 6
  const range = XLSX.utils.decode_range(ws1['!ref'] ?? 'A1')
  for (let R = dataStartRow; R <= range.e.r; R++) {
    for (const C of dateColIndices) {
      const cell = ws1[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell && cell.t === 'n') cell.z = 'DD/MM/YYYY'
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Informe')

  // ── Hoja 2: Resumen por inspector ──────────────────────────────────────────
  const resumenData = [
    [titulo],
    ['RESUMEN POR INSPECTOR'],
    [],
    ['Inspector', 'Inspecciones', 'kWp Total', 'Ingresos s/IVA'],
    ...resumen.map(r => [r.nombre, r.inspecciones, r.kwp_total, r.ingresos]),
    [],
    [
      'TOTAL',
      resumen.reduce((s, r) => s + r.inspecciones, 0),
      resumen.reduce((s, r) => s + r.kwp_total, 0),
      resumen.reduce((s, r) => s + r.ingresos, 0),
    ],
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(resumenData)
  ws2['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 16 }]

  const fmtPeso = '"$"#,##0.00'
  const range2  = XLSX.utils.decode_range(ws2['!ref'] ?? 'A1')
  for (let R = 4; R <= range2.e.r; R++) {
    const cell = ws2[XLSX.utils.encode_cell({ r: R, c: 3 })]
    if (cell && cell.t === 'n') cell.z = fmtPeso
  }

  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Inspectores')

  XLSX.writeFile(wb, `ReporteTrimestral_Q${q}_${year}.xlsx`)
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ReporteTrimestralPage() {
  const supabase = createClient()
  const hoy      = new Date()

  // Trimestre activo: el trimestre actual del año actual
  const trimActual = Math.floor(hoy.getMonth() / 3) + 1
  const [year, setYear] = useState(hoy.getFullYear())
  const [q,    setQ]    = useState(trimActual)

  const [rows,      setRows]      = useState<InspeccionRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filtroInsp, setFiltroInsp] = useState('')

  // ── Cargar datos ────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    const { inicio, fin } = rangoTrimestre(year, q)

    // 1. Expedientes del trimestre
    const { data: expedientes, error } = await supabase
      .from('expedientes')
      .select(`
        id, numero_folio, folio_id, kwp, ciudad, estado_mx, status, fecha_inicio, fecha_cierre,
        nombre_cliente_final,
        cliente:clientes(nombre, tipo_persona, email, telefono, representante, direccion),
        inspector:usuarios!inspector_id(nombre, apellidos),
        inspecciones:inspecciones_agenda(fecha_hora, status, duracion_min)
      `)
      .gte('fecha_inicio', inicio)
      .lt('fecha_inicio', fin)
      .order('fecha_inicio', { ascending: true })

    if (error) {
      console.error('Error cargando expedientes:', error)
      setRows([])
      setLoading(false)
      return
    }

    // 2. Precios y fecha de solicitud desde solicitudes_folio por folio_asignado_id
    const folioIds = (expedientes ?? []).map((e: any) => e.folio_id).filter(Boolean)
    const precioMap = new Map<string, { precio: number | null; created_at: string | null }>()

    if (folioIds.length > 0) {
      const { data: solicitudes } = await supabase
        .from('solicitudes_folio')
        .select('folio_asignado_id, precio_propuesto, created_at')
        .in('folio_asignado_id', folioIds)

      for (const s of solicitudes ?? []) {
        if (s.folio_asignado_id) {
          precioMap.set(s.folio_asignado_id, {
            precio:     s.precio_propuesto,
            created_at: s.created_at,
          })
        }
      }
    }

    // 3. Parsear
    const parsed: InspeccionRow[] = (expedientes ?? []).map((e: any) => {
      const cliente   = e.cliente as any
      const inspector = e.inspector as any
      const inspList: any[] = e.inspecciones ?? []
      const insp = inspList.find((i: any) => i.status === 'realizada')
             ?? inspList.find((i: any) => i.status === 'programada')
             ?? inspList[0]

      const solicitudData = e.folio_id ? (precioMap.get(e.folio_id) ?? null) : null

      return {
        numero_folio:        e.numero_folio ?? '—',
        cliente_nombre:      (e as any).nombre_cliente_final ?? cliente?.nombre ?? '—',
        tipo_persona:        cliente?.tipo_persona ?? 'moral',
        kwp:                 e.kwp ?? 0,
        inspector_nombre:    inspector ? `${inspector.nombre} ${inspector.apellidos ?? ''}`.trim() : '—',
        ciudad:              e.ciudad ?? '—',
        estado_mx:           e.estado_mx ?? '—',
        fecha_inspeccion:    insp?.fecha_hora ?? null,
        status_inspeccion:   insp?.status ?? null,
        status_expediente:   e.status,
        precio_propuesto:    solicitudData?.precio ?? null,
        // Extra fields for CNE export
        cliente_email:       cliente?.email ?? null,
        cliente_telefono:    cliente?.telefono ?? null,
        cliente_contacto:    cliente?.representante ?? cliente?.nombre ?? null,
        cliente_direccion:   cliente?.direccion ?? null,
        fecha_solicitud:     solicitudData?.created_at ?? null,
        duracion_min:        insp?.duracion_min ?? null,
        inspector_apellidos: inspector?.apellidos ?? null,
      }
    })

    setRows(parsed)
    setLoading(false)
  }, [year, q])

  useEffect(() => { cargar() }, [cargar])

  // ── Resumen por inspector ───────────────────────────────────────────────────
  const resumenMap = new Map<string, ResumenInspector>()
  for (const r of rows) {
    const prev = resumenMap.get(r.inspector_nombre) ?? { nombre: r.inspector_nombre, inspecciones: 0, kwp_total: 0, ingresos: 0 }
    resumenMap.set(r.inspector_nombre, {
      ...prev,
      inspecciones: prev.inspecciones + 1,
      kwp_total:    prev.kwp_total + r.kwp,
      ingresos:     prev.ingresos + (r.precio_propuesto ?? 0),
    })
  }
  const resumen = Array.from(resumenMap.values()).sort((a, b) => b.inspecciones - a.inspecciones)

  // Filtrado
  const rowsFiltrados = filtroInsp
    ? rows.filter(r => r.inspector_nombre === filtroInsp)
    : rows

  // KPIs
  const totalKwp = rows.reduce((s, r) => s + r.kwp, 0)
  const totalIngresos = rows.reduce((s, r) => s + (r.precio_propuesto ?? 0), 0)
  const realizadas = rows.filter(r => r.status_inspeccion === 'realizada').length
  const inspectoresUnicos = new Set(rows.map(r => r.inspector_nombre)).size

  async function handleExport() {
    setExporting(true)
    await exportarExcel(rowsFiltrados, resumen, year, q)
    setExporting(false)
  }

  const tri = TRIMESTRES.find(t => t.q === q)!

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte Trimestral</h1>
          <p className="text-gray-500 text-sm mt-1">
            UIIE-CRE-021 · Inspecciones por trimestre
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector de año */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 w-12 text-center">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              disabled={year >= hoy.getFullYear()}
              className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Selector de trimestre */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {TRIMESTRES.map(t => (
              <button
                key={t.q}
                onClick={() => setQ(t.q)}
                className={[
                  'px-3 py-1.5 text-sm font-semibold transition-colors',
                  q === t.q
                    ? 'bg-brand-green text-white'
                    : 'text-gray-500 hover:bg-gray-50',
                ].join(' ')}
              >
                Q{t.q}
              </button>
            ))}
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileSpreadsheet className="w-4 h-4" />
            }
            {exporting ? 'Generando…' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* ── Periodo activo ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4 text-brand-green" />
        <span className="font-medium text-gray-700">{tri.label} {year}</span>
        {!loading && <span>· {rows.length} inspecciones encontradas</span>}
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle2, label: 'Inspecciones', value: String(rows.length), sub: `${realizadas} realizadas`, color: 'bg-brand-green' },
            { icon: Zap,          label: 'Total kWp',    value: totalKwp.toFixed(1),  sub: 'capacidad inspeccionada', color: 'bg-blue-500' },
            { icon: Users,        label: 'Inspectores',  value: String(inspectoresUnicos), sub: 'activos en el trimestre', color: 'bg-purple-500' },
            { icon: Download,     label: 'Con precio',   value: `$${(totalIngresos / 1000).toFixed(0)}K`, sub: `${rows.filter(r => r.precio_propuesto).length} con tarifa`, color: 'bg-brand-orange' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="card flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sin datos ── */}
      {!loading && rows.length === 0 && (
        <div className="card text-center py-16">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Sin inspecciones en {tri.label} {year}</p>
          <p className="text-sm text-gray-400 mt-1">Selecciona otro trimestre o año.</p>
        </div>
      )}

      {/* ── Layout: tabla + resumen lateral ── */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

          {/* Tabla principal */}
          <div className="xl:col-span-3 card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-green" />
                {filtroInsp
                  ? `Inspecciones de ${filtroInsp}`
                  : 'Listado de Inspecciones'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{rowsFiltrados.length} registros</span>
                {filtroInsp && (
                  <button
                    onClick={() => setFiltroInsp('')}
                    className="text-xs text-brand-green hover:underline"
                  >
                    Ver todos
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 w-8">#</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Folio</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Cliente Final</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-500">kWp</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Inspector</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Ciudad</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500">Estado</th>
                    <th className="text-center py-2.5 px-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-center py-2.5 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltrados.map((r, i) => (
                    <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="py-2 px-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2 px-3 font-mono text-brand-green font-semibold text-xs whitespace-nowrap">
                        {r.numero_folio}
                      </td>
                      <td className="py-2 px-3 max-w-[200px]">
                        <p className="font-medium text-gray-800 truncate text-xs">{r.cliente_nombre}</p>
                        <p className="text-gray-400 text-[10px]">{r.tipo_persona === 'moral' ? 'Moral' : 'Física'}</p>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-700 text-xs">{r.kwp}</td>
                      <td className="py-2 px-3 text-gray-600 text-xs max-w-[120px] truncate">{r.inspector_nombre}</td>
                      <td className="py-2 px-3 text-gray-600 text-xs whitespace-nowrap">{r.ciudad}</td>
                      <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">{r.estado_mx}</td>
                      <td className="py-2 px-3 text-center text-gray-500 text-xs whitespace-nowrap">
                        {r.fecha_inspeccion
                          ? new Date(r.fecha_inspeccion).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {r.status_inspeccion ? (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_INSP_BADGE[r.status_inspeccion] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_INSP_LABEL[r.status_inspeccion] ?? r.status_inspeccion}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen por inspector */}
          <div className="xl:col-span-1 card p-0 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-green" />
                Por Inspector
              </h3>
            </div>

            <div className="divide-y divide-gray-50">
              {resumen.map((r, idx) => (
                <button
                  key={r.nombre}
                  onClick={() => setFiltroInsp(filtroInsp === r.nombre ? '' : r.nombre)}
                  className={[
                    'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                    filtroInsp === r.nombre ? 'bg-brand-green-light/30' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                      idx === 0 ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 truncate">{r.nombre}</span>
                  </div>
                  <div className="pl-7 space-y-0.5">
                    <p className="text-xs text-gray-500">{r.inspecciones} inspección{r.inspecciones !== 1 ? 'es' : ''} · {r.kwp_total.toFixed(1)} kWp</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Total trimestre</p>
              <p className="text-base font-bold text-brand-green">{rows.length} inspecciones</p>
              <p className="text-xs text-gray-400">{totalKwp.toFixed(2)} kWp</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
