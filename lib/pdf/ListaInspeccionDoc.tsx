import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'
import {
  observacionListaInversores,
  cumplimientoCertificacion,
  type InversorRow,
} from '@/lib/docx/inversores-redaccion'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ListaData {
  logoSrc?: string
  folio: string
  fecha: string             // "15 de enero de 2026"
  // Cliente
  cliente_nombre: string
  atiende_nombre: string
  // Dirección
  direccion: string
  colonia?: string
  codigo_postal?: string
  municipio?: string
  ciudad: string
  estado: string
  // Inspector
  inspector_nombre: string
  // Checks
  tipo_central: string      // 'MT' | 'BT'
  tiene_ccfp: boolean
  numero_medidor: string
  tiene_i1_i2: boolean
  dictamen_folio_dvnp: string
  // Inversores (lista preferente)
  inversores?: InversorRow[]
  num_inversores: number
  marca_inversor: string
  modelo_inversor: string
  certificacion_inversor: 'ul1741' | 'ieee1547' | 'ninguna'
  // Subestación
  capacidad_subestacion_kva?: number
  // Resultado global
  resultado: 'aprobado' | 'rechazado' | 'condicionado'
}

// ─── Widths (landscape Letter: 792 × 612, margins 36 → usable 720pt) ─────────

const W = {
  inciso:   36,
  cuest:    76,
  exSI:     26,
  exNO:     26,
  exNA:     26,
  criterio: 152,
  cumSI:    26,
  cumNO:    26,
  obs:      326,  // remainder
}
const TOTAL = Object.values(W).reduce((a, b) => a + b, 0) // = 720

// ─── Estilos ──────────────────────────────────────────────────────────────────

const BDR = '#000000'

const s = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },

  // ── Encabezado ──
  headerTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BDR,
    marginBottom: 6,
  },
  headerLogoCell: {
    width: 70,
    borderRightWidth: 1,
    borderRightColor: BDR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  headerLogo: { width: 54, height: 40, objectFit: 'contain' },
  headerCompanyCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: BDR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  headerCompanyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  headerInfoCell: {
    width: 260,
    padding: 4,
    justifyContent: 'space-between',
  },
  headerInfoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  headerInfoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    marginRight: 3,
  },
  headerInfoValue: {
    fontSize: 7.5,
    flex: 1,
    flexWrap: 'wrap',
  },

  // ── Título de lista ──
  listaTitulo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 5,
    textDecoration: 'underline',
  },

  // ── Tabla principal ──
  tabla: {
    borderWidth: 1,
    borderColor: BDR,
  },

  // Fila de encabezado nivel 1
  thRow1: {
    flexDirection: 'row',
    backgroundColor: '#CCCCCC',
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },
  // Fila de encabezado nivel 2 (sub-headers)
  thRow2: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderBottomWidth: 1,
    borderBottomColor: BDR,
  },

  // Celda de encabezado genérica
  thCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  thText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textAlign: 'center',
    color: '#000000',
  },
  thLastCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Fila de datos
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    minHeight: 40,
  },
  dataRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    backgroundColor: '#F9F9F9',
    minHeight: 40,
  },

  // Celda de datos genérica
  dataCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: BDR,
  },
  dataCellLast: {
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  dataText: {
    fontSize: 7.5,
    color: '#000000',
    lineHeight: 1.4,
  },
  dataBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
  },
  checkX: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
  },
  checkSI: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0A5C36',
    textAlign: 'center',
  },
  checkNO: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#991B1B',
    textAlign: 'center',
  },

  // Sección títulos
  seccionRow: {
    flexDirection: 'row',
    backgroundColor: '#BBBBBB',
    borderBottomWidth: 1,
    borderBottomColor: BDR,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  seccionText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#000000',
  },

  // Firmas
  firmasRow: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'space-around',
  },
  firmaBloque: {
    alignItems: 'center',
    width: '35%',
  },
  firmaBloqueLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 16,
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: BDR,
    width: '100%',
    marginBottom: 3,
  },
  firmaNombre: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  firmaCargo: {
    fontSize: 7,
    textAlign: 'center',
    color: '#444444',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#AAAAAA',
    paddingTop: 3,
  },
  footerText: { fontSize: 6.5, color: '#666666' },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Fila {
  inciso: string
  cuestionamiento: string
  criterio: string
  cumple: boolean | null
  observacion: string
}

function buildFilas(d: ListaData): Fila[] {
  const tc = d.tipo_central ?? 'MT'

  // Multi-inversor: lista preferente, si no, fallback al campo legacy.
  const inversores: InversorRow[] = (d.inversores && d.inversores.length > 0)
    ? d.inversores
    : [{
        marca: d.marca_inversor,
        modelo: d.modelo_inversor,
        cantidad: d.num_inversores ?? 1,
        certificacion: d.certificacion_inversor as InversorRow['certificacion'],
      }]
  const obsInversores = observacionListaInversores(inversores)
  const cumpleCert = cumplimientoCertificacion(inversores)

  return [
    {
      inciso: '1.1',
      cuestionamiento: 'Corta circuito Fusible de Potencia',
      criterio: `Corta circuito Fusible de Potencia de Acuerdo a lo determinado en las DACG de Generación Distribuida en Centrales tipo ${tc}`,
      cumple: d.tiene_ccfp,
      observacion: d.tiene_ccfp
        ? `Se encontraron los CCFP en la instalación por lo cual Cumple. La persona encargada de la visita que se presentó como ${d.atiende_nombre} y que se identificó con credencial emitida por el INE, quien durante la inspección mostró la bajada área de las líneas de CFE donde se encontraba el CCFP.`
        : `No se encontraron los CCFP en la instalación por lo cual No Cumple.`,
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
        : `No se encontraron protecciones I1 e I2 en los inversores por lo cual No Cumple.`,
    },
    {
      inciso: '1.4',
      cuestionamiento: 'Certificaciones de operación en Campo',
      criterio: 'Inversor Cuenta con la certificación UL o cumple con los requerimientos establecidos en las DACGS',
      cumple: cumpleCert,
      observacion: obsInversores,
    },
    {
      inciso: '1.5',
      cuestionamiento: 'Sub Estación Eléctrica',
      criterio: 'Subestación Eléctrica de acuerdo a la capacidad fotovoltaica instalada',
      cumple: d.capacidad_subestacion_kva != null ? true : null,
      observacion: d.capacidad_subestacion_kva != null
        ? `La central eléctrica no está por arriba del 80% de la capacidad fotovoltaica por lo cual cumple. Se encontró en campo una subestación de capacidad de ${d.capacidad_subestacion_kva} KVA. Tomando en cuenta la potencia en AC.`
        : 'N/A — No aplica subestación en esta instalación.',
    },
  ]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ListaInspeccionDoc({ datos }: { datos: ListaData }) {
  const filas = buildFilas(datos)

  const domicilio = [
    datos.direccion,
    datos.colonia ?? null,
    datos.codigo_postal ? `C.P. ${datos.codigo_postal}` : null,
    datos.ciudad,
    datos.municipio ?? null,
    datos.estado,
  ].filter(Boolean).join(', ')

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={s.page}>

        {/* ══ ENCABEZADO ══ */}
        <View style={s.headerTable}>
          {/* Logo */}
          <View style={s.headerLogoCell}>
            {datos.logoSrc
              ? <Image src={datos.logoSrc} style={s.headerLogo} />
              : <Text style={{ fontSize: 7 }}>LOGO</Text>}
          </View>

          {/* Nombre de la unidad */}
          <View style={s.headerCompanyCell}>
            <Text style={s.headerCompanyName}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
          </View>

          {/* Datos del expediente */}
          <View style={s.headerInfoCell}>
            <View style={s.headerInfoRow}>
              <Text style={s.headerInfoLabel}>Proyecto:</Text>
              <Text style={s.headerInfoValue}>{datos.folio}</Text>
            </View>
            <View style={s.headerInfoRow}>
              <Text style={s.headerInfoLabel}>CLIENTE:</Text>
              <Text style={s.headerInfoValue}>{datos.cliente_nombre}</Text>
            </View>
            <View style={s.headerInfoRow}>
              <Text style={s.headerInfoLabel}>Fecha:</Text>
              <Text style={s.headerInfoValue}>{datos.fecha}</Text>
            </View>
            <View style={s.headerInfoRow}>
              <Text style={s.headerInfoLabel}>DIRECCIÓN:</Text>
              <Text style={s.headerInfoValue}>{domicilio}</Text>
            </View>
            <View style={s.headerInfoRow}>
              <Text
                style={[s.headerInfoValue, { fontFamily: 'Helvetica-Bold' }]}
                render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
              />
            </View>
          </View>
        </View>

        {/* ══ TÍTULO ══ */}
        <Text style={s.listaTitulo}>Lista de Inspección</Text>

        {/* ══ TABLA ══ */}
        <View style={s.tabla}>

          {/* ── Encabezado fila 1 ── */}
          <View style={s.thRow1}>
            <View style={[s.thCell, { width: W.inciso }]}>
              <Text style={s.thText}>Inciso</Text>
            </View>
            <View style={[s.thCell, { width: W.cuest }]}>
              <Text style={s.thText}>CUESTIONAMIENTO</Text>
            </View>
            {/* EXISTE span 3 */}
            <View style={[s.thCell, { width: W.exSI + W.exNO + W.exNA }]}>
              <Text style={s.thText}>EXISTE{'\n'}DOCUMENTAL/CAMPO</Text>
            </View>
            <View style={[s.thCell, { width: W.criterio }]}>
              <Text style={s.thText}>CRITERIO{'\n'}ACEPTACIÓN/RECHAZO</Text>
            </View>
            {/* CUMPLIMIENTO span 2 */}
            <View style={[s.thCell, { width: W.cumSI + W.cumNO }]}>
              <Text style={s.thText}>CUMPLIMIENTO</Text>
            </View>
            <View style={[s.thLastCell, { width: W.obs }]}>
              <Text style={s.thText}>OBSERVACIONES</Text>
            </View>
          </View>

          {/* ── Encabezado fila 2 (sub-headers) ── */}
          <View style={s.thRow2}>
            <View style={[s.thCell, { width: W.inciso }]} />
            <View style={[s.thCell, { width: W.cuest }]} />
            <View style={[s.thCell, { width: W.exSI }]}>
              <Text style={s.thText}>SI</Text>
            </View>
            <View style={[s.thCell, { width: W.exNO }]}>
              <Text style={s.thText}>NO</Text>
            </View>
            <View style={[s.thCell, { width: W.exNA }]}>
              <Text style={s.thText}>N/A</Text>
            </View>
            <View style={[s.thCell, { width: W.criterio }]} />
            <View style={[s.thCell, { width: W.cumSI }]}>
              <Text style={s.thText}>SI</Text>
            </View>
            <View style={[s.thCell, { width: W.cumNO }]}>
              <Text style={s.thText}>NO</Text>
            </View>
            <View style={[s.thLastCell, { width: W.obs }]} />
          </View>

          {/* ── Fila de sección ── */}
          <View style={s.seccionRow}>
            <Text style={s.seccionText}>Subestaciones y Líneas</Text>
          </View>

          {/* ── Filas de datos ── */}
          {filas.map((fila, idx) => {
            const esAlt = idx % 2 === 1
            const rowStyle = esAlt ? s.dataRowAlt : s.dataRow
            const cumpleNA = fila.cumple === null

            return (
              <View key={fila.inciso} style={rowStyle}>
                {/* Inciso */}
                <View style={[s.dataCell, { width: W.inciso, alignItems: 'center' }]}>
                  <Text style={s.dataBold}>{fila.inciso}</Text>
                </View>
                {/* Cuestionamiento */}
                <View style={[s.dataCell, { width: W.cuest }]}>
                  <Text style={s.dataText}>{fila.cuestionamiento}</Text>
                </View>
                {/* EXISTE SI */}
                <View style={[s.dataCell, { width: W.exSI, alignItems: 'center' }]}>
                  {!cumpleNA && <Text style={s.checkX}>X</Text>}
                </View>
                {/* EXISTE NO */}
                <View style={[s.dataCell, { width: W.exNO, alignItems: 'center' }]} />
                {/* EXISTE N/A */}
                <View style={[s.dataCell, { width: W.exNA, alignItems: 'center' }]}>
                  {cumpleNA && <Text style={s.checkX}>X</Text>}
                </View>
                {/* Criterio */}
                <View style={[s.dataCell, { width: W.criterio }]}>
                  <Text style={s.dataText}>{fila.criterio}</Text>
                </View>
                {/* CUMPLIMIENTO SI */}
                <View style={[s.dataCell, { width: W.cumSI, alignItems: 'center' }]}>
                  {fila.cumple === true && <Text style={s.checkSI}>X</Text>}
                </View>
                {/* CUMPLIMIENTO NO */}
                <View style={[s.dataCell, { width: W.cumNO, alignItems: 'center' }]}>
                  {fila.cumple === false && <Text style={s.checkNO}>X</Text>}
                </View>
                {/* Observaciones */}
                <View style={[s.dataCellLast, { width: W.obs }]}>
                  <Text style={s.dataText}>{fila.observacion}</Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* ══ FIRMAS ══ */}
        <View style={s.firmasRow}>
          <View style={s.firmaBloque}>
            <Text style={s.firmaBloqueLabel}>CLIENTE</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaNombre}>{datos.atiende_nombre}</Text>
            <Text style={s.firmaCargo}>Nombre y Firma</Text>
          </View>
          <View style={s.firmaBloque}>
            <Text style={s.firmaBloqueLabel}>INSPECTOR</Text>
            <View style={s.firmaLinea} />
            <Text style={s.firmaNombre}>{datos.inspector_nombre}</Text>
            <Text style={s.firmaCargo}>Nombre y Firma</Text>
          </View>
        </View>

        {/* ══ FOOTER ══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{datos.folio}</Text>
          <Text style={s.footerText}>Lista de Inspección — UIIE-CRE-021</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
