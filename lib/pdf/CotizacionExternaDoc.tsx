import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Membrete } from './components/Membrete'
import { FilaInfo, SeccionTitulo } from './components/FilaInfo'

// ─── Datos bancarios CIAE ─────────────────────────────────────────────────────
const BANCO = {
  banco: 'BBVA Bancomer',
  cuenta: '0120855219',
  clabe: '012760001208552195',
  tarjeta: '4555 1130 1204 5680',
  nombre: 'Inteligencia en Ahorro de Energía S.A. de C.V.',
  rfc: 'IAE160824L54',
  facturacion: 'facturas@ciae.com.mx',
}

// ─── Mapeo de tipo de conexión ────────────────────────────────────────────────
const TIPO_CONEXION_LABEL: Record<string, string> = {
  generacion_distribuida: 'Generación Distribuida',
  net_metering: 'Net Metering',
  autoconsumo: 'Autoconsumo',
  isla: 'Sistema Aislado (Isla)',
  interconectado: 'Interconectado a la Red',
}

function labelConexion(raw: string): string {
  return TIPO_CONEXION_LABEL[raw] ?? raw
}

// ─── Interface ────────────────────────────────────────────────────────────────
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  folioRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  folioText: { fontSize: 8, color: '#6B7280' },
  folioNum: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F6E56' },

  // ── Tabla de servicio ──
  tabla: {
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 2,
  },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F6E56',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tablaHeaderTexto: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tablaFila: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  tablaFilaGris: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  tablaFilaTotal: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#0F6E56',
  },
  tablaTexto: { fontSize: 8, color: '#374151' },
  tablaNegrita: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111827' },
  tablaTotalTexto: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  colDescripcion: { flex: 3 },
  colCapacidad: { flex: 1, textAlign: 'center' },
  colPrecio: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },

  // ── Banco ──
  bancoBox: {
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 3,
    padding: 8,
    backgroundColor: '#F9FAFB',
  },
  bancoTitulo: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F6E56',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bancoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  bancoCol: {
    flex: 1,
  },
  bancoFila: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bancoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    width: 52,
  },
  bancoValor: {
    fontSize: 7.5,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  bancoNota: {
    fontSize: 7,
    color: '#6B7280',
    marginTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 4,
  },

  // ── Condiciones ──
  condicionItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  condicionBullet: { fontSize: 8, color: '#EF9F27', marginRight: 5, marginTop: 0.5 },
  condicionTexto: { fontSize: 8, color: '#374151', flex: 1 },

  // ── Firma ──
  firmaSeparador: { marginTop: 20, marginBottom: 10 },
  atentamente: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
  },
  firmaSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  firmaBloque: { alignItems: 'center', width: 210 },
  firmaLinea: {
    borderTopWidth: 0.8,
    borderTopColor: '#374151',
    width: 170,
    marginBottom: 4,
  },
  firmaNombre: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F6E56',
    textAlign: 'center',
  },
  firmaCargo: {
    fontSize: 7,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 4,
  },
  footerTexto: { fontSize: 6.5, color: '#9CA3AF' },
})

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`
}

// ─── Componente ───────────────────────────────────────────────────────────────
interface Props { datos: CotizacionData }

export function CotizacionExternaDoc({ datos }: Props) {
  const iva = Math.round((datos.precio_con_iva - datos.precio_sin_iva) * 100) / 100
  const anticipo = Math.round(datos.precio_con_iva * 0.5 * 100) / 100
  const tipoConexionLabel = labelConexion(datos.tipo_conexion)

  const condicionesBase: string[] = [
    `50% de anticipo (${formatCurrency(anticipo)}) para agendar la visita; liquidación antes de la inspección.`,
    'Los viáticos de traslado son a cargo del solicitante y no están incluidos en este precio.',
    `Vigencia de esta cotización: ${datos.vigencia_dias} días hábiles a partir de la fecha de emisión.`,
    'Para solicitar factura enviar comprobante de pago y Cédula de Identificación Fiscal a facturas@ciae.com.mx.',
  ]
  const condicionesFinales = datos.condiciones
    ? [...condicionesBase, ...datos.condiciones]
    : condicionesBase

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        <Membrete
          titulo="COTIZACIÓN DE SERVICIOS DE INSPECCIÓN"
          logoSrc={datos.logoSrc}
        />

        {/* Folio y fecha */}
        <View style={styles.folioRow}>
          <View>
            <Text style={styles.folioText}>
              No. Cotización: <Text style={styles.folioNum}>{datos.folio}</Text>
            </Text>
            <Text style={[styles.folioText, { textAlign: 'right', marginTop: 2 }]}>
              Fecha: {datos.fecha}
            </Text>
          </View>
        </View>

        {/* Datos del solicitante */}
        <SeccionTitulo texto="Datos del Solicitante" />
        <FilaInfo label="Nombre / Razón social" valor={datos.cliente_nombre} ancho={130} />
        {datos.cliente_rfc ? (
          <FilaInfo label="RFC" valor={datos.cliente_rfc} ancho={130} />
        ) : null}
        {datos.cliente_representante ? (
          <FilaInfo label="Representante" valor={datos.cliente_representante} ancho={130} />
        ) : null}
        <FilaInfo
          label="Lugar de instalación"
          valor={`${datos.ciudad_instalacion}, ${datos.estado_instalacion}`}
          ancho={130}
        />

        {/* Tabla de servicio */}
        <SeccionTitulo texto="Desglose del Servicio" />
        <View style={styles.tabla}>
          {/* Encabezado */}
          <View style={styles.tablaHeader}>
            <Text style={[styles.tablaHeaderTexto, styles.colDescripcion]}>Descripción del servicio</Text>
            <Text style={[styles.tablaHeaderTexto, styles.colCapacidad, { textAlign: 'center' }]}>
              Capacidad
            </Text>
            <Text style={[styles.tablaHeaderTexto, styles.colPrecio, { textAlign: 'right' }]}>
              Precio unit.
            </Text>
            <Text style={[styles.tablaHeaderTexto, styles.colTotal, { textAlign: 'right' }]}>
              Importe
            </Text>
          </View>

          {/* Fila servicio */}
          <View style={styles.tablaFila}>
            <View style={[styles.colDescripcion]}>
              <Text style={styles.tablaNegrita}>
                Inspección de instalación fotovoltaica
              </Text>
              <Text style={[styles.tablaTexto, { marginTop: 2, color: '#6B7280' }]}>
                Modalidad: {tipoConexionLabel} · DACG-NOM-001-SEDE-2012 · CRE
              </Text>
            </View>
            <Text style={[styles.tablaTexto, styles.colCapacidad, { textAlign: 'center' }]}>
              {datos.kwp} kWp
            </Text>
            <Text style={[styles.tablaTexto, styles.colPrecio, { textAlign: 'right' }]}>
              {formatCurrency(datos.precio_sin_iva)}
            </Text>
            <Text style={[styles.tablaTexto, styles.colTotal, { textAlign: 'right' }]}>
              {formatCurrency(datos.precio_sin_iva)}
            </Text>
          </View>

          {/* Subtotal */}
          <View style={styles.tablaFilaGris}>
            <Text style={[styles.tablaTexto, styles.colDescripcion, { color: '#6B7280' }]}>Subtotal</Text>
            <Text style={[styles.tablaTexto, styles.colCapacidad]} />
            <Text style={[styles.tablaTexto, styles.colPrecio]} />
            <Text style={[styles.tablaTexto, styles.colTotal, { textAlign: 'right' }]}>
              {formatCurrency(datos.precio_sin_iva)}
            </Text>
          </View>

          {/* IVA */}
          <View style={styles.tablaFilaGris}>
            <Text style={[styles.tablaTexto, styles.colDescripcion, { color: '#6B7280' }]}>IVA (16%)</Text>
            <Text style={[styles.tablaTexto, styles.colCapacidad]} />
            <Text style={[styles.tablaTexto, styles.colPrecio]} />
            <Text style={[styles.tablaTexto, styles.colTotal, { textAlign: 'right' }]}>
              {formatCurrency(iva)}
            </Text>
          </View>

          {/* Total */}
          <View style={styles.tablaFilaTotal}>
            <Text style={[styles.tablaTotalTexto, styles.colDescripcion]}>TOTAL A PAGAR</Text>
            <Text style={[styles.tablaTotalTexto, styles.colCapacidad]} />
            <Text style={[styles.tablaTotalTexto, styles.colPrecio]} />
            <Text style={[styles.tablaTotalTexto, styles.colTotal, { textAlign: 'right' }]}>
              {formatCurrency(datos.precio_con_iva)}
            </Text>
          </View>
        </View>

        {/* Datos bancarios */}
        <SeccionTitulo texto="Datos para el Pago" />
        <View style={styles.bancoBox}>
          <Text style={styles.bancoTitulo}>BBVA Bancomer — {BANCO.nombre}</Text>
          <View style={styles.bancoGrid}>
            <View style={styles.bancoCol}>
              <View style={styles.bancoFila}>
                <Text style={styles.bancoLabel}>Cuenta:</Text>
                <Text style={styles.bancoValor}>{BANCO.cuenta}</Text>
              </View>
              <View style={styles.bancoFila}>
                <Text style={styles.bancoLabel}>CLABE:</Text>
                <Text style={styles.bancoValor}>{BANCO.clabe}</Text>
              </View>
            </View>
            <View style={styles.bancoCol}>
              <View style={styles.bancoFila}>
                <Text style={styles.bancoLabel}>Tarjeta:</Text>
                <Text style={styles.bancoValor}>{BANCO.tarjeta}</Text>
              </View>
              <View style={styles.bancoFila}>
                <Text style={styles.bancoLabel}>RFC:</Text>
                <Text style={styles.bancoValor}>{BANCO.rfc}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.bancoNota}>
            Para facturación, enviar comprobante de pago y Cédula de Identificación Fiscal a:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{BANCO.facturacion}</Text>
            {'  ·  '}Fecha límite de solicitud: día 27 de cada mes.
          </Text>
        </View>

        {/* Condiciones */}
        <SeccionTitulo texto="Condiciones del Servicio" />
        {condicionesFinales.map((c, i) => (
          <View key={i} style={styles.condicionItem}>
            <Text style={styles.condicionBullet}>•</Text>
            <Text style={styles.condicionTexto}>{c}</Text>
          </View>
        ))}

        {/* Firma */}
        <Text style={[styles.atentamente, { marginTop: 18 }]}>Atentamente,</Text>
        <View style={styles.firmaSection}>
          <View style={styles.firmaBloque}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{datos.inspector_nombre}</Text>
            <Text style={styles.firmaCargo}>Inspector Responsable — UIIE-CRE-021</Text>
            <Text style={styles.firmaCargo}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
            {datos.inspector_cedula ? (
              <Text style={styles.firmaCargo}>Cédula Profesional: {datos.inspector_cedula}</Text>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTexto}>Cotización {datos.folio}</Text>
          <Text style={styles.footerTexto}>CIAE — UIIE-CRE-021  ·  RFC: IAE160824L54</Text>
          <Text
            style={styles.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
