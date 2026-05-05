import * as fs from 'fs'
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
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  HeadingLevel,
} from 'docx'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ActaData {
  logoSrc?: string               // path to logo PNG file (may be undefined)
  folio: string
  fecha_inspeccion: string       // "15 de enero de 2026"
  hora_inicio: string            // "10:00"
  hora_fin: string               // "12:00"
  inspector_nombre: string
  inspector_cedula?: string
  inspector_responsable_nombre?: string
  atiende_nombre: string
  atiende_identificacion?: string
  atiende_numero_id?: string
  testigo1_nombre: string
  testigo1_numero_ine: string
  testigo1_identificacion?: string
  testigo1_direccion?: string
  testigo2_nombre: string
  testigo2_numero_ine: string
  testigo2_identificacion?: string
  testigo2_direccion?: string
  cliente_nombre: string
  cliente_rfc?: string
  cliente_representante?: string
  cliente_figura?: string
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number
  tipo_conexion: string
  tipo_central?: string          // 'MT' | 'BT'
  num_paneles?: number
  potencia_panel_wp?: number
  numero_medidor: string
  numero_serie_medidor?: string
  numero_cfe_medidor?: string
  num_inversores: number
  marca_inversor: string
  modelo_inversor: string
  certificacion_inversor: 'ul1741' | 'ieee1547' | 'homologado_cne' | 'ninguna'
  justificacion_ieee1547?: string
  /** Texto largo de homologación CNE (solo cuando certificacion_inversor='homologado_cne') */
  homologacion_redaccion?: string
  capacidad_subestacion_kva?: number
  tiene_i1_i2: boolean
  tiene_interruptor_exclusivo: boolean
  tiene_ccfp: boolean
  tiene_proteccion_respaldo: boolean
  resolutivo_folio: string
  resolutivo_fecha?: string
  resolutivo_tiene_cobro: boolean
  resolutivo_monto?: number
  resolutivo_referencia?: string
  dictamen_folio_dvnp: string
  dictamen_uvie_nombre?: string
  resultado: 'aprobado' | 'rechazado' | 'condicionado'
  notas_acta?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// 1440 DXA = 1 inch. US Letter = 12240 x 15840. Margins 1" each side.
// Content width = 12240 - 1440 - 1440 = 9360 DXA
const CONTENT_WIDTH = 9360
const FONT = 'Arial'
const FONT_SIZE = 18    // 9pt in half-points
const FONT_SIZE_8 = 16  // 8pt
const FONT_SIZE_7 = 14  // 7pt
const SPACING_AFTER = 120

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  }
}

function thinBorder() {
  return { style: BorderStyle.SINGLE, size: 4, color: '000000' }
}

function run(text: string, bold = false, size = FONT_SIZE): TextRun {
  return new TextRun({ text, bold, font: FONT, size })
}

function boldRun(text: string, size = FONT_SIZE): TextRun {
  return run(text, true, size)
}

function para(
  children: TextRun[],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  spacingAfter = SPACING_AFTER,
): Paragraph {
  return new Paragraph({
    children,
    alignment,
    spacing: { after: spacingAfter },
  })
}

function simplePara(
  text: string,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  bold = false,
  spacingAfter = SPACING_AFTER,
): Paragraph {
  return para([run(text, bold)], alignment, spacingAfter)
}

function separatorPara(): Paragraph {
  return simplePara(
    '- - - - - - - - - - - - - - - - - - - - - - - -',
    AlignmentType.CENTER,
    false,
    SPACING_AFTER,
  )
}

function textoInversor(d: ActaData): string {
  const n = d.num_inversores
  const marca = d.marca_inversor.toUpperCase()
  const modelo = d.modelo_inversor.toUpperCase()
  const plural = n > 1

  if (d.certificacion_inversor === 'ul1741') {
    return (
      `${plural ? `LOS ${n} INVERSORES ${marca} ${modelo} CUENTAN CON` : `EL INVERSOR ${marca} ${modelo} CUENTA CON`} ` +
      `certificado internacional UL1741 por lo cual CUMPLE con los requerimientos establecidos en las DACGS para interconexión a la red. ` +
      `${plural ? 'Los inversores cuentan con' : 'El inversor cuenta con'} certificados emitidos por laboratorios extranjeros o nacionales, los cuales demuestran el cumplimiento con las características para interconexión.`
    )
  }
  if (d.certificacion_inversor === 'homologado_cne') {
    // Si el endpoint pasó la redacción ya armada (de la tabla inversor_homologaciones), usarla
    if (d.homologacion_redaccion) return d.homologacion_redaccion
    // Fallback genérico
    return (
      `${plural ? `LOS ${n} INVERSORES ${marca} ${modelo}` : `EL INVERSOR ${marca} ${modelo}`} ` +
      `está HOMOLOGADO A UL 1741 mediante el oficio F00.06.UE/225/2026 emitido por la Comisión Nacional de Energía (CNE) ` +
      `el 28 de enero de 2026, en el cual se acredita el cumplimiento de los parámetros de la Tabla 5 de la RES/142/2017 ` +
      `mediante reportes de pruebas operativas conforme a IEEE 1547 e IEC 61727. ` +
      `Por lo anterior CUMPLE con los requerimientos establecidos en las DACGS para interconexión a la red.`
    )
  }
  if (d.certificacion_inversor === 'ieee1547') {
    const justif =
      d.justificacion_ieee1547 ??
      'El fabricante no tramitó la certificación UL1741 para este modelo en el mercado mexicano'
    return (
      `EL INVERSOR ${marca} ${modelo} NO CUENTA CON certificación UL1741. ${justif}. ` +
      `Sin embargo, cuenta con certificación IEEE 1547 por lo cual CUMPLE con los requerimientos establecidos en las DACGS para interconexión. ` +
      `El inversor cuenta con certificados emitidos por laboratorios extranjeros o nacionales que demuestran el cumplimiento con las características para interconexión.`
    )
  }
  return (
    `EL INVERSOR ${marca} ${modelo} NO CUENTA CON certificación UL1741 ni IEEE 1547. ` +
    `Se levanta reporte de hallazgos adjunto al presente acta.`
  )
}

// ─── Header table builder ─────────────────────────────────────────────────────

function buildHeaderTable(folio: string, fecha: string, logoSrc?: string): Table {
  // Logo cell content
  let logoContent: Paragraph
  if (logoSrc) {
    const imgBuffer = fs.readFileSync(logoSrc)
    logoContent = new Paragraph({
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: 60, height: 46 },
          type: 'png',
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  } else {
    logoContent = new Paragraph({
      children: [new TextRun({ text: 'LOGO', font: FONT, size: FONT_SIZE_7, color: '666666' })],
      alignment: AlignmentType.CENTER,
    })
  }

  // Col 1: Logo (1800 DXA)
  const logoCell = new TableCell({
    width: { size: 1800, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [logoContent],
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
    },
  })

  // Col 2: Company name (5040 DXA)
  const companyCell = new TableCell({
    width: { size: 5040, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [boldRun('Nombre de la Unidad de Inspección', FONT_SIZE_8)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [run('INTELIGENCIA EN EL AHORRO DE ENERGÍA S.A. DE C.V.', false, FONT_SIZE_8)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }),
    ],
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
    },
  })

  // Col 3: Right info column (2520 DXA) — implemented as a nested table for the 2-row layout
  // Top row: Proyecto + Fecha side by side
  const rightTopRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 1260, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [boldRun('Proyecto', FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [run(folio, false, FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: thinBorder(),
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: thinBorder(),
        },
      }),
      new TableCell({
        width: { size: 1260, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [boldRun('Fecha', FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [run(fecha, false, FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: thinBorder(),
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
      }),
    ],
  })

  // Bottom row: Acta title + Page X of Y
  const rightBottomRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 1260, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [boldRun('Acta de Inspección', FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [run('Formato FO-12 Rev.1', false, FONT_SIZE_7)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: thinBorder(),
        },
      }),
      new TableCell({
        width: { size: 1260, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            children: [
              run('Página ', false, FONT_SIZE_7),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_7 }),
              run(' de ', false, FONT_SIZE_7),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FONT_SIZE_7 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
      }),
    ],
  })

  const rightNestedTable = new Table({
    width: { size: 2520, type: WidthType.DXA },
    rows: [rightTopRow, rightBottomRow],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  })

  const rightCell = new TableCell({
    width: { size: 2520, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [rightNestedTable],
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
    },
  })

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [logoCell, companyCell, rightCell],
      }),
    ],
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  })
}

// ─── Signature table helpers ──────────────────────────────────────────────────

function sigLineCell(width: number, label: string, lines: { label: string; value: string }[]): TableCell {
  const children: Paragraph[] = [
    new Paragraph({
      children: [boldRun(label, FONT_SIZE_8)],
      spacing: { after: 60 },
    }),
    // Signature line via bottom border
    new Paragraph({
      children: [],
      spacing: { after: 40, before: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      },
    }),
    ...lines.map(
      (l) =>
        new Paragraph({
          children: [boldRun(l.label + ' ', FONT_SIZE_8), run(l.value, false, FONT_SIZE_8)],
          spacing: { after: 20 },
        }),
    ),
  ]

  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children,
    borders: noBorder(),
  })
}

function spacerCell(width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [new Paragraph({ children: [] })],
    borders: noBorder(),
  })
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generarActaDocx(datos: ActaData): Promise<Buffer> {
  const tc = datos.tipo_central ?? 'MT'

  const domicilio = [
    datos.direccion,
    datos.colonia ?? null,
    datos.codigo_postal ? `C.P. ${datos.codigo_postal}` : null,
    datos.ciudad,
    datos.municipio ?? null,
    datos.estado,
  ]
    .filter(Boolean)
    .join(', ')

  const idAtiende  = datos.atiende_identificacion ?? 'Instituto Nacional Electoral (INE)'
  const numAtiende = datos.atiende_numero_id ?? '—'
  const idT1       = datos.testigo1_identificacion ?? 'Instituto Nacional Electoral (INE)'
  const idT2       = datos.testigo2_identificacion ?? 'Instituto Nacional Electoral (INE)'
  const respNombre = datos.inspector_responsable_nombre ?? datos.inspector_nombre

  // ── Header table (rendered via Header section) ──
  const headerTable = buildHeaderTable(datos.folio, datos.fecha_inspeccion, datos.logoSrc)

  // ── Footer ──
  const footerPara = new Paragraph({
    children: [
      run(`${datos.folio} | Este documento es válido únicamente con firmas autógrafas originales | Página `, false, FONT_SIZE_7),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_7 }),
      run(' de ', false, FONT_SIZE_7),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FONT_SIZE_7 }),
    ],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
  })

  // ── Body paragraphs ──

  // Opening paragraph
  const openingPara = para([
    run('Siendo las '),
    boldRun(datos.hora_inicio),
    run(' horas del día '),
    boldRun(datos.fecha_inspeccion),
    run(', el inspector de Unidad de Inspección, '),
    boldRun(datos.inspector_nombre),
    run(', quien se identifica con credencial vigente expedida para las actividades relativas a la Unidad de Inspección, se presenta en '),
    boldRun(datos.cliente_nombre),
    run(' con domicilio: '),
    boldRun(domicilio),
    run('; con el objeto de realizar la inspección de la conformidad con las Disposiciones Administrativas de Carácter General según la oferta de servicios Contrato No. '),
    boldRun(datos.folio),
    run(', encontrándose presente '),
    boldRun(datos.atiende_nombre),
    run(', quien se identifica con Credencial para votar '),
    boldRun(numAtiende),
    run(', vigente y expedida por el '),
    boldRun(idAtiende),
    run(', en su carácter de Representante (o cargo de la persona), se le hace saber el derecho que tiene de designar dos testigos para que corroboren lo actuado durante la inspección, los que en su negativa serán designados por el inspector, o se asentará la falta de los mismos y la causa si se diera el caso. Los testigos designados por el Representante para la Inspección son '),
    boldRun(datos.testigo1_nombre),
    run(', con domicilio en '),
    boldRun(datos.testigo1_direccion ?? '—'),
    run(' y '),
    boldRun(datos.testigo2_nombre),
    run(', con domicilio en '),
    boldRun(datos.testigo2_direccion ?? '—'),
    run(' quien se identifica con Credencial para votar '),
    boldRun(datos.testigo1_numero_ine),
    run(' y '),
    boldRun(datos.testigo2_numero_ine),
    run(' vigentes y expedidas por el '),
    boldRun(idT1),
    run(' y '),
    boldRun(idT2),
    run(' respectivamente.'),
  ])

  // DACG + Resolutivo paragraph
  const resolutivoPara = para([
    run('De acuerdo a las DACG de generación distribuida se lleva a cabo la inspección verificando el cumplimiento de las DACG y el oficio resolutivo con número '),
    boldRun(datos.resolutivo_folio),
    ...(datos.resolutivo_fecha
      ? [run(' con fecha '), boldRun(datos.resolutivo_fecha)]
      : []),
    run(' aplicables a la central eléctrica. Esta revisión es independiente del grado de conformidad de la Norma Oficial Mexicana en Instalaciones Eléctricas o cualquier otra norma, siendo este alcance de un Organismo de Evaluación de la Conformidad.'),
  ])

  // CCFP paragraph
  const ccfpEncuentra = datos.tiene_ccfp
    ? `De acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}, durante la inspección Se encontraron los CCFP en la instalación por lo cual Cumple. La persona encargada de la visita que se presentó como `
    : `De acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}, durante la inspección No Se encontraron los CCFP en la instalación por lo cual No Cumple. La persona encargada de la visita que se presentó como `
  const ccfpFinal = datos.tiene_ccfp
    ? ', quien durante la inspección mostró la bajada área de las líneas de CFE donde se encontraba el CCFP.'
    : ', quien durante la inspección no mostró la ubicación del CCFP.'

  const ccfpPara = para([
    boldRun('Corta Circuito Fusible de Potencia '),
    run(ccfpEncuentra),
    boldRun(datos.atiende_nombre),
    run(' y que se identificó con credencial emitida por el '),
    boldRun(idAtiende),
    run(' '),
    boldRun(numAtiende),
    run(ccfpFinal),
  ])

  // Medidor paragraph — incluye serie y código CFE si están capturados
  const medidorRuns: TextRun[] = [
    boldRun(`Medidor Fiscal con las Características requeridas para interconexión ${tc}. `),
    run(`El centro de carga cuenta con un medidor fiscal, de acuerdo a lo descrito en la DACG en modelo ${tc}, por lo cual cumple. Se encontró un medidor instalado en sitio con número de medidor `),
    boldRun(datos.numero_medidor),
  ]
  if (datos.numero_serie_medidor) {
    medidorRuns.push(run(', número de serie '), boldRun(datos.numero_serie_medidor))
  }
  if (datos.numero_cfe_medidor) {
    medidorRuns.push(run(', C.F.E. '), boldRun(datos.numero_cfe_medidor))
  }
  medidorRuns.push(run(' el cual cumple con las especificaciones CFE G0000-48.'))
  const medidorPara = para(medidorRuns)

  // Protecciones I1/I2
  const i1i2Runs: TextRun[] = [
    boldRun(`Protecciones de acuerdo a I1 e I2 de los sistemas ${tc}. `),
  ]
  if (datos.tiene_i1_i2) {
    i1i2Runs.push(
      run('Durante la inspección se encontraron protecciones I1 e I2 en todos los inversores por lo cual cumple. Se localizaron diferentes interruptores exclusivos de las centrales, estos interruptores cuentan con diferentes capacidades y marcas, dependiendo del tamaño de los inversores. Estos interruptores ya fueron aprobados por la Unidad de Verificación en su dictamen '),
      boldRun(datos.dictamen_folio_dvnp),
      run('.'),
    )
  } else {
    i1i2Runs.push(
      run('Durante la inspección no se encontraron las protecciones I1 e I2 en todos los inversores por lo cual No Cumple.'),
    )
  }
  const i1i2Para = para(i1i2Runs)

  // Inversores
  const inversoresPara = simplePara(textoInversor(datos))

  // Subestación (conditional)
  const subestacionPara =
    datos.capacidad_subestacion_kva != null
      ? para([
          boldRun('Subestación Eléctrica. '),
          run('En la visita se encontró instalada una subestación eléctrica, la cual está por arriba del 80% de la capacidad fotovoltaica por lo cual cumple. Se encontró en campo una subestación de capacidad de '),
          boldRun(`${datos.capacidad_subestacion_kva} KVA`),
          run(' tomando en cuenta la potencia en AC.'),
        ])
      : null

  // Dictamen UVIE
  const dictamenPara = para([
    run('Se encuentra el dictamen por una UVIE. La compañía responsable de la instalación en su MTD, cuenta con el dictamen de una UVIE con registro dictamen '),
    boldRun(datos.dictamen_folio_dvnp),
    run(' donde se entrega el Cumplimiento de la Evaluación de la Conformidad, por lo cual cumple.'),
  ])

  // Closing paragraphs
  const concluyePara = simplePara(
    'Una vez concluida la inspección, se procede a Emitir el Certificado de Cumplimiento.',
  )

  const observacionesPara = simplePara(
    'El Representante para la inspección, haciendo uso del derecho que le asiste para hacer observaciones a la presente acta, manifiesta lo siguiente:',
  )

  const notasPara =
    datos.notas_acta && datos.notas_acta.trim()
      ? simplePara(datos.notas_acta)
      : separatorPara()

  const derechoPara = para([
    run('El inspector hace saber a la persona con quien se entendió la inspección de la conformidad, el derecho que tiene de formular observaciones y ofrecer pruebas en relación con los hechos, por escrito, en el término de 5 días hábiles contados a partir de esta fecha '),
    boldRun(datos.fecha_inspeccion),
    run('.'),
  ])

  const cierrePara = para([
    run('No habiendo más asuntos que tratar, se da por terminada la inspección a las '),
    boldRun(datos.hora_fin),
    run(' horas del día '),
    boldRun(datos.fecha_inspeccion),
    run(' en el mismo domicilio citado arriba, levantándose la presente acta, la cual previa lectura y ratificación de su contenido, firman al margen y al calce los que en ella intervinieron, dejándose copia simple con firmas autógrafas en poder del interesado, para los efectos legales a que hubiere lugar.'),
  ])

  // ── Signatures section ──

  // Title with top border
  const firmasTitulo = new Paragraph({
    children: [boldRun('FIRMAS DE LOS QUE INTERVINIERON EN LA INSPECCIÓN')],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 160 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    },
  })

  // Row 1: Person who attended (full width, then spacer)
  const firmasRow1 = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          sigLineCell(4680, 'Datos de la persona que atendió la visita:', [
            { label: 'Nombre:', value: datos.atiende_nombre },
            { label: 'Cargo:', value: 'Responsable Instalación' },
            { label: 'Firma:', value: '_________________________' },
          ]),
          spacerCell(4680),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  })

  // Row 2: Inspector + Inspector Responsable
  const inspectorLines: { label: string; value: string }[] = [
    { label: 'Nombre:', value: `Ing. ${datos.inspector_nombre}` },
    { label: 'Cargo:', value: 'Inspector' },
  ]
  if (datos.inspector_cedula) {
    inspectorLines.push({ label: 'Cédula:', value: datos.inspector_cedula })
  }
  inspectorLines.push({ label: 'Firma:', value: '_________________________' })

  const firmasRow2 = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          sigLineCell(4680, 'Unidad de Inspección:', inspectorLines),
          sigLineCell(4680, 'Inspector Responsable:', [
            { label: 'Nombre:', value: `Ing. ${respNombre}` },
            { label: 'Cargo:', value: 'Inspector Responsable' },
            { label: 'Firma:', value: '_________________________' },
          ]),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  })

  // Row 3: Testigos
  const firmasRow3 = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          sigLineCell(4680, 'Datos del testigo', [
            { label: 'Nombre:', value: datos.testigo1_nombre },
            { label: 'Dirección:', value: datos.testigo1_direccion ?? '—' },
            { label: 'Firma:', value: '_________________________' },
          ]),
          sigLineCell(4680, 'Datos del testigo', [
            { label: 'Nombre:', value: datos.testigo2_nombre },
            { label: 'Dirección:', value: datos.testigo2_direccion ?? '—' },
            { label: 'Firma:', value: '_________________________' },
          ]),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  })

  // ── Assemble document ──
  const bodyChildren = [
    openingPara,
    separatorPara(),
    simplePara('Se procede a efectuar la inspección, detectándose lo siguiente:'),
    separatorPara(),
    resolutivoPara,
    ccfpPara,
    medidorPara,
    i1i2Para,
    inversoresPara,
    ...(subestacionPara ? [subestacionPara] : []),
    dictamenPara,
    concluyePara,
    observacionesPara,
    notasPara,
    derechoPara,
    cierrePara,
    separatorPara(),
    firmasTitulo,
  ]

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
          default: new Header({
            children: [headerTable],
          }),
        },
        footers: {
          default: new Footer({
            children: [footerPara],
          }),
        },
        children: [
          ...bodyChildren,
          firmasRow1,
          new Paragraph({ children: [], spacing: { after: 120 } }),
          firmasRow2,
          new Paragraph({ children: [], spacing: { after: 120 } }),
          firmasRow3,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
