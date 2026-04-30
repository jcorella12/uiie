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
} from 'docx'
import fs from 'fs'

export interface PlanData {
  logoSrc?: string
  folio: string
  fecha_emision: string
  fecha_visita: string
  cliente_nombre: string
  atiende_nombre?: string
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number
  resolutivo_folio: string
  resolutivo_fecha?: string
  tipo_central: string
  num_inversores?: number
  marca_inversor?: string
  modelo_inversor?: string
}

// ─── helpers ────────────────────────────────────────────────────────────────

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' }
const ALL_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
}

function pt(points: number) {
  return points * 2
}

// US Letter portrait, 1" margins → content width = 9360 DXA
const CONTENT_WIDTH = 9360

function para(
  runs: { text: string; bold?: boolean; size?: number; color?: string }[],
  opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number } } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80, ...opts.spacing },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold,
          size: pt(r.size ?? 9),
          color: r.color,
        })
    ),
  })
}

function invDesc(d: PlanData): string {
  const n = d.num_inversores ?? 1
  const marca = d.marca_inversor ?? ''
  const modelo = d.modelo_inversor ?? ''
  if (n > 1) {
    return `${n} inversores${marca ? ' ' + marca : ''}${modelo ? ' ' + modelo : ''}`
  }
  return `inversor${marca ? ' ' + marca : ''}${modelo ? ' ' + modelo : ''}`
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generarPlanDocx(datos: PlanData): Promise<Buffer> {
  // Logo
  let logoImage: Buffer | null = null
  if (datos.logoSrc) {
    try {
      logoImage = fs.readFileSync(datos.logoSrc)
    } catch {
      logoImage = null
    }
  }

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

  // Header table: logo | company + doc title | info
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

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [1080, 5400, 2880],
    rows: [
      new TableRow({
        children: [
          logoCell,
          new TableCell({
            width: { size: 5400, type: WidthType.DXA },
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
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Plan de Inspección', bold: true, size: pt(9) }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2880, type: WidthType.DXA },
            borders: ALL_BORDERS,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `Proyecto: ${datos.folio}`, bold: true, size: pt(8) })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Plan: UIIE-CRE-021`, size: pt(7) })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Fecha emisión: ${datos.fecha_emision}`, size: pt(7) })],
              }),
              new Paragraph({
                children: [new TextRun({ text: 'Página: ', size: pt(7) })],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  // Body paragraphs
  const bodyParas: Paragraph[] = [
    new Paragraph({ children: [] }),

    para([
      { text: 'Se programa visita de inspección a: ' },
      { text: datos.cliente_nombre, bold: true },
    ]),

    para([
      { text: 'Ubicación geográfica: ' },
      { text: `${direccionCompleta}.`, bold: true },
    ]),

    para([
      { text: 'Alcance de la inspección: Instalación fotovoltaica ' },
      { text: `${datos.kwp} kWp`, bold: true },
      { text: '.' },
    ]),

    para([
      { text: 'Estudio de instalaciones número: ' },
      { text: datos.resolutivo_folio, bold: true },
      { text: ' con fecha el ' },
      { text: datos.resolutivo_fecha ?? '—', bold: true },
      { text: '.' },
    ]),

    para([
      { text: 'Con fecha: ' },
      { text: datos.fecha_visita, bold: true },
      {
        text: ', se realizará visita de inspección en las instalaciones del cliente con el fin de verificar el cumplimiento de los requisitos técnicos establecidos en las Disposiciones Administrativas de Carácter General (DACG) aplicables a los sistemas de generación distribuida interconectados a la red eléctrica nacional, conforme a los lineamientos de la Comisión Reguladora de Energía (CRE) para la UIIE-CRE-021.',
      },
    ]),

    para([
      {
        text: 'Durante la visita se verificará el cumplimiento de los requisitos documentales y de campo señalados en las DACG, incluyendo la revisión de la documentación técnica, la inspección física de los componentes de la instalación y la toma de evidencias fotográficas.',
      },
    ]),

    para([
      {
        text: 'Se solicitará acceso a la subestación de interconexión bajo el esquema de ',
      },
      { text: datos.tipo_central, bold: true },
      {
        text: ', así como a los tableros de distribución, centro de carga y punto de medición, para la revisión de protecciones, interruptores y equipos de seccionamiento conforme a los incisos de la lista de verificación.',
      },
    ]),

    para([
      { text: 'Asimismo, se inspeccionarán los ' },
      { text: invDesc(datos), bold: true },
      {
        text: ', verificando su certificación, características nominales y correcta instalación de acuerdo con las normas aplicables.',
      },
    ]),

    para([
      {
        text: 'La duración estimada de la visita de inspección es de 2.5 horas aproximadamente. Se solicita al cliente designar un representante o personal técnico que acompañe al inspector durante el recorrido y proporcione el acceso a todas las áreas e instalaciones requeridas.',
      },
    ]),

    para([
      {
        text: 'Para cualquier queja o aclaración respecto al servicio de inspección, el cliente podrá comunicarse al correo electrónico ',
      },
      { text: 'contacto@ciae.mx', bold: true },
      { text: ' o al teléfono indicado en el contrato de inspección.' },
    ]),

    new Paragraph({ children: [] }),
  ]

  // Horizontal rule
  const hrPara = new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 },
    },
    children: [],
    spacing: { before: 120, after: 120 },
  })

  // Closing paragraphs
  const closingParas: Paragraph[] = [
    new Paragraph({ children: [] }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: 'ATENTAMENTE', bold: true, size: pt(9) })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: 'INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.',
          bold: true,
          size: pt(9),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: 'UIIE-CRE-021', size: pt(9) })],
    }),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    new Paragraph({
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 },
      },
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: `Confirmar de Recibido: _________________________ ${datos.atiende_nombre ?? ''}`,
          size: pt(9),
        }),
      ],
    }),
  ]

  // Footer
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${datos.folio} | CIAE — UIIE-CRE-021 | Página `, size: pt(7) }),
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
        children: [headerTable, ...bodyParas, hrPara, ...closingParas],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
