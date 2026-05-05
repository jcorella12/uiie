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
  UnderlineType,
  PageOrientation,
} from 'docx'
import fs from 'fs'

export interface ListaData {
  logoSrc?: string
  folio: string
  fecha: string
  cliente_nombre: string
  atiende_nombre: string
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  inspector_nombre: string
  tipo_central: string // 'MT' | 'BT'
  tiene_ccfp: boolean
  numero_medidor: string
  tiene_i1_i2: boolean
  dictamen_folio_dvnp: string
  num_inversores: number
  marca_inversor: string
  modelo_inversor: string
  certificacion_inversor: 'ul1741' | 'ieee1547' | 'homologado_cne' | 'ninguna'
  /** Texto largo de homologación CNE para sustituir la celda de UL */
  homologacion_redaccion?: string
  capacidad_subestacion_kva?: number
  resultado: 'aprobado' | 'rechazado' | 'condicionado'
}

// ─── helpers ────────────────────────────────────────────────────────────────

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' }
const ALL_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
}
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

function pt(points: number) {
  return points * 2 // half-points
}

function grayCell(
  text: string,
  width: number,
  fill = 'CCCCCC',
  span = 1,
  bold = true,
  fontSize = 8
): TableCell {
  return new TableCell({
    columnSpan: span,
    width: { size: width, type: WidthType.DXA },
    borders: ALL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, bold, size: pt(fontSize) }),
        ],
      }),
    ],
  })
}

function dataCell(
  content: Paragraph | Paragraph[],
  width: number,
  fill = 'FFFFFF',
  span = 1
): TableCell {
  const children = Array.isArray(content) ? content : [content]
  return new TableCell({
    columnSpan: span,
    width: { size: width, type: WidthType.DXA },
    borders: ALL_BORDERS,
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children,
  })
}

function textPara(
  text: string,
  opts: { bold?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: pt(opts.size ?? 8),
        color: opts.color,
      }),
    ],
  })
}

function centerX(text: string, fill: string, totalWidth: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 9,
        width: { size: totalWidth, type: WidthType.DXA },
        borders: ALL_BORDERS,
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: pt(8) })],
          }),
        ],
      }),
    ],
  })
}

// Column widths (DXA) — must sum to 12960
const W = {
  inciso: 600,
  cuestion: 1200,
  exSI: 480,
  exNO: 480,
  exNA: 480,
  criterio: 2520,
  cumSI: 480,
  cumNO: 480,
  obs: 6240,
}
const TOTAL = 12960

// ─── inspection rows ─────────────────────────────────────────────────────────

interface Fila {
  inciso: string
  cuestionamiento: string
  criterio: string
  cumple: boolean | null // null = N/A
  observacion: string
  rowFill: string
}

function buildFilas(d: ListaData): Fila[] {
  const tc = d.tipo_central
  const fills = ['FFFFFF', 'F9F9F9']

  const certLabel =
    d.certificacion_inversor === 'ul1741'
      ? 'UL1741'
      : d.certificacion_inversor === 'ieee1547'
        ? 'IEEE 1547'
        : d.certificacion_inversor === 'homologado_cne'
          ? 'HOMOLOGADO A UL (CNE oficio F00.06.UE/225/2026)'
          : ''

  const invPlural = d.num_inversores > 1
  const invDesc = invPlural
    ? `Los ${d.num_inversores} inversores ${d.marca_inversor} ${d.modelo_inversor} cuentan`
    : `El inversor ${d.marca_inversor} ${d.modelo_inversor} cuenta`

  const rows: Omit<Fila, 'rowFill'>[] = [
    {
      inciso: '1.1',
      cuestionamiento: 'Corta circuito Fusible de Potencia',
      criterio: `Corta circuito Fusible de Potencia de Acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}`,
      cumple: d.tiene_ccfp,
      observacion: d.tiene_ccfp
        ? `Se encontraron los CCFP en la instalación por lo cual Cumple. La persona encargada de la visita que se presentó como ${d.atiende_nombre} y que se identificó con credencial emitida por el INE, quien durante la inspección mostró la bajada área de las líneas de CFE donde se encontraba el CCFP.`
        : 'No se encontraron los CCFP en la instalación por lo cual No Cumple.',
    },
    {
      inciso: '1.2',
      cuestionamiento: 'Medidor Fiscal',
      criterio: `Medidor Fiscal con las Características requeridas para interconexión ${tc}`,
      cumple: true,
      observacion: `El centro de carga cuenta con un medidor fiscal, de acuerdo a lo descrito en la DACG en modelo ${tc}, por lo cual cumple. Se encontró un medidor instalado en sitio con Serie ${d.numero_medidor} el cual cumple con las especificaciones CFE G0000-48.`,
    },
    {
      inciso: '1.3',
      cuestionamiento: 'Protecciones Eléctricas',
      criterio: `Protecciones de Acuerdo a I1 e I2 de los sistemas ${tc}`,
      cumple: d.tiene_i1_i2,
      observacion: d.tiene_i1_i2
        ? `Se encontraron por protecciones I1 e I2 en todos los inversores por lo cual cumple. Se localizaron diferentes interruptores exclusivos de las centrales, estos interruptores cuentan con diferentes capacidades y marcas, dependiendo del tamaño de los inversores. Estos interruptores ya fueron aprobados por la Unidad de Verificación en su dictamen ${d.dictamen_folio_dvnp}.`
        : 'No se encontraron protecciones I1 e I2 en los inversores por lo cual No Cumple.',
    },
    {
      inciso: '1.4',
      cuestionamiento: 'Certificaciones de operación en Campo',
      criterio:
        'Inversor Cuenta con la certificación UL o cumple con los requerimientos establecidos en las DACGS',
      cumple: d.certificacion_inversor !== 'ninguna',
      observacion:
        d.certificacion_inversor === 'homologado_cne'
          ? (d.homologacion_redaccion ?? `${invDesc} con homologación oficial a UL 1741 reconocida por la Comisión Nacional de Energía mediante el oficio F00.06.UE/225/2026 del 28 de enero de 2026, en el cual se acreditan las pruebas de la Tabla 5 de la RES/142/2017 mediante reportes IEEE 1547 e IEC 61727. Por lo cual CUMPLE.`)
          : d.certificacion_inversor !== 'ninguna'
            ? `${invDesc} con certificación ${certLabel} por lo cual cumple. El inversor cuenta con certificados emitidos por laboratorios extranjeros, los cuales demuestran el cumplimiento con las características para interconexión.`
            : `El inversor ${d.marca_inversor} ${d.modelo_inversor} no cuenta con certificación UL1741 ni IEEE 1547. No Cumple.`,
    },
    {
      inciso: '1.5',
      cuestionamiento: 'Sub Estación Eléctrica',
      criterio:
        'Subestación Eléctrica de acuerdo a la capacidad fotovoltaica instalada',
      cumple: d.capacidad_subestacion_kva != null ? true : null,
      observacion:
        d.capacidad_subestacion_kva != null
          ? `La central eléctrica no está por arriba del 80% de la capacidad fotovoltaica por lo cual cumple. Se encontró en campo una subestación de capacidad de ${d.capacidad_subestacion_kva} KVA. Tomando en cuenta la potencia en AC.`
          : 'N/A — No aplica subestación en esta instalación.',
    },
  ]

  return rows.map((r, i) => ({ ...r, rowFill: fills[i % 2] }))
}

function makeDataRow(fila: Fila): TableRow {
  const { inciso, cuestionamiento, criterio, cumple, observacion, rowFill } = fila

  // EXISTE columns
  const exSI = cumple !== null ? 'X' : ''
  const exNO = ''
  const exNA = cumple === null ? 'X' : ''

  // CUMPLIMIENTO columns
  const cumSI = cumple === true ? 'X' : ''
  const cumNO = cumple === false ? 'X' : ''
  const cumSIColor = '0A5C36'
  const cumNOColor = '991B1B'

  return new TableRow({
    children: [
      dataCell(textPara(inciso, { size: 8 }), W.inciso, rowFill),
      dataCell(textPara(cuestionamiento, { size: 8 }), W.cuestion, rowFill),
      dataCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: exSI, size: pt(8) })],
        }),
        W.exSI,
        rowFill
      ),
      dataCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: exNO, size: pt(8) })],
        }),
        W.exNO,
        rowFill
      ),
      dataCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: exNA, size: pt(8) })],
        }),
        W.exNA,
        rowFill
      ),
      dataCell(textPara(criterio, { size: 8 }), W.criterio, rowFill),
      dataCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: cumSI, size: pt(8), color: cumSIColor, bold: true }),
          ],
        }),
        W.cumSI,
        rowFill
      ),
      dataCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: cumNO, size: pt(8), color: cumNOColor, bold: true }),
          ],
        }),
        W.cumNO,
        rowFill
      ),
      dataCell(textPara(observacion, { size: 8 }), W.obs, rowFill),
    ],
  })
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generarListaDocx(datos: ListaData): Promise<Buffer> {
  // Logo
  let logoImage: Buffer | null = null
  if (datos.logoSrc) {
    try {
      logoImage = fs.readFileSync(datos.logoSrc)
    } catch {
      logoImage = null
    }
  }

  const logoCell = new TableCell({
    width: { size: 1080, type: WidthType.DXA },
    borders: ALL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: logoImage
          ? [
              new ImageRun({
                type: 'png',
                data: logoImage,
                transformation: { width: 60, height: 50 },
                altText: { title: 'Logo', description: 'Logo empresa', name: 'Logo' },
              }),
            ]
          : [new TextRun({ text: 'LOGO', size: pt(8), bold: true })],
      }),
    ],
  })

  const direccionCompleta = [
    datos.direccion,
    datos.colonia,
    datos.codigo_postal,
    datos.municipio,
    datos.ciudad,
    datos.estado,
  ]
    .filter(Boolean)
    .join(', ')

  // Header table
  const headerTable = new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [1080, 8000, 3880],
    rows: [
      new TableRow({
        children: [
          logoCell,
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            borders: ALL_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.',
                    bold: true,
                    size: pt(10),
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3880, type: WidthType.DXA },
            borders: ALL_BORDERS,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              textPara(`Proyecto: ${datos.folio}`, { size: 8, bold: true }),
              textPara(`CLIENTE: ${datos.cliente_nombre}`, { size: 7 }),
              textPara(`Fecha: ${datos.fecha}`, { size: 7 }),
              textPara(`DIRECCIÓN: ${direccionCompleta}`, { size: 7 }),
            ],
          }),
        ],
      }),
    ],
  })

  // Title paragraph
  const titlePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [
      new TextRun({
        text: 'Lista de Inspección',
        bold: true,
        size: pt(12),
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
  })

  // Inspection table header row 1
  const headerRow1 = new TableRow({
    children: [
      grayCell('Inciso', W.inciso),
      grayCell('CUESTIONAMIENTO', W.cuestion),
      grayCell('EXISTE DOCUMENTAL/CAMPO', W.exSI + W.exNO + W.exNA, 'CCCCCC', 3),
      grayCell('CRITERIO ACEPTACIÓN/RECHAZO', W.criterio),
      grayCell('CUMPLIMIENTO', W.cumSI + W.cumNO, 'CCCCCC', 2),
      grayCell('OBSERVACIONES', W.obs),
    ],
  })

  // Inspection table header row 2
  const headerRow2 = new TableRow({
    children: [
      grayCell('', W.inciso),
      grayCell('', W.cuestion),
      grayCell('SI', W.exSI),
      grayCell('NO', W.exNO),
      grayCell('N/A', W.exNA),
      grayCell('', W.criterio),
      grayCell('SI', W.cumSI),
      grayCell('NO', W.cumNO),
      grayCell('', W.obs),
    ],
  })

  const sectionRow = centerX('Subestaciones y Líneas', 'BBBBBB', TOTAL)

  const filas = buildFilas(datos)
  const dataRows = filas.map(makeDataRow)

  const inspectionTable = new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [
      W.inciso,
      W.cuestion,
      W.exSI,
      W.exNO,
      W.exNA,
      W.criterio,
      W.cumSI,
      W.cumNO,
      W.obs,
    ],
    rows: [headerRow1, headerRow2, sectionRow, ...dataRows],
  })

  // Signatures table
  const sigTable = new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [6480, 6480],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6480, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 200, bottom: 80, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
                spacing: { before: 600 },
                children: [
                  new TextRun({ text: `CLIENTE: ${datos.atiende_nombre}`, size: pt(9) }),
                ],
              }),
              textPara('Nombre y Firma del Cliente', { size: 8, align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            width: { size: 6480, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 200, bottom: 80, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
                spacing: { before: 600 },
                children: [
                  new TextRun({
                    text: `INSPECTOR: ${datos.inspector_nombre}`,
                    size: pt(9),
                  }),
                ],
              }),
              textPara('Nombre y Firma del Inspector', { size: 8, align: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  })

  // Footer
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${datos.folio} | Lista de Inspección — UIIE-CRE-021 | Página `, size: pt(7) }),
          new TextRun({ children: [PageNumber.CURRENT], size: pt(7) }),
          new TextRun({ text: ' de ', size: pt(7) }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: pt(7) }),
        ],
      }),
    ],
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: new Header({ children: [] }),
        },
        footers: {
          default: footer,
        },
        children: [
          headerTable,
          titlePara,
          inspectionTable,
          new Paragraph({ children: [] }),
          sigTable,
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
