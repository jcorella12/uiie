import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PlanData {
  logoSrc?: string
  folio: string
  fecha_emision: string           // "15 de enero de 2026"
  fecha_visita: string            // "15 de enero de 2026"
  cliente_nombre: string
  atiende_nombre?: string         // quien confirma de recibido
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  kwp: number
  resolutivo_folio: string
  resolutivo_fecha?: string       // "15 de enero de 2026"
  tipo_central: string            // 'MT' | 'BT'
  num_inversores?: number
  marca_inversor?: string
  modelo_inversor?: string
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
    marginBottom: 14,
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
    width: '55%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  headerCompanyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerCompanySub: {
    fontSize: 7.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerDocTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
  },
  headerRightCol: {
    width: '25%',
    flexDirection: 'column',
  },
  headerRightRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'flex-start',
  },
  headerRightRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'flex-start',
  },
  headerRightLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    width: 42,
  },
  headerRightValue: {
    fontSize: 7,
    flex: 1,
  },

  // ── Cuerpo ──
  body: {
    flex: 1,
  },
  parrafo: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 7,
    textAlign: 'justify',
  },
  parrafoBold: {
    fontFamily: 'Helvetica-Bold',
  },
  parrafoIndent: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 7,
    textAlign: 'justify',
    marginLeft: 14,
  },

  // ── Separador ──
  separador: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#999999',
    marginVertical: 8,
  },

  // ── Cierre ──
  cierreContainer: {
    marginTop: 14,
  },
  cierreAtentamente: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 26,
  },
  cierreEmpresa: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  cierreUnidad: {
    fontSize: 9,
    marginBottom: 26,
  },

  // ── Firma cliente ──
  firmaContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  firmaLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
  },
  firmaLinea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginRight: 10,
    height: 14,
  },
  firmaNombre: {
    fontSize: 9,
    minWidth: 120,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDireccion(d: PlanData): string {
  const parts: string[] = [d.direccion]
  if (d.colonia)       parts.push(`Col. ${d.colonia}`)
  if (d.codigo_postal) parts.push(`C.P. ${d.codigo_postal}`)
  if (d.municipio)     parts.push(d.municipio)
  parts.push(d.ciudad)
  parts.push(d.estado)
  return parts.join(', ')
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props { datos: PlanData }

export function PlanInspeccionDoc({ datos }: Props) {
  const direccionCompleta = buildDireccion(datos)
  const tipoCentral = datos.tipo_central?.toUpperCase() === 'BT' ? 'Baja Tensión (BT)' : 'Media Tensión (MT)'
  const resolutFecha = datos.resolutivo_fecha ?? 'fecha no indicada'

  const invDesc = datos.num_inversores
    ? `${datos.num_inversores} inversor${datos.num_inversores > 1 ? 'es' : ''}${datos.marca_inversor ? ` marca ${datos.marca_inversor}` : ''}${datos.modelo_inversor ? ` modelo ${datos.modelo_inversor}` : ''}`
    : 'inversores'

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── Encabezado ── */}
        <View style={s.headerTable} fixed>
          {/* Logo */}
          <View style={s.headerLogoCell}>
            {datos.logoSrc
              ? <Image src={datos.logoSrc} style={s.headerLogo} />
              : <Text style={{ fontSize: 7, color: '#999' }}>LOGO</Text>}
          </View>

          {/* Nombre empresa */}
          <View style={s.headerCompanyCell}>
            <Text style={s.headerCompanyName}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
            <Text style={s.headerCompanySub}>Unidad de Inspección de Instalaciones Eléctricas</Text>
            <Text style={s.headerDocTitle}>Plan de Inspección</Text>
          </View>

          {/* Columna derecha */}
          <View style={s.headerRightCol}>
            <View style={s.headerRightRow}>
              <Text style={s.headerRightLabel}>Proyecto:</Text>
              <Text style={s.headerRightValue}>{datos.folio}</Text>
            </View>
            <View style={s.headerRightRow}>
              <Text style={s.headerRightLabel}>Plan:</Text>
              <Text style={s.headerRightValue}>{datos.folio}</Text>
            </View>
            <View style={s.headerRightRow}>
              <Text style={s.headerRightLabel}>Fecha:</Text>
              <Text style={s.headerRightValue}>{datos.fecha_emision}</Text>
            </View>
            <View style={s.headerRightRowLast}>
              <Text style={s.headerRightLabel}>Página:</Text>
              <Text
                style={s.headerRightValue}
                render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`}
              />
            </View>
          </View>
        </View>

        {/* ── Cuerpo ── */}
        <View style={s.body}>

          <Text style={s.parrafo}>
            {'Se programa visita de inspección a: '}
            <Text style={s.parrafoBold}>{datos.cliente_nombre}</Text>
          </Text>

          <Text style={s.parrafo}>
            {'Ubicación geográfica: '}
            <Text style={s.parrafoBold}>{direccionCompleta}</Text>
            {'.'}
          </Text>

          <Text style={s.parrafo}>
            {'Alcance de la inspección: Instalación fotovoltaica '}
            <Text style={s.parrafoBold}>{datos.kwp} kWp</Text>
            {'.'}
          </Text>

          <Text style={s.parrafo}>
            {'Estudio de instalaciones número: '}
            <Text style={s.parrafoBold}>{datos.resolutivo_folio}</Text>
            {' con fecha el '}
            <Text style={s.parrafoBold}>{resolutFecha}</Text>
            {'.'}
          </Text>

          <Text style={s.parrafo}>
            {'Con fecha: '}
            <Text style={s.parrafoBold}>{datos.fecha_visita}</Text>
            {', se realizará visita de inspección en las instalaciones del cliente con el fin de verificar el cumplimiento de los requisitos técnicos establecidos en las Disposiciones Administrativas de Carácter General (DACG) aplicables a los sistemas de generación distribuida interconectados a la red eléctrica nacional, conforme a los lineamientos de la Comisión Reguladora de Energía (CRE) para la UIIE-CRE-021.'}
          </Text>

          <Text style={s.parrafo}>
            {'Durante la visita se verificará el cumplimiento de los requisitos documentales y de campo señalados en las DACG, incluyendo la revisión de la documentación técnica, la inspección física de los componentes de la instalación y la toma de evidencias fotográficas.'}
          </Text>

          <Text style={s.parrafo}>
            {'Se solicitará acceso a la subestación de interconexión bajo el esquema de '}
            <Text style={s.parrafoBold}>{tipoCentral}</Text>
            {', así como a los tableros de distribución, centro de carga y punto de medición, para la revisión de protecciones, interruptores y equipos de seccionamiento conforme a los incisos de la lista de verificación.'}
          </Text>

          <Text style={s.parrafo}>
            {'Asimismo, se inspeccionarán los '}
            <Text style={s.parrafoBold}>{invDesc}</Text>
            {', verificando su certificación, características nominales y correcta instalación de acuerdo con las normas aplicables.'}
          </Text>

          <Text style={s.parrafo}>
            {'La duración estimada de la visita de inspección es de 2.5 horas aproximadamente. Se solicita al cliente designar un representante o personal técnico que acompañe al inspector durante el recorrido y proporcione el acceso a todas las áreas e instalaciones requeridas.'}
          </Text>

          <Text style={s.parrafo}>
            {'Para cualquier queja o aclaración respecto al servicio de inspección, el cliente podrá comunicarse al correo electrónico contacto@ciae.mx o al teléfono indicado en el contrato de inspección.'}
          </Text>

          <View style={s.separador} />

          {/* Cierre */}
          <View style={s.cierreContainer}>
            <Text style={s.cierreAtentamente}>ATENTAMENTE</Text>
            <Text style={s.cierreEmpresa}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
            <Text style={s.cierreUnidad}>UIIE-CRE-021</Text>
          </View>

          {/* Firma de recibido */}
          <View style={s.firmaContainer}>
            <Text style={s.firmaLabel}>Confirmar de Recibido:</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaNombre}>
              {datos.atiende_nombre ?? ''}
            </Text>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerTexto}>{datos.folio}</Text>
          <Text style={s.footerTexto}>CIAE — UIIE-CRE-021</Text>
          <Text
            style={s.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
