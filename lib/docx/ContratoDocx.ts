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
} from 'docx'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ContratoData {
  logoSrc?: string
  folio: string
  fecha: string                  // "15 de enero de 2026" — fecha de firma
  fecha_visita?: string
  cliente_nombre: string
  cliente_rfc?: string
  cliente_representante?: string
  figura_juridica?: string
  cliente_domicilio?: string
  correo_solicitante?: string
  telefono_solicitante?: string
  firmante_nombre?: string
  firmante_numero_ine?: string
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number
  resolutivo_folio: string
  resolutivo_fecha?: string
  precio_sin_iva: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UIIE = {
  razon_social:   'INTELIGENCIA EN AHORRO DE ENERGIA SA DE CV',
  representante:  'JOAQUÍN CORELLA PUENTE',
  escritura:      'Escritura Pública 19,507, VOLUMEN 310 otorgada ante la fe del Licenciado IVAN FLORES SALAZAR, Notario Público número 53 en Hermosillo, Sonora e inscrita en el Registro Público de la Propiedad bajo el número 44716*7',
  res_cre:        'RES/821/2019 de fecha 19 de Julio de 2019',
  domicilio:      'calle De las Américas número 116-A colonia San Benito Municipio Hermosillo Código Postal 83190 Estado Sonora',
  rfc:            'IAE160824L54',
  email:          'uiie@ciae.com.mx',
  email2:         'UIIE@CIAE.com.mx',
  telefono:       '6622820016',
  tel_quejas:     '6622672381',
  horario:        '9:00 horas a 17:00 horas',
  clave:          'UIIE-CRE-021',
}

// 1440 DXA = 1 inch. US Letter content width = 12240 - 1440*2 = 9360 DXA
const CONTENT_WIDTH = 9360
const FONT = 'Arial'
const FONT_SIZE   = 18   // 9pt
const FONT_SIZE_8 = 16   // 8pt
const FONT_SIZE_7 = 14   // 7pt
const FONT_SIZE_10 = 20  // 10pt
const SPACING_AFTER = 140

// ─── Helpers ──────────────────────────────────────────────────────────────────

function thinBorder() {
  return { style: BorderStyle.SINGLE, size: 4, color: '000000' }
}

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  }
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
  indent?: { left?: number; right?: number },
): Paragraph {
  return new Paragraph({
    children,
    alignment,
    spacing: { after: spacingAfter },
    ...(indent ? { indent } : {}),
  })
}

function simplePara(
  text: string,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  bold = false,
  size = FONT_SIZE,
  spacingAfter = SPACING_AFTER,
  indent?: { left?: number },
): Paragraph {
  return para([run(text, bold, size)], alignment, spacingAfter, indent)
}

function sectionTitle(text: string): Paragraph {
  // Spaced-out title, centered, bold 10pt
  return new Paragraph({
    children: [boldRun(text, FONT_SIZE_10)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 160 },
  })
}

function subTitle(text: string): Paragraph {
  return new Paragraph({
    children: [boldRun(text)],
    spacing: { before: 120, after: 80 },
  })
}

function clausulaTitle(title: string): Paragraph {
  return new Paragraph({
    children: [boldRun(title)],
    spacing: { before: 140, after: 60 },
    alignment: AlignmentType.JUSTIFIED,
  })
}

function indentedPara(children: TextRun[]): Paragraph {
  return para(children, AlignmentType.JUSTIFIED, 100, { left: 720 })
}

// ─── Header table builder ─────────────────────────────────────────────────────

function buildHeaderTable(folio: string, fecha: string, logoSrc?: string): Table {
  let logoContent: Paragraph
  if (logoSrc) {
    const imgBuffer = fs.readFileSync(logoSrc)
    logoContent = new Paragraph({
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: 56, height: 44 },
          type: 'png',
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  } else {
    logoContent = new Paragraph({
      children: [new TextRun({ text: 'LOGO', font: FONT, size: FONT_SIZE_7, color: '999999' })],
      alignment: AlignmentType.CENTER,
    })
  }

  // Col 1: Logo (1680 DXA ≈ 18%)
  const logoCell = new TableCell({
    width: { size: 1680, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [logoContent],
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
    },
  })

  // Col 2: Company info (5340 DXA)
  const companyCell = new TableCell({
    width: { size: 5340, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [boldRun('INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.', FONT_SIZE_8)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [run('Unidad de Inspección de Instalaciones Eléctricas', false, FONT_SIZE_7)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [boldRun('Contrato de Prestación de Servicios de Inspección', FONT_SIZE_8)],
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

  // Col 3: Right metadata (2340 DXA)
  // Three stacked rows: Contrato, Fecha, Página
  const rightItems = [
    { label: 'Contrato:', value: folio, last: false },
    { label: 'Fecha:', value: fecha, last: false },
    { label: 'Página:', value: null, last: true },
  ]

  const rightRows = rightItems.map((item, idx) =>
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [boldRun(item.label, FONT_SIZE_7)],
              spacing: { after: 0 },
            }),
          ],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: idx < rightItems.length - 1 ? thinBorder() : { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: thinBorder(),
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: item.value
                ? [run(item.value, false, FONT_SIZE_7)]
                : [
                    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_7 }),
                    run(' de ', false, FONT_SIZE_7),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FONT_SIZE_7 }),
                  ],
              spacing: { after: 0 },
            }),
          ],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: idx < rightItems.length - 1 ? thinBorder() : { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
        }),
      ],
    }),
  )

  const rightNestedTable = new Table({
    width: { size: 2340, type: WidthType.DXA },
    rows: rightRows,
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
    width: { size: 2340, type: WidthType.DXA },
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

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generarContratoDocx(datos: ContratoData): Promise<Buffer> {
  const firmanteCliente = datos.firmante_nombre ?? datos.cliente_representante ?? datos.cliente_nombre
  const correo          = datos.correo_solicitante ?? '—'
  const telefono        = datos.telefono_solicitante ?? '—'
  const municipio       = datos.municipio ?? datos.ciudad
  const resolutFecha    = datos.resolutivo_fecha ?? '—'
  const fechaVisita     = datos.fecha_visita ?? datos.fecha

  const dirParts: string[] = [datos.direccion]
  if (datos.colonia)       dirParts.push(datos.colonia)
  if (datos.codigo_postal) dirParts.push(`CP. ${datos.codigo_postal}`)
  dirParts.push(datos.ciudad)
  if (datos.municipio)     dirParts.push(datos.municipio)
  dirParts.push(datos.estado)
  const dirCompleta = dirParts.join(', ')

  const precioFmt = datos.precio_sin_iva.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // ── Header ──
  const headerTable = buildHeaderTable(datos.folio, datos.fecha, datos.logoSrc)

  // ── Footer ──
  const footerPara = new Paragraph({
    children: [
      run(`Contrato ${datos.folio} | CIAE — UIIE-CRE-021 · RFC: ${UIIE.rfc} | Página `, false, FONT_SIZE_7),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_7 }),
      run(' de ', false, FONT_SIZE_7),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FONT_SIZE_7 }),
    ],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: '999999' } },
  })

  // ── Body ──

  const contratoNumPara = new Paragraph({
    children: [boldRun(`Contrato No.  ${datos.folio}`)],
    spacing: { after: 200 },
  })

  // Opening paragraph
  const aperturaPara = para([
    run('CONTRATO DE PRESTACIÓN DE SERVICIOS DE INSPECCIÓN, QUE CELEBRA POR UNA PARTE '),
    boldRun('"INTELIGENCIA EN AHORRO DE ENERGIA SA DE CV"'),
    run(' A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ '),
    boldRun('"La Unidad de Inspección"'),
    run(', REPRESENTADA EN ESE ACTO POR '),
    boldRun(UIIE.representante),
    run(' Y POR LA OTRA '),
    boldRun(datos.cliente_nombre),
    run(' REPRESENTADA POR '),
    boldRun(firmanteCliente),
    run(' EN SU CARÁCTER DE RESPONSABLE DE LA INSTALACIÓN A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ '),
    boldRun('"El Solicitante"'),
    run(', A QUIENES DE MANERA CONJUNTA SE LES DENOMINARÁ '),
    boldRun('"Las Partes"'),
    run('. AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:'),
  ])

  // ── DECLARACIONES ──
  const declaracionesTitulo = sectionTitle('D E C L A R A C I O N E S')
  const declaraUIIE = subTitle('Declara "La Unidad de Inspección" que:')

  const decl1 = indentedPara([
    run('Que es una persona moral legalmente constituida conforme a las leyes mexicanas, lo que se acredita con el testimonio de la '),
    boldRun(UIIE.escritura),
    run(' y que dichas facultades no le han sido revocadas, modificadas o limitadas a la fecha de la firma de este contrato.'),
  ])

  const decl2 = indentedPara([
    run('Que fue autorizada como Unidad de Inspección por la Comisión Reguladora de Energía mediante Resolución número '),
    boldRun(UIIE.res_cre),
    run(' en términos de los artículos 12, fracción XL, 33, fracción IV, 68 y 133 de la Ley de la Industria Eléctrica y de las Disposiciones Administrativas de Carácter General que establecen las Bases Normativas para autorizar Unidades de Inspección de la Industria Eléctrica en las áreas de Generación, Transmisión y Distribución de Energía Eléctrica, el Procedimiento aplicable a inspecciones y las Condiciones de Operación de las Unidades de Inspección.'),
  ])

  const decl3 = indentedPara([
    run('Que su apoderado legal cuenta con los poderes necesarios y suficientes para celebrar el presente Contrato de Prestación de Servicios de Inspección y obligar a su representada en los términos del mismo, lo que acredita conforme el instrumento público '),
    boldRun(UIIE.escritura),
    run('.'),
  ])

  const decl4 = indentedPara([
    run('Cuenta con correo electrónico: '),
    boldRun(UIIE.email2),
    run(' y teléfono: '),
    boldRun(UIIE.telefono),
  ])

  const decl5 = indentedPara([
    run('Dentro de sus actividades que constituyen su objeto social se encuentra prevista la de prestación de servicios de inspección, así como posee los elementos adecuados y experiencia suficiente para obligarse a lo estipulado en el presente Contrato.'),
  ])

  const decl6 = indentedPara([
    run('Su domicilio se encuentra ubicado en la '),
    boldRun(UIIE.domicilio),
    run(' el cual señala como domicilio convencional para todos los efectos legales del presente Contrato.'),
  ])

  const decl7 = indentedPara([
    run('Se encuentra inscrito en el Registro Federal de Contribuyentes con la clave '),
    boldRun(UIIE.rfc),
  ])

  const decl8 = indentedPara([
    run('Cuenta con la infraestructura, los elementos propios, los recursos técnicos y humanos suficientes para cumplir con sus obligaciones conforme a lo establecido en el presente Contrato.'),
  ])

  const decl9 = indentedPara([
    run('Para la atención de dudas, aclaraciones y reclamaciones o para proporcionar servicios de orientación señala el teléfono '),
    boldRun(UIIE.tel_quejas),
    run(' y correo electrónico '),
    boldRun(UIIE.email),
    run(' con un horario de atención de '),
    boldRun(UIIE.horario),
  ])

  const decl10 = indentedPara([
    run('Cuenta con un seguro de responsabilidad civil vigente con cobertura suficiente que ampara las actividades de inspección y la de sus inspectores.'),
  ])

  const decl11 = indentedPara([
    run('Cuenta con un procedimiento interno para el servicio de inspección en el alcance de su autorización como Unidad de Inspección y cumple con las Condiciones de Operación de la Unidad de Inspección.'),
  ])

  const decl12 = indentedPara([
    run('Cuenta con un procedimiento interno para atender quejas y apelaciones por parte de "El Solicitante" si las hubiere y está disponible a "El Solicitante".'),
  ])

  // Declaraciones Solicitante
  const declaraSolicitante = subTitle('Declara "El Solicitante" que:')

  const declS1 = indentedPara([run('En caso de ser persona moral.')])

  const declS2 = indentedPara([
    run('Cuenta con correo electrónico: '),
    boldRun(correo),
    run(' y teléfono: '),
    boldRun(telefono),
  ])

  const declS3 = indentedPara([
    run('Que cuenta con los recursos financieros suficientes para obligarse en los términos de este contrato y cubrir oportunamente los honorarios acordados por los servicios de inspección.'),
  ])

  const declS4 = indentedPara([
    run('Que conoce y acepta que el Certificado de Cumplimiento si cumple totalmente con lo determinado por el Centro Nacional de Control de Energía (CENACE) en los estudios respectivos, por lo que los pagos de los servicios de inspección no están condicionados a la entrega del mismo.'),
  ])

  // Las Partes
  const declaraLasPartes = subTitle('Declaran "Las Partes".')
  const lasPartesPara = para([
    run('En virtud de las Declaraciones anteriores, "Las Partes" convienen en obligarse conforme a las siguientes:'),
  ])

  // ── CLÁUSULAS ──
  const clausulasTitulo = sectionTitle('C L Á U S U L A S')

  const c1title = clausulaTitle('Primera. Consentimiento.')
  const c1body = para([
    run('"Las Partes" manifiestan su voluntad para celebrar el presente Contrato cuya naturaleza jurídica es la prestación de servicios de inspección por lo que "La Unidad de Inspección" se obliga a prestar el Servicio a "El Solicitante", y éste, en consecuencia, se obliga a pagar como contraprestación un precio cierto y determinado.'),
  ])
  const c1body2 = para([
    run('"La Unidad de Inspección" no podrá ser sustituida por otra Unidad de Inspección una vez formalizado el contrato con "El Solicitante", salvo en los casos previstos por los ordenamientos jurídicos aplicables.'),
  ])

  const c2title = clausulaTitle('Segunda. Objeto del Contrato.')
  const c2body = para([
    run('El objeto del presente contrato es la realización de las actividades de inspección diferente a la revisión de las Normas Oficiales Mexicanas de las obras, infraestructura, especificaciones y estándares aplicables determinados en los estudios del Centro Nacional de Control de Energía (CENACE) conforme a las Disposiciones Administrativas de Carácter General emitidas por la Comisión Reguladora de Energía que resulten aplicables y en estricto apego al Procedimiento de Inspección de la Unidad de Inspección.'),
  ])

  const c3title = clausulaTitle('Tercera. Lugar de la Prestación del Servicio.')
  const c3body = para([
    run('El Servicio del presente Contrato se realizará en las obras e instalaciones (infraestructura) ubicada en:'),
  ])
  const c3body2 = para([
    run('Ubicación geográfica: '),
    boldRun(dirCompleta),
    run('.'),
  ])
  const c3body3 = para([
    run('Alcance de la inspección: Instalación fotovoltaica '),
    boldRun(`${datos.kwp} kWp`),
    run('.'),
  ])
  const c3body4 = para([
    run('Estudio de instalaciones número: '),
    boldRun(datos.resolutivo_folio),
    run(' con fecha '),
    boldRun(resolutFecha),
    run('.'),
  ])

  const c4title = clausulaTitle('Cuarta. Información para la inspección.')
  const c4body = para([
    run('"El Solicitante" entregará a "La Unidad de Inspección" la siguiente información:'),
  ])
  const c4items = [
    '• La información técnica de la Central de Generación o de Centro de Carga',
    '• Los Estudios elaborados por el CENACE',
    '• La Memoria Técnica Descriptiva y,',
    '• Demás información técnica relacionada con las instalaciones eléctricas.',
  ].map((t) => simplePara(t, AlignmentType.JUSTIFIED, false, FONT_SIZE, 60, { left: 360 }))

  const c5title = clausulaTitle('Quinta. Pago del Servicio.')
  const c5body = para([
    run('"El Solicitante" deberá pagar a "La Unidad de Inspección" como contraprestación del servicio de inspección estipulado en el presente contrato, dicho precio será pagado en el domicilio de "La Unidad de Inspección" señalado en el presente Contrato, o en su caso; en la forma de pago que "Las Partes" acuerden, en moneda nacional sin menoscabo de poderlo hacer en moneda extranjera al tipo de cambio publicado en el Diario Oficial de la Federación al día en que el pago se efectúe.'),
  ])
  const c5body2 = para([
    run('"El Solicitante" pagará la cantidad total de '),
    boldRun(`$${precioFmt}`),
    run(' más I.V.A. y podrá realizar el pago de la siguiente manera:'),
  ])
  const c5body3 = para([
    run('La cantidad de '),
    boldRun(`$${precioFmt}`),
    run(' más I.V.A. a la firma del presente Contrato por concepto de pago único del servicio que corresponde al 100% del precio total del Servicio.'),
  ])

  const c6title = clausulaTitle('Sexta. Designación de Personal.')
  const c6body = para([
    run('"El Solicitante" se obliga a designar a una persona, quién durante el periodo de prestación del Servicio, será quien trate los asuntos relacionados con la prestación del Servicio, así mismo se obliga a abstenerse de dar instrucciones al personal de "La Unidad de inspección" que no tenga relación con el objeto del presente Contrato.'),
  ])
  const c6body2 = para([
    run('Por su parte "La Unidad de inspección" se obliga a designar, de entre su personal a una persona que será quien durante la celebración del Servicio trate con el Representante de "El Solicitante" o con el mismo, los asuntos relacionados con la prestación del Servicio.'),
  ])
  const c6body3 = para([
    run('De igual manera, "La Unidad de Inspección" se obliga a que su personal que realiza la inspección no pondrá en riesgo la integridad física de su persona y del personal de "El Solicitante", para lo cual observará las reglas de seguridad e higiene que tenga establecidas "El Solicitante".'),
  ])
  const c6body4 = para([
    run('El personal que cada una de "Las Partes" utilice con motivo de los alcances del presente Contrato será bajo su exclusiva responsabilidad laboral, por lo que no podrá considerarse a la contraparte como patrón solidario o sustituto.'),
  ])

  const c7title = clausulaTitle('Séptima. Información para "El Solicitante".')
  const c7body = para([
    run('Para efecto de lo anterior en cada visita de inspección, "La Unidad de Inspección" entregará al representante designado por "El Solicitante" la información documental derivada de las mismas a decir: acta de inspección, listas de inspección, reporte de hallazgos, en su caso formato de atestiguamiento de pruebas, y en su oportunidad y en caso de cumplir con lo determinado por el CENACE el certificado de cumplimiento.'),
  ])

  const c8title = clausulaTitle('Octava. Convenio modificatorio.')
  const c8body = para([
    run('"Las Partes" acuerdan que cualquier modificación a los términos y alcances pactados en el presente Contrato se realizará de manera expresa mediante Convenio Modificatorio en el que se precisen los términos y condiciones que se están modificando.'),
  ])

  const c9title = clausulaTitle('Novena. Cancelación del Servicio.')
  const c9body = para([
    run('"Las Partes" de que en caso de que "El Solicitante" en forma unilateral y sin causas imputables a "La Unidad de Inspección" cancelara el presente Contrato, no tendrá derecho a reclamar la devolución del anticipo o cubrirá el precio de lo ejecutado hasta el momento de la cancelación, lo que sea mayor.'),
  ])
  const c9body2 = para([
    run('La cancelación deberá hacerse de manera escrita en el domicilio de "La Unidad de Inspección", o bien, por correo registrado o certificado, tomando como fecha de revocación la de recepción para su envío.'),
  ])

  const c10title = clausulaTitle('Décima. Suspensión del Servicio.')
  const c10body = para([
    run('"Las Partes" acuerdan que en caso de que "El Solicitante" solicite de manera escrita la suspensión temporal del Servicio en cualquier estado en que éste se encuentre por causas justificadas sin que ello implique la terminación definitiva del presente Contrato, se podrá reanudar el Servicio al cesar las causas que motivaron su suspensión.'),
  ])

  const c11title = clausulaTitle('Décima Primera. Caso Fortuito y Fuerza Mayor.')
  const c11body = para([
    run('En caso de que "La Unidad de Inspección" se encuentre imposibilitada para prestar el Servicio por caso fortuito o fuerza mayor, como terremoto, incendio, temblor, inundación, epidemias, disturbios civiles, huelgas declaradas legales u otros acontecimientos de la naturaleza o hechos del hombre ajenos a la voluntad de "La Unidad de Inspección", no se incurrirá en incumplimiento, únicamente "La Unidad de Inspección" reintegrará a "El Solicitante", la información proporcionada para la realización del Servicio.'),
  ])

  const c12title = clausulaTitle('Décima Segunda. Subcontratación.')
  const c12body = para([
    run('"La Unidad de Inspección" es responsable ante "El Solicitante" por el cumplimiento del Servicio contratado, aun cuando subcontrate con terceros todo o parte del Servicio contratado.'),
  ])

  const c13title = clausulaTitle('Décima Tercera. Confidencialidad.')
  const c13body = para([
    run('"Las Partes" convienen que el presente Contrato tiene el carácter de confidencial, por lo que "La Unidad de Inspección" se obliga a mantener los datos de "El Solicitante" con tal carácter y únicamente podrá ser revelada la información contenida en el mismo por mandamiento de la autoridad competente.'),
  ])
  const c13body2 = para([
    run('"Las Partes" convienen que los datos técnicos y generales del Servicio a realizar, se incluirán de manera confidencial en el SIREI: Sistema Informático de Registro de Inspecciones. Para la autoridad competente. El Certificado de Cumplimiento es procesado por este sistema electrónico lo que asegura la protección de los intereses de "El Solicitante".'),
  ])
  const c13body3 = para([
    run('"Las Partes" convienen que la información propiedad de "El Solicitante" no se hace del dominio público, excepto cuando deba por ley divulgar información confidencial.'),
  ])

  const c14title = clausulaTitle('Décima Cuarta. Jurisdicción.')
  const c14body = para([
    run('Para todo lo relativo a la interpretación, aplicación y cumplimiento del presente Contrato, "Las Partes" acuerdan someterse en la vía administrativa a la Procuraduría Federal del Consumidor y en caso de subsistir las diferencias, a la jurisdicción de los tribunales competentes del lugar donde se celebra este Contrato.'),
  ])

  // Closing paragraph
  const cierrePara = para([
    run('Leído que fue y una vez hecha la explicación de su alcance legal y contenido, este Contrato se firma por duplicado en cada una de sus hojas y al calce, en la ciudad '),
    boldRun(municipio),
    run(', '),
    boldRun(datos.estado),
    run(' el '),
    boldRun(fechaVisita),
    run(' entregándose una copia del mismo a "El Solicitante".'),
  ])

  // ── Signatures ──
  const sigTableBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideH: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideV: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  }

  function sigBlock(label: string, name: string, role: string): TableCell {
    return new TableCell({
      width: { size: 4320, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: [boldRun(label)],
          alignment: AlignmentType.CENTER,
          spacing: { after: 440 },
        }),
        new Paragraph({
          children: [boldRun(name)],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),
        // Signature line
        new Paragraph({
          children: [],
          spacing: { after: 80, before: 40 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          },
        }),
        new Paragraph({
          children: [run(role, false, FONT_SIZE_8)],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),
      ],
      borders: noBorder(),
    })
  }

  const sigSpacerCell = new TableCell({
    width: { size: 720, type: WidthType.DXA },
    children: [new Paragraph({ children: [] })],
    borders: noBorder(),
  })

  const firmasTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          sigBlock('"La Unidad de Inspección"', UIIE.razon_social, 'Firma del Representante Legal'),
          sigSpacerCell,
          sigBlock('"El Solicitante"', firmanteCliente, 'Firma del Representante'),
        ],
      }),
    ],
    borders: sigTableBorders,
  })

  // ── Assemble document ──
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
          contratoNumPara,
          aperturaPara,
          declaracionesTitulo,
          declaraUIIE,
          decl1, decl2, decl3, decl4, decl5, decl6, decl7, decl8, decl9, decl10, decl11, decl12,
          declaraSolicitante,
          declS1, declS2, declS3, declS4,
          declaraLasPartes,
          lasPartesPara,
          clausulasTitulo,
          c1title, c1body, c1body2,
          c2title, c2body,
          c3title, c3body, c3body2, c3body3, c3body4,
          c4title, c4body, ...c4items,
          c5title, c5body, c5body2, c5body3,
          c6title, c6body, c6body2, c6body3, c6body4,
          c7title, c7body,
          c8title, c8body,
          c9title, c9body, c9body2,
          c10title, c10body,
          c11title, c11body,
          c12title, c12body,
          c13title, c13body, c13body2, c13body3,
          c14title, c14body,
          cierrePara,
          new Paragraph({ children: [], spacing: { before: 400, after: 0 } }),
          firmasTable,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
