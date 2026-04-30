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
  LevelFormat,
} from 'docx'
import fs from 'fs'

export interface CotizacionData {
  folio: string
  fecha: string
  cliente_nombre: string
  cliente_rfc?: string
  cliente_representante?: string
  ciudad_instalacion: string
  estado_instalacion: string
  kwp: number
  tipo_conexion: string
  precio_sin_iva: number
  precio_con_iva: number
  inspector_nombre: string
  inspector_cedula?: string
  vigencia_dias: number
  condiciones?: string[]
  logoSrc?: string
}

// ─── constants ───────────────────────────────────────────────────────────────

const BANCO = {
  banco: 'BBVA Bancomer',
  cuenta: '0120855219',
  clabe: '012760001208552195',
  tarjeta: '4555 1130 1204 5680',
  nombre: 'Inteligencia en Ahorro de Energía S.A. de C.V.',
  rfc: 'IAE160824L54',
  facturacion: 'facturas@ciae.com.mx',
}

const TIPO_CONEXION_LABEL: Record<string, string> = {
  generacion_distribuida: 'Generación Distribuida',
  net_metering: 'Net Metering',
  autoconsumo: 'Autoconsumo',
  isla: 'Sistema Aislado (Isla)',
  interconectado: 'Interconectado a la Red',
}

// ─── helpers ────────────────────────────────────────────────────────────────

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
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
  return points * 2
}

const CONTENT_WIDTH = 9360 // US Letter portrait, 1" margins

function formatCurrency(amount: number): string {
  return (
    '$' +
    amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    ' M.N.'
  )
}

function simplePara(
  text: string,
  opts: {
    bold?: boolean
    size?: number
    color?: string
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
    spacingBefore?: number
    spacingAfter?: number
  } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.spacingBefore ?? 80, after: opts.spacingAfter ?? 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: pt(opts.size ?? 10),
        color: opts.color,
      }),
    ],
  })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 2 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: pt(10),
        color: '555555',
      }),
    ],
  })
}

// ─── service table ────────────────────────────────────────────────────────────

function makeServiceTable(datos: CotizacionData): Table {
  const iva = datos.precio_con_iva - datos.precio_sin_iva

  // Column widths: Description 4200 | Capacidad 1560 | Precio unit 1800 | Importe 1800 = 9360
  const colWidths = [4200, 1560, 1800, 1800]

  function headerCell(text: string, width: number): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: ALL_BORDERS,
      shading: { fill: '0F6E56', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: pt(9), color: 'FFFFFF' })],
        }),
      ],
    })
  }

  function amountCell(text: string, width: number, fill = 'FFFFFF', bold = false): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: ALL_BORDERS,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text, bold, size: pt(9) })],
        }),
      ],
    })
  }

  function labelCell(text: string, width: number, fill = 'FFFFFF', bold = false, color?: string): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: ALL_BORDERS,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: pt(9), color })],
        }),
      ],
    })
  }

  function emptyCell(width: number, fill = 'FFFFFF'): TableCell {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: ALL_BORDERS,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [] })],
    })
  }

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      // Header
      new TableRow({
        children: [
          headerCell('Descripción del Servicio', colWidths[0]),
          headerCell('Capacidad', colWidths[1]),
          headerCell('Precio Unitario', colWidths[2]),
          headerCell('Importe', colWidths[3]),
        ],
      }),
      // Service row
      new TableRow({
        children: [
          labelCell('Inspección de instalación fotovoltaica', colWidths[0]),
          new TableCell({
            width: { size: colWidths[1], type: WidthType.DXA },
            borders: ALL_BORDERS,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${datos.kwp} kWp`, size: pt(9) })],
              }),
            ],
          }),
          amountCell(formatCurrency(datos.precio_sin_iva), colWidths[2]),
          amountCell(formatCurrency(datos.precio_sin_iva), colWidths[3]),
        ],
      }),
      // Subtotal
      new TableRow({
        children: [
          labelCell('Subtotal', colWidths[0], 'F3F3F3', true),
          emptyCell(colWidths[1], 'F3F3F3'),
          emptyCell(colWidths[2], 'F3F3F3'),
          amountCell(formatCurrency(datos.precio_sin_iva), colWidths[3], 'F3F3F3', true),
        ],
      }),
      // IVA
      new TableRow({
        children: [
          labelCell('IVA (16%)', colWidths[0], 'F3F3F3'),
          emptyCell(colWidths[1], 'F3F3F3'),
          emptyCell(colWidths[2], 'F3F3F3'),
          amountCell(formatCurrency(iva), colWidths[3], 'F3F3F3'),
        ],
      }),
      // Total
      new TableRow({
        children: [
          new TableCell({
            width: { size: colWidths[0], type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: '0F6E56', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'TOTAL A PAGAR', bold: true, size: pt(10), color: 'FFFFFF' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[1], type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: '0F6E56', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: colWidths[2], type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: '0F6E56', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: colWidths[3], type: WidthType.DXA },
            borders: ALL_BORDERS,
            shading: { fill: '0F6E56', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: formatCurrency(datos.precio_con_iva),
                    bold: true,
                    size: pt(10),
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── bank data table ──────────────────────────────────────────────────────────

function makeBankTable(): Table {
  // 2 col pairs: label | value | label | value
  const colWidths = [1440, 3240, 1440, 3240] // 9360 total

  function lbl(text: string): TableCell {
    return new TableCell({
      width: { size: 1440, type: WidthType.DXA },
      borders: ALL_BORDERS,
      shading: { fill: 'F0F0F0', type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: pt(9) })],
        }),
      ],
    })
  }

  function val(text: string): TableCell {
    return new TableCell({
      width: { size: 3240, type: WidthType.DXA },
      borders: ALL_BORDERS,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: [new TextRun({ text, size: pt(9) })],
        }),
      ],
    })
  }

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: [lbl('Cuenta'), val(BANCO.cuenta), lbl('CLABE'), val(BANCO.clabe)] }),
      new TableRow({ children: [lbl('Tarjeta'), val(BANCO.tarjeta), lbl('RFC'), val(BANCO.rfc)] }),
    ],
  })
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generarCotizacionDocx(datos: CotizacionData): Promise<Buffer> {
  // Logo
  let logoImage: Buffer | null = null
  if (datos.logoSrc) {
    try {
      logoImage = fs.readFileSync(datos.logoSrc)
    } catch {
      logoImage = null
    }
  }

  const tipoLabel = TIPO_CONEXION_LABEL[datos.tipo_conexion] ?? datos.tipo_conexion
  const anticipo = formatCurrency(datos.precio_con_iva * 0.5)
  const lugarInstalacion = `${datos.ciudad_instalacion}, ${datos.estado_instalacion}`

  // ── Header ──
  const headerChildren: Paragraph[] = []
  if (logoImage) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new ImageRun({
            type: 'png',
            data: logoImage,
            transformation: { width: 80, height: 60 },
            altText: { title: 'Logo', description: 'Logo empresa', name: 'Logo' },
          }),
        ],
      })
    )
  }
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160 },
      children: [
        new TextRun({
          text: 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.',
          bold: true,
          size: pt(13),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'COTIZACIÓN DE SERVICIOS DE INSPECCIÓN',
          bold: true,
          size: pt(11),
        }),
      ],
    })
  )

  // ── Folio row ──
  const folioRow = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 80, after: 160 },
    children: [
      new TextRun({
        text: `No. Cotización: ${datos.folio}  |  Fecha: ${datos.fecha}`,
        size: pt(9),
        bold: true,
      }),
    ],
  })

  // ── Datos del Solicitante ──
  const datosRows: Paragraph[] = [sectionHeading('Datos del Solicitante')]

  const labelValuePara = (label: string, value: string): Paragraph =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: pt(9) }),
        new TextRun({ text: value, size: pt(9) }),
      ],
    })

  datosRows.push(labelValuePara('Nombre / Razón social', datos.cliente_nombre))
  if (datos.cliente_rfc) {
    datosRows.push(labelValuePara('RFC', datos.cliente_rfc))
  }
  if (datos.cliente_representante) {
    datosRows.push(labelValuePara('Representante', datos.cliente_representante))
  }
  datosRows.push(labelValuePara('Lugar de instalación', lugarInstalacion))
  datosRows.push(labelValuePara('Tipo de conexión', tipoLabel))

  // ── Desglose del Servicio ──
  const servicioSection: (Paragraph | Table)[] = [
    sectionHeading('Desglose del Servicio'),
    new Paragraph({ children: [] }),
    makeServiceTable(datos),
    new Paragraph({ children: [] }),
  ]

  // ── Datos para el Pago ──
  const pagoSection: (Paragraph | Table)[] = [
    sectionHeading('Datos para el Pago'),
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: `${BANCO.banco} — ${BANCO.nombre}`, bold: true, size: pt(9) }),
      ],
    }),
    makeBankTable(),
    new Paragraph({
      spacing: { before: 100, after: 80 },
      children: [
        new TextRun({ text: 'Para facturación, enviar comprobante a ', size: pt(9) }),
        new TextRun({ text: BANCO.facturacion, bold: true, size: pt(9) }),
        new TextRun({ text: ' · Fecha límite: día 27 de cada mes.', size: pt(9) }),
      ],
    }),
  ]

  // ── Condiciones del Servicio ──
  const defaultConditions: string[] = [
    `50% de anticipo (${anticipo}) para agendar la visita; liquidación antes de la inspección.`,
    'Los viáticos de traslado son a cargo del solicitante y no están incluidos en este precio.',
    `Vigencia de esta cotización: ${datos.vigencia_dias} días hábiles a partir de la fecha de emisión.`,
    `Para solicitar factura enviar comprobante de pago y Cédula de Identificación Fiscal a facturas@ciae.com.mx.`,
  ]
  const allConditions = [...defaultConditions, ...(datos.condiciones ?? [])]

  const condicionesSection: Paragraph[] = [
    sectionHeading('Condiciones del Servicio'),
    ...allConditions.map(
      (cond) =>
        new Paragraph({
          numbering: { reference: 'bullets-cotizacion', level: 0 },
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: cond, size: pt(9) })],
        })
    ),
  ]

  // ── Signature ──
  const signatureSection: Paragraph[] = [
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Atentamente,', size: pt(9) })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 },
      },
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: datos.inspector_nombre,
          bold: true,
          size: pt(9),
          color: '0F6E56',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Inspector Responsable — UIIE-CRE-021', size: pt(8) }),
      ],
    }),
    ...(datos.inspector_cedula
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Cédula Profesional: ${datos.inspector_cedula}`,
                size: pt(8),
              }),
            ],
          }),
        ]
      : []),
  ]

  // Footer
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Cotización ${datos.folio} | CIAE — UIIE-CRE-021 · RFC: IAE160824L54 | Página `,
            size: pt(7),
          }),
          new TextRun({ children: [PageNumber.CURRENT], size: pt(7) }),
          new TextRun({ text: ' de ', size: pt(7) }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: pt(7) }),
        ],
      }),
    ],
  })

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets-cotizacion',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({ children: [] }),
        },
        footers: {
          default: footer,
        },
        children: [
          ...headerChildren,
          folioRow,
          ...datosRows,
          new Paragraph({ children: [] }),
          ...servicioSection,
          ...pagoSection,
          new Paragraph({ children: [] }),
          ...condicionesSection,
          ...signatureSection,
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
