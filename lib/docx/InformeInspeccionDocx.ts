/**
 * Informe de Inspección — UIIE-CRE-021
 *
 * Documento que las DACGS exigen entregar dentro del paquete del expediente
 * (junto con el acta y la lista de verificación). Es la narrativa del proceso
 * de inspección: qué documentos se revisaron, qué se encontró en sitio,
 * quién participó y la conclusión.
 *
 * Va dentro del ZIP en la carpeta "9. INFORME DE INSPECCIÓN".
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  HeadingLevel,
} from 'docx'
import fs from 'fs'
import {
  descripcionParaPlan,
  textoActaInversores,
  type InversorRow,
} from './inversores-redaccion'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DocumentoInspeccionado {
  nombre:        string
  tipo:          string         // ej. 'oficio_resolutivo', 'dictamen_uvie', etc.
  created_at?:   string
}

export interface TestigoPresente {
  nombre:      string
  apellidos?:  string
  numero_ine?: string
}

export interface InformeData {
  logoSrc?: string

  // Identificadores
  folio:               string                  // ej. "UIIE-001-2026"
  fecha_emision:       string                  // ej. "12 de mayo de 2026"

  // Cliente
  cliente_nombre:      string                  // razón social
  cliente_rfc?:        string
  cliente_representante?: string

  // Ubicación
  direccion:           string
  colonia?:            string
  codigo_postal?:      string
  municipio?:          string
  ciudad:              string
  estado:              string

  // Sistema
  kwp:                 number
  num_paneles?:        number
  potencia_panel_wp?:  number
  marca_paneles?:      string
  modelo_paneles?:     string
  numero_medidor?:     string
  tipo_central:        string                  // 'MT' | 'BT'
  tipo_conexion?:      string
  capacidad_subestacion_kva?: number | null
  inversores:          InversorRow[]

  // Visita
  fecha_inspeccion:    string                  // ej. "08 de mayo de 2026"
  hora_inicio:         string                  // ej. "10:00"
  hora_fin:            string                  // ej. "12:30"

  // Personal presente
  inspector_nombre:    string
  inspector_cedula?:   string
  inspector_responsable_nombre?: string
  atiende_nombre:      string
  atiende_correo?:     string
  atiende_telefono?:   string
  testigos:            TestigoPresente[]

  // Documentos revisados durante la inspección (de documentos_expediente)
  documentos_inspeccionados: DocumentoInspeccionado[]

  // Resolutivo y dictamen UVIE
  resolutivo_folio?:   string
  resolutivo_fecha?:   string                  // formateada
  dictamen_folio_dvnp?: string
  dictamen_uvie_nombre?: string

  // Resultado
  resultado:           'aprobado' | 'rechazado' | 'condicionado'
  observaciones?:      string
  num_certificado?:    string                  // si ya hay certificado emitido
  fecha_certificado?:  string
}

// ─── Constantes de estilo ────────────────────────────────────────────────────

const CONTENT_WIDTH = 9360
const FONT = 'Arial'

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const ALL_BORDERS = {
  top:    CELL_BORDER,
  bottom: CELL_BORDER,
  left:   CELL_BORDER,
  right:  CELL_BORDER,
}
const NO_BORDERS = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

function pt(points: number): number {
  return points * 2 // half-points
}

// ─── Helpers de párrafos ─────────────────────────────────────────────────────

function run(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    size: pt(opts.size ?? 9),
    color: opts.color,
    font: FONT,
  })
}

function para(
  runs: TextRun[],
  opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.spacingAfter ?? 120 },
    children: runs,
  })
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: pt(11),
        font: FONT,
        color: '0F6E56',
      }),
    ],
  })
}

function blankLine(): Paragraph {
  return new Paragraph({ children: [], spacing: { after: 80 } })
}

// ─── Tabla "etiqueta : valor" para datos generales ──────────────────────────

function dataTable(rows: { label: string; value: string }[]): Table {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: rows.map(({ label, value }, i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3120, type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: i % 2 === 0 ? 'F2F4F3' : 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: pt(8), font: FONT })],
            })],
          }),
          new TableCell({
            width: { size: 6240, type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: i % 2 === 0 ? 'F2F4F3' : 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: value || '—', size: pt(8), font: FONT })],
            })],
          }),
        ],
      })
    ),
  })
}

// ─── Tabla de documentos inspeccionados ─────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  oficio_resolutivo:    'Oficio Resolutivo CFE',
  resolutivo:           'Oficio Resolutivo CFE',
  dictamen_uvie:        'Dictamen UVIE',
  dictamen:             'Dictamen UVIE',
  diagrama:             'Diagrama Unifilar',
  plano:                'Plano',
  memoria_calculo:      'Memoria de Cálculo',
  memoria_tecnica:      'Memoria de Cálculo',
  certificado_inversor: 'Certificado del Inversor',
  recibo_cfe:           'Recibo CFE',
  ine_participante:     'Identificación INE',
  fotografia:           'Fotografía de Instalación',
  evidencia_visita:     'Evidencia de Visita',
  acta:                 'Acta de Inspección',
  lista_verificacion:   'Lista de Verificación DACG',
  contrato:             'Contrato',
  ficha_pago:           'Comprobante de Pago',
  cotizacion:           'Cotización / Factura',
  otro:                 'Otro',
}

function tipoLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo.replace(/_/g, ' ')
}

function documentosTable(docs: DocumentoInspeccionado[]): Table {
  const head = new TableRow({
    tableHeader: true,
    children: [
      headerCell('#',         540),
      headerCell('Documento', 5760),
      headerCell('Tipo',      3060),
    ],
  })

  const dataRows = docs.map((d, i) =>
    new TableRow({
      children: [
        bodyCell(String(i + 1),     540,  AlignmentType.CENTER),
        bodyCell(d.nombre,          5760, AlignmentType.LEFT),
        bodyCell(tipoLabel(d.tipo), 3060, AlignmentType.LEFT),
      ],
    }),
  )

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [540, 5760, 3060],
    rows: [head, ...dataRows],
  })
}

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: ALL_BORDERS,
    shading: { fill: '0F6E56', type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: pt(8), font: FONT })],
    })],
  })
}

function bodyCell(
  text: string,
  width: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: ALL_BORDERS,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: text || '—', size: pt(8), font: FONT })],
    })],
  })
}

// ─── Header table (logo + título) ────────────────────────────────────────────

function buildHeader(folio: string, fechaEmision: string, logoSrc?: string): Table {
  let logoBuffer: Buffer | null = null
  if (logoSrc) {
    try { logoBuffer = fs.readFileSync(logoSrc) } catch { logoBuffer = null }
  }

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [1080, 5400, 2880],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1080, type: WidthType.DXA },
            borders: ALL_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: logoBuffer
                ? [new ImageRun({
                    type: 'png',
                    data: logoBuffer,
                    transformation: { width: 60, height: 50 },
                    altText: { title: 'Logo', description: 'Logo CIAE', name: 'Logo' },
                  })]
                : [new TextRun({ text: 'CIAE', bold: true, size: pt(10), font: FONT })],
            })],
          }),
          new TableCell({
            width: { size: 5400, type: WidthType.DXA },
            borders: ALL_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.',
                  bold: true, size: pt(10), font: FONT,
                })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: 'Unidad de Inspección de Instalaciones Eléctricas',
                  size: pt(8), font: FONT,
                })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: 'INFORME DE INSPECCIÓN',
                  bold: true, size: pt(11), font: FONT, color: '0F6E56',
                })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2880, type: WidthType.DXA },
            borders: ALL_BORDERS,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({ children: [
                new TextRun({ text: `Folio: ${folio}`, bold: true, size: pt(8), font: FONT }),
              ]}),
              new Paragraph({ children: [
                new TextRun({ text: 'Procedimiento: UIIE-CRE-021', size: pt(7), font: FONT }),
              ]}),
              new Paragraph({ children: [
                new TextRun({ text: `Fecha emisión: ${fechaEmision}`, size: pt(7), font: FONT }),
              ]}),
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── Texto de cumplimiento DACGS ────────────────────────────────────────────

function textoCumplimiento(d: InformeData): string {
  const resultadoTxt = d.resultado === 'aprobado'
    ? 'CUMPLE con todos los requisitos establecidos'
    : d.resultado === 'condicionado'
      ? 'CUMPLE PARCIALMENTE con observaciones'
      : 'NO CUMPLE con los requisitos establecidos'

  return (
    `Con base en la inspección realizada el ${d.fecha_inspeccion} a la instalación fotovoltaica ` +
    `del cliente ${d.cliente_nombre} ubicada en ${d.direccion}, ${d.ciudad}, ${d.estado}, ` +
    `con una potencia nominal de ${d.kwp} kWp interconectada al esquema de ${
      d.tipo_central === 'BT' ? 'Baja Tensión' : 'Media Tensión'
    }, se concluye que la instalación ${resultadoTxt} ` +
    `en las Disposiciones Administrativas de Carácter General (DACG) emitidas por la Comisión ` +
    `Reguladora de Energía aplicables a los sistemas de generación distribuida interconectados ` +
    `a la Red Eléctrica Nacional, según se detalla en el Acta de Inspección y en la Lista de ` +
    `Verificación DACG anexas al presente informe.`
  )
}

// ─── Generador principal ────────────────────────────────────────────────────

export async function generarInformeInspeccionDocx(d: InformeData): Promise<Buffer> {
  const direccionCompleta = [
    d.direccion, d.colonia, d.codigo_postal ? `CP ${d.codigo_postal}` : null,
    d.municipio, d.ciudad, d.estado,
  ].filter(Boolean).join(', ')

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerTable = buildHeader(d.folio, d.fecha_emision, d.logoSrc)

  // ── 1. DATOS GENERALES ─────────────────────────────────────────────────────
  const datosGeneralesTable = dataTable([
    { label: 'Folio interno UIIE',    value: d.folio },
    { label: 'Fecha de inspección',   value: `${d.fecha_inspeccion}, ${d.hora_inicio} – ${d.hora_fin} hrs` },
    { label: 'Cliente / Razón social', value: d.cliente_nombre },
    { label: 'RFC',                    value: d.cliente_rfc ?? '—' },
    { label: 'Representante legal',    value: d.cliente_representante ?? '—' },
    { label: 'Folio resolutivo CFE',   value: `${d.resolutivo_folio ?? '—'}${d.resolutivo_fecha ? ` (${d.resolutivo_fecha})` : ''}` },
    { label: 'Dictamen UVIE (DVNP)',   value: `${d.dictamen_folio_dvnp ?? '—'}${d.dictamen_uvie_nombre ? ` — ${d.dictamen_uvie_nombre}` : ''}` },
  ])

  // ── 2. UBICACIÓN ───────────────────────────────────────────────────────────
  const ubicacionTable = dataTable([
    { label: 'Dirección',  value: d.direccion },
    { label: 'Colonia',    value: d.colonia ?? '—' },
    { label: 'Código postal', value: d.codigo_postal ?? '—' },
    { label: 'Municipio',  value: d.municipio ?? '—' },
    { label: 'Ciudad',     value: d.ciudad },
    { label: 'Estado',     value: d.estado },
  ])

  // ── 3. CARACTERÍSTICAS TÉCNICAS DEL SISTEMA ────────────────────────────────
  const sistemaTable = dataTable([
    { label: 'Capacidad nominal (kWp)', value: String(d.kwp) },
    { label: 'Tipo de interconexión',   value: d.tipo_conexion ?? 'Generación Distribuida' },
    { label: 'Tipo de central',         value: d.tipo_central === 'BT' ? 'Baja Tensión (BT)' : 'Media Tensión (MT)' },
    { label: 'Número de paneles',       value: d.num_paneles != null ? String(d.num_paneles) : '—' },
    { label: 'Marca / Modelo paneles',  value: [d.marca_paneles, d.modelo_paneles].filter(Boolean).join(' ') || '—' },
    { label: 'Potencia por panel (Wp)', value: d.potencia_panel_wp != null ? String(d.potencia_panel_wp) : '—' },
    { label: 'Inversores',              value: descripcionParaPlan(d.inversores) || '—' },
    { label: 'Medidor CFE (núm. serie)', value: d.numero_medidor ?? '—' },
    { label: 'Subestación',             value: d.capacidad_subestacion_kva != null ? `${d.capacidad_subestacion_kva} kVA` : 'No aplica' },
  ])

  // Texto narrativo de inversores (mismo que va en el acta — agrupado por cert)
  const inversoresParrafo = d.inversores.length > 0
    ? para([run(textoActaInversores(d.inversores))], { spacingAfter: 200 })
    : null

  // ── 4. PERSONAL PRESENTE EN LA INSPECCIÓN ──────────────────────────────────
  // Solo el inspector ejecutor + atiende + testigos. El inspector responsable
  // NO se lista aquí: él revisa el expediente desde la oficina y emite el
  // certificado (firma al final del informe), no asiste a la visita.
  const personalRows: { label: string; value: string }[] = [
    { label: 'Inspector ejecutor',       value: `${d.inspector_nombre}${d.inspector_cedula ? ` (Cédula: ${d.inspector_cedula})` : ''}` },
    {
      label: 'Persona que atiende la visita',
      value: [
        d.atiende_nombre,
        d.atiende_correo ? `<${d.atiende_correo}>` : null,
        d.atiende_telefono ? `tel. ${d.atiende_telefono}` : null,
      ].filter(Boolean).join(' '),
    },
  ]
  d.testigos.slice(0, 2).forEach((t, i) => {
    personalRows.push({
      label: `Testigo ${i + 1}`,
      value: [
        `${t.nombre} ${t.apellidos ?? ''}`.trim(),
        t.numero_ine ? `INE: ${t.numero_ine}` : null,
      ].filter(Boolean).join(' — '),
    })
  })
  const personalTable = dataTable(personalRows)

  // ── 5. DOCUMENTOS INSPECCIONADOS ───────────────────────────────────────────
  const docsParrafo = d.documentos_inspeccionados.length === 0
    ? para([run('No se registraron documentos en el expediente.', { color: '666666' })])
    : null
  const docsTabla = d.documentos_inspeccionados.length > 0
    ? documentosTable(d.documentos_inspeccionados)
    : null

  const docsResumen = para([
    run('El cliente entregó un total de '),
    run(String(d.documentos_inspeccionados.length), { bold: true }),
    run(' documentos técnico-regulatorios para integrar el expediente. Toda la evidencia ' +
        'documental es responsabilidad del cliente; el inspector verificó la integridad, ' +
        'autenticidad y vigencia de cada documento conforme a los requerimientos de las DACG.'),
  ])

  // ── 6. RESULTADO DE LA INSPECCIÓN ──────────────────────────────────────────
  const resultadoColor = d.resultado === 'aprobado'
    ? '0A5C36'
    : d.resultado === 'condicionado'
      ? 'B45309'
      : '991B1B'
  const resultadoTexto = d.resultado === 'aprobado'
    ? 'APROBADO — La instalación CUMPLE con los requisitos DACGS'
    : d.resultado === 'condicionado'
      ? 'CONDICIONADO — Cumple parcialmente, ver observaciones'
      : 'NO APROBADO — La instalación NO CUMPLE con los requisitos DACGS'

  const resultadoBlock = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 8, color: resultadoColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: resultadoColor },
          left:   { style: BorderStyle.SINGLE, size: 8, color: resultadoColor },
          right:  { style: BorderStyle.SINGLE, size: 8, color: resultadoColor },
        },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: resultadoTexto, bold: true, size: pt(11), font: FONT, color: resultadoColor })],
        })],
      })],
    })],
  })

  const observacionesParrafo = d.observaciones?.trim()
    ? para([
        run('Observaciones del inspector: ', { bold: true }),
        run(d.observaciones),
      ])
    : null

  // ── 7. CONCLUSIÓN ──────────────────────────────────────────────────────────
  const conclusionParrafo = para([run(textoCumplimiento(d))], { spacingAfter: 220 })

  const certificadoParrafo = d.num_certificado
    ? para([
        run('Como resultado de la presente inspección, se emite el Certificado de Cumplimiento '),
        run(d.num_certificado, { bold: true }),
        run(d.fecha_certificado ? ` con fecha ${d.fecha_certificado}` : ''),
        run(', el cual se anexa al expediente para los efectos legales correspondientes.'),
      ])
    : para([
        run('Una vez subsanadas las observaciones (si las hubiera), se procederá a la emisión ' +
            'del Certificado de Cumplimiento correspondiente.'),
      ])

  // ── Firma del inspector ────────────────────────────────────────────────────
  const firmaTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 4680, type: WidthType.DXA },
          borders: NO_BORDERS,
          margins: { top: 600, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
              children: [],
              spacing: { after: 60 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: d.inspector_nombre, bold: true, size: pt(9), font: FONT })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Inspector ejecutor', size: pt(8), font: FONT })],
            }),
            d.inspector_cedula ? new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `Cédula: ${d.inspector_cedula}`, size: pt(8), font: FONT })],
            }) : new Paragraph({ children: [] }),
          ],
        }),
        new TableCell({
          width: { size: 4680, type: WidthType.DXA },
          borders: NO_BORDERS,
          margins: { top: 600, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
              children: [],
              spacing: { after: 60 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: d.inspector_responsable_nombre ?? d.inspector_nombre,
                bold: true, size: pt(9), font: FONT,
              })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: 'Inspector responsable de la UIIE — revisa y emite el certificado',
                size: pt(8), font: FONT,
              })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.',
                size: pt(7), font: FONT,
              })],
            }),
          ],
        }),
      ],
    })],
  })

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Informe de Inspección — ${d.folio} | UIIE-CRE-021 | Página `, size: pt(7), font: FONT }),
        new TextRun({ children: [PageNumber.CURRENT], size: pt(7), font: FONT }),
        new TextRun({ text: ' de ', size: pt(7), font: FONT }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: pt(7), font: FONT }),
      ],
    })],
  })

  // ── Ensamblaje ─────────────────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [
    headerTable,
    blankLine(),

    para([
      run('El presente Informe de Inspección documenta el proceso de verificación realizado por la ' +
          'Unidad de Inspección de Instalaciones Eléctricas (UIIE) acreditada ante la Comisión ' +
          'Nacional de Energía, conforme al procedimiento '),
      run('UIIE-CRE-021', { bold: true }),
      run(', para la instalación fotovoltaica descrita a continuación. Forma parte del paquete ' +
          'documental requerido por las Disposiciones Administrativas de Carácter General (DACG) ' +
          'aplicables a los sistemas de generación distribuida.'),
    ], { spacingAfter: 160 }),

    sectionTitle('1. Datos generales del expediente'),
    datosGeneralesTable,

    sectionTitle('2. Ubicación del proyecto'),
    ubicacionTable,

    sectionTitle('3. Características técnicas del sistema'),
    sistemaTable,
    blankLine(),
    ...(inversoresParrafo ? [inversoresParrafo] : []),

    sectionTitle('4. Personal presente durante la inspección'),
    personalTable,
    blankLine(),
    para([
      run('La visita de inspección fue ejecutada por el inspector arriba indicado, acompañado ' +
          'por la persona que el cliente designó para atender la verificación' +
          (d.testigos.length > 0 ? ' y los testigos correspondientes' : '') +
          '. La identificación oficial INE de cada participante fue verificada y se incluye ' +
          'copia digital en la carpeta "6. IDENTIFICACIONES" del paquete documental.'),
    ]),

    sectionTitle('5. Documentos inspeccionados'),
    docsResumen,
    blankLine(),
    ...(docsTabla ? [docsTabla] : []),
    ...(docsParrafo ? [docsParrafo] : []),

    sectionTitle('6. Resultado de la inspección'),
    resultadoBlock,
    blankLine(),
    ...(observacionesParrafo ? [observacionesParrafo] : []),

    sectionTitle('7. Conclusión y cumplimiento DACG'),
    conclusionParrafo,
    certificadoParrafo,

    blankLine(),
    blankLine(),
    firmaTable,
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },                     // US Letter
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      headers: { default: new Header({ children: [] }) },
      footers: { default: footer },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
