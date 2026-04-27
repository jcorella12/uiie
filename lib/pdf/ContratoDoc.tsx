import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

// ─── Constantes fijas de la empresa ──────────────────────────────────────────
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

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ContratoData {
  logoSrc?: string
  folio: string
  fecha: string                   // "15 de enero de 2026" — fecha de firma
  fecha_visita?: string           // para el cierre "el [FECHA_DE_VISITA]"

  // Cliente / Solicitante
  cliente_nombre: string          // Razón social o nombre completo
  cliente_rfc?: string
  cliente_representante?: string  // si es persona moral
  figura_juridica?: string
  cliente_domicilio?: string
  correo_solicitante?: string
  telefono_solicitante?: string

  // Firmante (persona física que firma)
  firmante_nombre?: string
  firmante_numero_ine?: string

  // Instalación
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number

  // Resolutivo
  resolutivo_folio: string
  resolutivo_fecha?: string       // "15 de enero de 2026"

  // Precio
  precio_sin_iva: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.55,
    backgroundColor: '#FFFFFF',
  },

  // ── Membrete ──
  membrete: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 10,
  },
  membreteLogoCell: {
    width: '18%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  membreteLogo: {
    width: 56,
    height: 44,
    objectFit: 'contain',
  },
  membreteCompanyCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  membreteCompanyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 2,
  },
  membreteCompanySub: {
    fontSize: 7.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  membreteDocTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
  },
  membreteRightCol: {
    width: '25%',
    flexDirection: 'column',
  },
  membreteRightRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  membreteRightRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  membreteRightLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    width: 40,
  },
  membreteRightValue: {
    fontSize: 7,
    flex: 1,
  },

  // ── Título contrato ──
  contratoNum: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },

  // ── Párrafo genérico ──
  p: {
    fontSize: 9,
    textAlign: 'justify',
    marginBottom: 7,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },

  // ── Sección DECLARACIONES / CLÁUSULAS ──
  seccionTitulo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: 10,
    marginBottom: 8,
  },
  subTitulo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 6,
    marginBottom: 4,
  },
  indented: {
    fontSize: 9,
    textAlign: 'justify',
    marginBottom: 5,
    paddingLeft: 14,
  },

  // ── Cláusulas ──
  clausulaTitulo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 7,
    marginBottom: 3,
    textAlign: 'justify',
  },

  // ── Separador ──
  sep: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    marginVertical: 8,
  },

  // ── Firmas ──
  firmasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  firmaBloque: {
    width: '44%',
    alignItems: 'center',
  },
  firmaEtiqueta: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 22,
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    width: '100%',
    marginBottom: 4,
  },
  firmaNombre: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  firmaCargo: {
    fontSize: 8,
    textAlign: 'center',
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 54,
    right: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#999999',
    paddingTop: 4,
  },
  footerTexto: {
    fontSize: 7,
    color: '#555555',
  },
})

// ─── Componente ───────────────────────────────────────────────────────────────
interface Props { datos: ContratoData }

export function ContratoDoc({ datos }: Props) {
  const firmanteCliente = datos.firmante_nombre ?? datos.cliente_representante ?? datos.cliente_nombre
  const correo         = datos.correo_solicitante ?? '—'
  const telefono       = datos.telefono_solicitante ?? '—'
  const municipio      = datos.municipio ?? datos.ciudad
  const resolutFecha   = datos.resolutivo_fecha ?? '—'
  const precioSinIva   = datos.precio_sin_iva
  const fechaVisita    = datos.fecha_visita ?? datos.fecha

  // Dirección de instalación completa
  const dirParts: string[] = [datos.direccion]
  if (datos.colonia)       dirParts.push(datos.colonia)
  if (datos.codigo_postal) dirParts.push(`CP. ${datos.codigo_postal}`)
  dirParts.push(datos.ciudad)
  if (datos.municipio)     dirParts.push(datos.municipio)
  dirParts.push(datos.estado)
  const dirCompleta = dirParts.join(', ')

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── Membrete ── */}
        <View style={s.membrete} fixed>
          <View style={s.membreteLogoCell}>
            {datos.logoSrc
              ? <Image src={datos.logoSrc} style={s.membreteLogo} />
              : <Text style={{ fontSize: 7, color: '#999' }}>LOGO</Text>}
          </View>
          <View style={s.membreteCompanyCell}>
            <Text style={s.membreteCompanyName}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
            <Text style={s.membreteCompanySub}>Unidad de Inspección de Instalaciones Eléctricas</Text>
            <Text style={s.membreteDocTitle}>Contrato de Prestación de Servicios de Inspección</Text>
          </View>
          <View style={s.membreteRightCol}>
            <View style={s.membreteRightRow}>
              <Text style={s.membreteRightLabel}>Contrato:</Text>
              <Text style={s.membreteRightValue}>{datos.folio}</Text>
            </View>
            <View style={s.membreteRightRow}>
              <Text style={s.membreteRightLabel}>Fecha:</Text>
              <Text style={s.membreteRightValue}>{datos.fecha}</Text>
            </View>
            <View style={s.membreteRightRowLast}>
              <Text style={s.membreteRightLabel}>Página:</Text>
              <Text
                style={s.membreteRightValue}
                render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`}
              />
            </View>
          </View>
        </View>

        {/* ── Número de contrato ── */}
        <Text style={s.contratoNum}>Contrato No.  {datos.folio}</Text>

        {/* ── Párrafo de apertura ── */}
        <Text style={s.p}>
          {'CONTRATO DE PRESTACIÓN DE SERVICIOS DE INSPECCIÓN, QUE CELEBRA POR UNA PARTE '}
          <Text style={s.bold}>"INTELIGENCIA EN AHORRO DE ENERGIA SA DE CV"</Text>
          {' A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ '}
          <Text style={s.bold}>"La Unidad de Inspección"</Text>
          {', REPRESENTADA EN ESE ACTO POR '}
          <Text style={s.bold}>{UIIE.representante}</Text>
          {' Y POR LA OTRA '}
          <Text style={s.bold}>{datos.cliente_nombre}</Text>
          {' REPRESENTADA POR '}
          <Text style={s.bold}>{firmanteCliente}</Text>
          {' EN SU CARÁCTER DE RESPONSABLE DE LA INSTALACIÓN A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ '}
          <Text style={s.bold}>"El Solicitante"</Text>
          {', A QUIENES DE MANERA CONJUNTA SE LES DENOMINARÁ '}
          <Text style={s.bold}>"Las Partes"</Text>
          {'. AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:'}
        </Text>

        {/* ══════════════════════════════════════════════════ */}
        <Text style={s.seccionTitulo}>D E C L A R A C I O N E S</Text>

        {/* ── Declaraciones UIIE ── */}
        <Text style={s.subTitulo}>Declara "La Unidad de Inspección" que:</Text>

        <Text style={s.indented}>
          {'Que es una persona moral legalmente constituida conforme a las leyes mexicanas, lo que se acredita con el testimonio de la '}
          <Text style={s.bold}>{UIIE.escritura}</Text>
          {' y que dichas facultades no le han sido revocadas, modificadas o limitadas a la fecha de la firma de este contrato.'}
        </Text>

        <Text style={s.indented}>
          {'Que fue autorizada como Unidad de Inspección por la Comisión Reguladora de Energía mediante Resolución número '}
          <Text style={s.bold}>{UIIE.res_cre}</Text>
          {' en términos de los artículos 12, fracción XL, 33, fracción IV, 68 y 133 de la Ley de la Industria Eléctrica y de las Disposiciones Administrativas de Carácter General que establecen las Bases Normativas para autorizar Unidades de Inspección de la Industria Eléctrica en las áreas de Generación, Transmisión y Distribución de Energía Eléctrica, el Procedimiento aplicable a inspecciones y las Condiciones de Operación de las Unidades de Inspección.'}
        </Text>

        <Text style={s.indented}>
          {'Que su apoderado legal cuenta con los poderes necesarios y suficientes para celebrar el presente Contrato de Prestación de Servicios de Inspección y obligar a su representada en los términos del mismo, lo que acredita conforme el instrumento público '}
          <Text style={s.bold}>{UIIE.escritura}</Text>
          {'.'}
        </Text>

        <Text style={s.indented}>
          {'Cuenta con correo electrónico: '}
          <Text style={s.bold}>{UIIE.email2}</Text>
          {' y teléfono: '}
          <Text style={s.bold}>{UIIE.telefono}</Text>
        </Text>

        <Text style={s.indented}>
          {'Dentro de sus actividades que constituyen su objeto social se encuentra prevista la de prestación de servicios de inspección, así como posee los elementos adecuados y experiencia suficiente para obligarse a lo estipulado en el presente Contrato.'}
        </Text>

        <Text style={s.indented}>
          {'Su domicilio se encuentra ubicado en la '}
          <Text style={s.bold}>{UIIE.domicilio}</Text>
          {' el cual señala como domicilio convencional para todos los efectos legales del presente Contrato.'}
        </Text>

        <Text style={s.indented}>
          {'Se encuentra inscrito en el Registro Federal de Contribuyentes con la clave '}
          <Text style={s.bold}>{UIIE.rfc}</Text>
        </Text>

        <Text style={s.indented}>
          {'Cuenta con la infraestructura, los elementos propios, los recursos técnicos y humanos suficientes para cumplir con sus obligaciones conforme a lo establecido en el presente Contrato.'}
        </Text>

        <Text style={s.indented}>
          {'Para la atención de dudas, aclaraciones y reclamaciones o para proporcionar servicios de orientación señala el teléfono '}
          <Text style={s.bold}>{UIIE.tel_quejas}</Text>
          {' y correo electrónico '}
          <Text style={s.bold}>{UIIE.email}</Text>
          {' con un horario de atención de '}
          <Text style={s.bold}>{UIIE.horario}</Text>
        </Text>

        <Text style={s.indented}>
          {'Cuenta con un seguro de responsabilidad civil vigente con cobertura suficiente que ampara las actividades de inspección y la de sus inspectores.'}
        </Text>

        <Text style={s.indented}>
          {'Cuenta con un procedimiento interno para el servicio de inspección en el alcance de su autorización como Unidad de Inspección y cumple con las Condiciones de Operación de la Unidad de Inspección.'}
        </Text>

        <Text style={s.indented}>
          {'Cuenta con un procedimiento interno para atender quejas y apelaciones por parte de "El Solicitante" si las hubiere y está disponible a "El Solicitante".'}
        </Text>

        {/* ── Declaraciones Solicitante ── */}
        <Text style={s.subTitulo}>Declara "El Solicitante" que:</Text>

        <Text style={s.indented}>
          {'En caso de ser persona moral.'}
        </Text>

        <Text style={s.indented}>
          {'Cuenta con correo electrónico: '}
          <Text style={s.bold}>{correo}</Text>
          {' y teléfono: '}
          <Text style={s.bold}>{telefono}</Text>
        </Text>

        <Text style={s.indented}>
          {'Que cuenta con los recursos financieros suficientes para obligarse en los términos de este contrato y cubrir oportunamente los honorarios acordados por los servicios de inspección.'}
        </Text>

        <Text style={s.indented}>
          {'Que conoce y acepta que el Certificado de Cumplimiento si cumple totalmente con lo determinado por el Centro Nacional de Control de Energía (CENACE) en los estudios respectivos, por lo que los pagos de los servicios de inspección no están condicionados a la entrega del mismo.'}
        </Text>

        {/* ── Las Partes ── */}
        <Text style={s.subTitulo}>Declaran "Las Partes".</Text>
        <Text style={s.p}>
          {'En virtud de las Declaraciones anteriores, "Las Partes" convienen en obligarse conforme a las siguientes:'}
        </Text>

        {/* ══════════════════════════════════════════════════ */}
        <Text style={s.seccionTitulo}>C L Á U S U L A S</Text>

        <Text style={s.clausulaTitulo}>Primera. Consentimiento.</Text>
        <Text style={s.p}>
          {'"Las Partes" manifiestan su voluntad para celebrar el presente Contrato cuya naturaleza jurídica es la prestación de servicios de inspección por lo que "La Unidad de Inspección" se obliga a prestar el Servicio a "El Solicitante", y éste, en consecuencia, se obliga a pagar como contraprestación un precio cierto y determinado.\n'}
          {'"La Unidad de Inspección" no podrá ser sustituida por otra Unidad de Inspección una vez formalizado el contrato con "El Solicitante", salvo en los casos previstos por los ordenamientos jurídicos aplicables.'}
        </Text>

        <Text style={s.clausulaTitulo}>Segunda. Objeto del Contrato.</Text>
        <Text style={s.p}>
          {'El objeto del presente contrato es la realización de las actividades de inspección diferente a la revisión de las Normas Oficiales Mexicanas de las obras, infraestructura, especificaciones y estándares aplicables determinados en los estudios del Centro Nacional de Control de Energía (CENACE) conforme a las Disposiciones Administrativas de Carácter General emitidas por la Comisión Reguladora de Energía que resulten aplicables y en estricto apego al Procedimiento de Inspección de la Unidad de Inspección.'}
        </Text>

        <Text style={s.clausulaTitulo}>Tercera. Lugar de la Prestación del Servicio.</Text>
        <Text style={s.p}>
          {'El Servicio del presente Contrato se realizará en las obras e instalaciones (infraestructura) ubicada en:\n'}
          {'Ubicación geográfica: '}
          <Text style={s.bold}>{dirCompleta}</Text>
          {'.\n'}
          {'Alcance de la inspección: Instalación fotovoltaica '}
          <Text style={s.bold}>{datos.kwp} kWp</Text>
          {'.\n'}
          {'Estudio de instalaciones número: '}
          <Text style={s.bold}>{datos.resolutivo_folio}</Text>
          {' con fecha '}
          <Text style={s.bold}>{resolutFecha}</Text>
          {'.'}
        </Text>

        <Text style={s.clausulaTitulo}>Cuarta. Información para la inspección.</Text>
        <Text style={s.p}>
          {'"El Solicitante" entregará a "La Unidad de Inspección" la siguiente información:\n'}
          {'• La información técnica de la Central de Generación o de Centro de Carga\n'}
          {'• Los Estudios elaborados por el CENACE\n'}
          {'• La Memoria Técnica Descriptiva y,\n'}
          {'• Demás información técnica relacionada con las instalaciones eléctricas.'}
        </Text>

        <Text style={s.clausulaTitulo}>Quinta. Pago del Servicio.</Text>
        <Text style={s.p}>
          {'"El Solicitante" deberá pagar a "La Unidad de Inspección" como contraprestación del servicio de inspección estipulado en el presente contrato, dicho precio será pagado en el domicilio de "La Unidad de Inspección" señalado en el presente Contrato, o en su caso; en la forma de pago que "Las Partes" acuerden, en moneda nacional sin menoscabo de poderlo hacer en moneda extranjera al tipo de cambio publicado en el Diario Oficial de la Federación al día en que el pago se efectúe.\n\n'}
          {'"El Solicitante" pagará la cantidad total de '}
          <Text style={s.bold}>${precioSinIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          {' más I.V.A. y podrá realizar el pago de la siguiente manera:\n'}
          {'La cantidad de '}
          <Text style={s.bold}>${precioSinIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          {' más I.V.A. a la firma del presente Contrato por concepto de pago único del servicio que corresponde al 100% del precio total del Servicio.'}
        </Text>

        <Text style={s.clausulaTitulo}>Sexta. Designación de Personal.</Text>
        <Text style={s.p}>
          {'"El Solicitante" se obliga a designar a una persona, quién durante el periodo de prestación del Servicio, será quien trate los asuntos relacionados con la prestación del Servicio, así mismo se obliga a abstenerse de dar instrucciones al personal de "La Unidad de inspección" que no tenga relación con el objeto del presente Contrato.\n\n'}
          {'Por su parte "La Unidad de inspección" se obliga a designar, de entre su personal a una persona que será quien durante la celebración del Servicio trate con el Representante de "El Solicitante" o con el mismo, los asuntos relacionados con la prestación del Servicio.\n\n'}
          {'De igual manera, "La Unidad de Inspección" se obliga a que su personal que realiza la inspección no pondrá en riesgo la integridad física de su persona y del personal de "El Solicitante", para lo cual observará las reglas de seguridad e higiene que tenga establecidas "El Solicitante".\n\n'}
          {'El personal que cada una de "Las Partes" utilice con motivo de los alcances del presente Contrato será bajo su exclusiva responsabilidad laboral, por lo que no podrá considerarse a la contraparte como patrón solidario o sustituto.'}
        </Text>

        <Text style={s.clausulaTitulo}>Séptima. Información para "El Solicitante".</Text>
        <Text style={s.p}>
          {'Para efecto de lo anterior en cada visita de inspección, "La Unidad de Inspección" entregará al representante designado por "El Solicitante" la información documental derivada de las mismas a decir: acta de inspección, listas de inspección, reporte de hallazgos, en su caso formato de atestiguamiento de pruebas, y en su oportunidad y en caso de cumplir con lo determinado por el CENACE el certificado de cumplimiento.'}
        </Text>

        <Text style={s.clausulaTitulo}>Octava. Convenio modificatorio.</Text>
        <Text style={s.p}>
          {'"Las Partes" acuerdan que cualquier modificación a los términos y alcances pactados en el presente Contrato se realizará de manera expresa mediante Convenio Modificatorio en el que se precisen los términos y condiciones que se están modificando.'}
        </Text>

        <Text style={s.clausulaTitulo}>Novena. Cancelación del Servicio.</Text>
        <Text style={s.p}>
          {'"Las Partes" de que en caso de que "El Solicitante" en forma unilateral y sin causas imputables a "La Unidad de Inspección" cancelara el presente Contrato, no tendrá derecho a reclamar la devolución del anticipo o cubrirá el precio de lo ejecutado hasta el momento de la cancelación, lo que sea mayor.\n\n'}
          {'La cancelación deberá hacerse de manera escrita en el domicilio de "La Unidad de Inspección", o bien, por correo registrado o certificado, tomando como fecha de revocación la de recepción para su envío.'}
        </Text>

        <Text style={s.clausulaTitulo}>Décima. Suspensión del Servicio.</Text>
        <Text style={s.p}>
          {'"Las Partes" acuerdan que en caso de que "El Solicitante" solicite de manera escrita la suspensión temporal del Servicio en cualquier estado en que éste se encuentre por causas justificadas sin que ello implique la terminación definitiva del presente Contrato, se podrá reanudar el Servicio al cesar las causas que motivaron su suspensión.'}
        </Text>

        <Text style={s.clausulaTitulo}>Décima Primera. Caso Fortuito y Fuerza Mayor.</Text>
        <Text style={s.p}>
          {'En caso de que "La Unidad de Inspección" se encuentre imposibilitada para prestar el Servicio por caso fortuito o fuerza mayor, como terremoto, incendio, temblor, inundación, epidemias, disturbios civiles, huelgas declaradas legales u otros acontecimientos de la naturaleza o hechos del hombre ajenos a la voluntad de "La Unidad de Inspección", no se incurrirá en incumplimiento, únicamente "La Unidad de Inspección" reintegrará a "El Solicitante", la información proporcionada para la realización del Servicio.'}
        </Text>

        <Text style={s.clausulaTitulo}>Décima Segunda. Subcontratación.</Text>
        <Text style={s.p}>
          {'"La Unidad de Inspección" es responsable ante "El Solicitante" por el cumplimiento del Servicio contratado, aun cuando subcontrate con terceros todo o parte del Servicio contratado.'}
        </Text>

        <Text style={s.clausulaTitulo}>Décima Tercera. Confidencialidad.</Text>
        <Text style={s.p}>
          {'"Las Partes" convienen que el presente Contrato tiene el carácter de confidencial, por lo que "La Unidad de Inspección" se obliga a mantener los datos de "El Solicitante" con tal carácter y únicamente podrá ser revelada la información contenida en el mismo por mandamiento de la autoridad competente.\n'}
          {'"Las Partes" convienen que los datos técnicos y generales del Servicio a realizar, se incluirán de manera confidencial en el SIREI: Sistema Informático de Registro de Inspecciones. Para la autoridad competente. El Certificado de Cumplimiento es procesado por este sistema electrónico lo que asegura la protección de los intereses de "El Solicitante".\n'}
          {'"Las Partes" convienen que la información propiedad de "El Solicitante" no se hace del dominio público, excepto cuando deba por ley divulgar información confidencial.'}
        </Text>

        <Text style={s.clausulaTitulo}>Décima Cuarta. Jurisdicción.</Text>
        <Text style={s.p}>
          {'Para todo lo relativo a la interpretación, aplicación y cumplimiento del presente Contrato, "Las Partes" acuerdan someterse en la vía administrativa a la Procuraduría Federal del Consumidor y en caso de subsistir las diferencias, a la jurisdicción de los tribunales competentes del lugar donde se celebra este Contrato.'}
        </Text>

        {/* ── Párrafo de cierre ── */}
        <Text style={s.p}>
          {'Leído que fue y una vez hecha la explicación de su alcance legal y contenido, este Contrato se firma por duplicado en cada una de sus hojas y al calce, en la ciudad '}
          <Text style={s.bold}>{municipio}</Text>
          {', '}
          <Text style={s.bold}>{datos.estado}</Text>
          {' el '}
          <Text style={s.bold}>{fechaVisita}</Text>
          {' entregándose una copia del mismo a "El Solicitante".'}
        </Text>

        {/* ── Firmas ── */}
        <View style={s.firmasRow}>
          <View style={s.firmaBloque}>
            <Text style={s.firmaEtiqueta}>"La Unidad de Inspección"</Text>
            <Text style={s.firmaNombre}>{UIIE.representante}</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaCargo}>Firma del Representante Legal</Text>
          </View>

          <View style={s.firmaBloque}>
            <Text style={s.firmaEtiqueta}>"El Solicitante"</Text>
            <Text style={s.firmaNombre}>{firmanteCliente}</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaCargo}>Firma del Representante</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerTexto}>Contrato {datos.folio}</Text>
          <Text style={s.footerTexto}>CIAE — UIIE-CRE-021  ·  RFC: {UIIE.rfc}</Text>
          <Text
            style={s.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
