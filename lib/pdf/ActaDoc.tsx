import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ActaData {
  logoSrc?: string
  folio: string
  fecha_inspeccion: string          // "15 de enero de 2026"
  hora_inicio: string               // "10:00"
  hora_fin: string                  // "12:00"

  // Inspector
  inspector_nombre: string
  inspector_cedula?: string
  inspector_responsable_nombre?: string

  // Quien atiende la visita
  atiende_nombre: string
  atiende_identificacion?: string   // "Instituto Nacional Electoral (INE)"
  atiende_numero_id?: string

  // Testigos
  testigo1_nombre: string
  testigo1_numero_ine: string
  testigo1_identificacion?: string
  testigo1_direccion?: string
  testigo2_nombre: string
  testigo2_numero_ine: string
  testigo2_identificacion?: string
  testigo2_direccion?: string

  // Cliente
  cliente_nombre: string
  cliente_rfc?: string
  cliente_representante?: string
  cliente_figura?: string

  // Instalación
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number
  tipo_conexion: string
  tipo_central?: string             // 'MT' | 'BT'
  num_paneles?: number
  potencia_panel_wp?: number

  // Medidor
  numero_medidor: string

  // Inversores
  num_inversores: number
  marca_inversor: string
  modelo_inversor: string
  certificacion_inversor: 'ul1741' | 'ieee1547' | 'ninguna'
  justificacion_ieee1547?: string

  // Subestación
  capacidad_subestacion_kva?: number

  // Protecciones
  tiene_i1_i2: boolean
  tiene_interruptor_exclusivo: boolean
  tiene_ccfp: boolean
  tiene_proteccion_respaldo: boolean

  // Resolutivo CFE
  resolutivo_folio: string
  resolutivo_fecha?: string         // "15 de enero de 2026"
  resolutivo_tiene_cobro: boolean
  resolutivo_monto?: number
  resolutivo_referencia?: string

  // Dictamen UVIE
  dictamen_folio_dvnp: string
  dictamen_uvie_nombre?: string

  // Resultado
  resultado: 'aprobado' | 'rechazado' | 'condicionado'
  notas_acta?: string
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },

  // ── Encabezado tabla ──
  headerTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 10,
  },
  headerLogoCell: {
    width: '20%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  headerLogo: {
    width: 60,
    height: 46,
    objectFit: 'contain',
  },
  headerCompanyCell: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  headerCompanyLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 3,
  },
  headerCompanyName: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  headerRightCol: {
    width: '30%',
    flexDirection: 'column',
  },
  headerRightTopRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    flex: 1,
  },
  headerRightCell: {
    flex: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  headerRightLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerRightValue: {
    fontSize: 7,
    textAlign: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  headerTitleCell: {
    flex: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  headerPageCell: {
    flex: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textAlign: 'center',
    marginBottom: 1,
  },
  headerSubtitleText: {
    fontSize: 6,
    textAlign: 'center',
    color: '#444444',
  },

  // ── Párrafo narrativo ──
  parrafo: {
    fontSize: 9,
    lineHeight: 1.6,
    textAlign: 'justify',
    marginBottom: 6,
    color: '#000000',
  },
  parrafoBold: {
    fontSize: 9,
    lineHeight: 1.6,
    textAlign: 'justify',
    marginBottom: 6,
    color: '#000000',
    fontFamily: 'Helvetica-Bold',
  },
  separador: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  seccionTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#000000',
    marginTop: 4,
  },

  // ── Firmas ──
  firmasTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  firmasFila: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  firmaBloque: {
    flex: 1,
    paddingHorizontal: 4,
  },
  firmaBloqueLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 4,
    color: '#000000',
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 20,
    marginBottom: 3,
  },
  firmaDato: {
    fontSize: 8,
    color: '#000000',
    marginBottom: 1,
  },
  firmaDatoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#000000',
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 6.5,
    color: '#888888',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (d.certificacion_inversor === 'ieee1547') {
    const justif = d.justificacion_ieee1547 ?? 'El fabricante no tramitó la certificación UL1741 para este modelo en el mercado mexicano'
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

// ─── Componente ───────────────────────────────────────────────────────────────

export function ActaDoc({ datos }: { datos: ActaData }) {
  const tc = datos.tipo_central ?? 'MT'

  // Dirección completa
  const domicilio = [
    datos.direccion,
    datos.colonia ? datos.colonia : null,
    datos.codigo_postal ? `C.P. ${datos.codigo_postal}` : null,
    datos.ciudad,
    datos.municipio ?? null,
    datos.estado,
  ].filter(Boolean).join(', ')

  const idAtiende  = datos.atiende_identificacion ?? 'Instituto Nacional Electoral (INE)'
  const numAtiende = datos.atiende_numero_id ?? '—'
  const idT1       = datos.testigo1_identificacion ?? 'Instituto Nacional Electoral (INE)'
  const idT2       = datos.testigo2_identificacion ?? 'Instituto Nacional Electoral (INE)'

  const respNombre = datos.inspector_responsable_nombre ?? datos.inspector_nombre

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ══ ENCABEZADO EN TABLA ══ */}
        <View style={s.headerTable}>
          {/* Columna logo */}
          <View style={s.headerLogoCell}>
            {datos.logoSrc ? (
              <Image src={datos.logoSrc} style={s.headerLogo} />
            ) : (
              <Text style={{ fontSize: 7, color: '#666' }}>LOGO</Text>
            )}
          </View>

          {/* Columna nombre de la unidad */}
          <View style={s.headerCompanyCell}>
            <Text style={s.headerCompanyLabel}>Nombre de la Unidad de Inspección</Text>
            <Text style={s.headerCompanyName}>INTELIGENCIA EN EL AHORRO DE ENERGÍA S.A. DE C.V.</Text>
          </View>

          {/* Columnas derecha: 2 filas */}
          <View style={s.headerRightCol}>
            {/* Fila superior: Proyecto | Fecha */}
            <View style={s.headerRightTopRow}>
              <View style={[s.headerRightCell, s.headerRightCellBorder]}>
                <Text style={s.headerRightLabel}>Proyecto</Text>
                <Text style={s.headerRightValue}>{datos.folio}</Text>
              </View>
              <View style={s.headerRightCell}>
                <Text style={s.headerRightLabel}>Fecha</Text>
                <Text style={s.headerRightValue}>{datos.fecha_inspeccion}</Text>
              </View>
            </View>
            {/* Fila inferior: Acta | Página */}
            <View style={s.headerBottomRow}>
              <View style={s.headerTitleCell}>
                <Text style={s.headerTitleText}>Acta de Inspección</Text>
                <Text style={s.headerSubtitleText}>Formato FO-12  Revisión 1</Text>
              </View>
              <View style={s.headerPageCell}>
                <Text
                  style={s.headerSubtitleText}
                  render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ══ PÁRRAFO DE APERTURA ══ */}
        <Text style={s.parrafo}>
          {'Siendo las '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.hora_inicio}</Text>
          {' horas del día '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.fecha_inspeccion}</Text>
          {', el inspector de Unidad de Inspección, '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.inspector_nombre}</Text>
          {', quien se identifica con credencial vigente expedida para las actividades relativas a la Unidad de Inspección, se presenta en '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.cliente_nombre}</Text>
          {' con domicilio: '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{domicilio}</Text>
          {'; con el objeto de realizar la inspección de la conformidad con las Disposiciones Administrativas de Carácter General según la oferta de servicios Contrato No. '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.folio}</Text>
          {', encontrándose presente '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.atiende_nombre}</Text>
          {', quien se identifica con Credencial para votar '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{numAtiende}</Text>
          {', vigente y expedida por el '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{idAtiende}</Text>
          {', en su carácter de Representante (o cargo de la persona), se le hace saber el derecho que tiene de designar dos testigos para que corroboren lo actuado durante la inspección, los que en su negativa serán designados por el inspector, o se asentará la falta de los mismos y la causa si se diera el caso. Los testigos designados por el Representante para la Inspección son '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.testigo1_nombre}</Text>
          {' y '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.testigo2_nombre}</Text>
          {' quien se identifica con Credencial para votar '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.testigo1_numero_ine}</Text>
          {' y '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.testigo2_numero_ine}</Text>
          {' vigentes y expedidas por el '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{idT1}</Text>
          {' y '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{idT2}</Text>
          {' respectivamente.'}
        </Text>

        <Text style={s.separador}>
          {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
        </Text>

        <Text style={s.parrafo}>
          Se procede a efectuar la inspección, detectándose lo siguiente:
        </Text>

        <Text style={s.separador}>
          {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
        </Text>

        {/* ══ PÁRRAFO DACG + RESOLUTIVO ══ */}
        <Text style={s.parrafo}>
          {'De acuerdo a las DACG de generación distribuida se lleva a cabo la inspección verificando el cumplimiento de las DACG y el oficio resolutivo con número '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.resolutivo_folio}</Text>
          {datos.resolutivo_fecha ? (
            <Text>{' con fecha '}<Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.resolutivo_fecha}</Text></Text>
          ) : ''}
          {' aplicables a la central eléctrica. Esta revisión es independiente del grado de conformidad de la Norma Oficial Mexicana en Instalaciones Eléctricas o cualquier otra norma, siendo este alcance de un Organismo de Evaluación de la Conformidad.'}
        </Text>

        {/* ══ CCFP ══ */}
        <Text style={s.parrafo}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{'Corta Circuito Fusible de Potencia '}</Text>
          {datos.tiene_ccfp
            ? `De acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}, durante la inspección Se encontraron los CCFP en la instalación por lo cual Cumple. La persona encargada de la visita que se presentó como `
            : `De acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}, durante la inspección No Se encontraron los CCFP en la instalación por lo cual No Cumple. La persona encargada de la visita que se presentó como `}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.atiende_nombre}</Text>
          {' y que se identificó con credencial emitida por el '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{idAtiende}</Text>
          {' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{numAtiende}</Text>
          {datos.tiene_ccfp
            ? ', quien durante la inspección mostró la bajada área de las líneas de CFE donde se encontraba el CCFP.'
            : ', quien durante la inspección no mostró la ubicación del CCFP.'}
        </Text>

        {/* ══ MEDIDOR FISCAL ══ */}
        <Text style={s.parrafo}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{`Medidor Fiscal con las Características requeridas para interconexión ${tc}. `}</Text>
          {`El centro de carga cuenta con un medidor fiscal, de acuerdo a lo descrito en la DACG en modelo ${tc}, por lo cual cumple. Se encontró un medidor instalado en sitio con `}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.numero_medidor}</Text>
          {' el cual cumple con las especificaciones CFE G0000-48.'}
        </Text>

        {/* ══ PROTECCIONES I1/I2 ══ */}
        <Text style={s.parrafo}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{`Protecciones de acuerdo a I1 e I2 de los sistemas ${tc}. `}</Text>
          {datos.tiene_i1_i2
            ? 'Durante la inspección se encontraron protecciones I1 e I2 en todos los inversores por lo cual cumple. Se localizaron diferentes interruptores exclusivos de las centrales, estos interruptores cuentan con diferentes capacidades y marcas, dependiendo del tamaño de los inversores. Estos interruptores ya fueron aprobados por la Unidad de Verificación en su dictamen '
            : 'Durante la inspección no se encontraron las protecciones I1 e I2 en todos los inversores por lo cual No Cumple. '}
          {datos.tiene_i1_i2 && (
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.dictamen_folio_dvnp}</Text>
          )}
          {datos.tiene_i1_i2 ? '.' : ''}
        </Text>

        {/* ══ INVERSORES ══ */}
        <Text style={s.parrafo}>
          {textoInversor(datos)}
        </Text>

        {/* ══ SUBESTACIÓN (condicional) ══ */}
        {datos.capacidad_subestacion_kva != null && (
          <Text style={s.parrafo}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{'Subestación Eléctrica. '}</Text>
            {`En la visita se encontró instalada una subestación eléctrica, la cual está por arriba del 80% de la capacidad fotovoltaica por lo cual cumple. Se encontró en campo una subestación de capacidad de `}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{`${datos.capacidad_subestacion_kva} KVA`}</Text>
            {' tomando en cuenta la potencia en AC.'}
          </Text>
        )}

        {/* ══ DICTAMEN UVIE ══ */}
        <Text style={s.parrafo}>
          {'Se encuentra el dictamen por una UVIE. La compañía responsable de la instalación en su MTD, cuenta con el dictamen de una UVIE con registro dictamen '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.dictamen_folio_dvnp}</Text>
          {' donde se entrega el Cumplimiento de la Evaluación de la Conformidad, por lo cual cumple.'}
        </Text>

        {/* ══ CIERRE DE INSPECCIÓN ══ */}
        <Text style={s.parrafo}>
          Una vez concluida la inspección, se procede a Emitir el Certificado de Cumplimiento.
        </Text>

        <Text style={s.parrafo}>
          El Representante para la inspección, haciendo uso del derecho que le asiste para hacer observaciones a la presente acta, manifiesta lo siguiente:
        </Text>

        {datos.notas_acta && datos.notas_acta.trim() ? (
          <Text style={s.parrafo}>{datos.notas_acta}</Text>
        ) : (
          <Text style={s.separador}>
            {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
          </Text>
        )}

        <Text style={s.parrafo}>
          {'El inspector hace saber a la persona con quien se entendió la inspección de la conformidad, el derecho que tiene de formular observaciones y ofrecer pruebas en relación con los hechos, por escrito, en el término de 5 días hábiles contados a partir de esta fecha '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.fecha_inspeccion}</Text>
          {'.'}
        </Text>

        <Text style={s.parrafo}>
          {'No habiendo más asuntos que tratar, se da por terminada la inspección a las '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.hora_fin}</Text>
          {' horas del día '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{datos.fecha_inspeccion}</Text>
          {' en el mismo domicilio citado arriba, levantándose la presente acta, la cual previa lectura y ratificación de su contenido, firman al margen y al calce los que en ella intervinieron, dejándose copia simple con firmas autógrafas en poder del interesado, para los efectos legales a que hubiere lugar.'}
        </Text>

        <Text style={s.separador}>
          {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
        </Text>

        {/* ══ FIRMAS ══ */}
        <Text style={s.firmasTitulo}>FIRMAS DE LOS QUE INTERVINIERON EN LA INSPECCIÓN</Text>

        {/* Fila 1: Persona que atendió */}
        <View style={s.firmasFila}>
          <View style={[s.firmaBloque, { flex: 2 }]}>
            <Text style={s.firmaBloqueLabel}>Datos de la persona que atendió la visita:</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Nombre: </Text>
              {datos.atiende_nombre}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Cargo: </Text>
              Responsable Instalación
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Firma: </Text>
              {'_________________________'}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
        </View>

        {/* Fila 2: Inspector + Inspector Responsable */}
        <View style={s.firmasFila}>
          <View style={s.firmaBloque}>
            <Text style={s.firmaBloqueLabel}>Unidad de Inspección:</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Nombre: </Text>
              {`Ing. ${datos.inspector_nombre}`}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Cargo: </Text>
              Inspector
            </Text>
            {datos.inspector_cedula ? (
              <Text style={s.firmaDato}>
                <Text style={s.firmaDatoLabel}>Cédula: </Text>
                {datos.inspector_cedula}
              </Text>
            ) : null}
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Firma: </Text>
              {'_________________________'}
            </Text>
          </View>

          <View style={s.firmaBloque}>
            <Text style={[s.firmaBloqueLabel, { color: 'transparent' }]}>{'.'}</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Nombre: </Text>
              {`Ing. ${respNombre}`}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Cargo: </Text>
              Inspector Responsable
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Firma: </Text>
              {'_________________________'}
            </Text>
          </View>
        </View>

        {/* Fila 3: Testigos */}
        <View style={s.firmasFila}>
          <View style={s.firmaBloque}>
            <Text style={s.firmaBloqueLabel}>Datos del testigo</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Nombre: </Text>
              {datos.testigo1_nombre}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Dirección: </Text>
              {datos.testigo1_direccion ?? '—'}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Firma: </Text>
              {'_________________________'}
            </Text>
          </View>

          <View style={s.firmaBloque}>
            <Text style={s.firmaBloqueLabel}>Datos del testigo</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Nombre: </Text>
              {datos.testigo2_nombre}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Dirección: </Text>
              {datos.testigo2_direccion ?? '—'}
            </Text>
            <Text style={s.firmaDato}>
              <Text style={s.firmaDatoLabel}>Firma: </Text>
              {'_________________________'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{datos.folio}</Text>
          <Text style={s.footerText}>
            Este documento es válido únicamente con firmas autógrafas originales
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
