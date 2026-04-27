import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logo: {
    width: 62,
    height: 50,
    marginRight: 12,
    objectFit: 'contain',
  },
  accentBar: {
    width: 7,
    backgroundColor: '#0F6E56',
    marginRight: 12,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  empresaBlock: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  empresaNombre: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F6E56',
    letterSpacing: 0.3,
  },
  empresaRazon: {
    fontSize: 7.5,
    color: '#4B5563',
    marginTop: 1.5,
  },
  empresaDatos: {
    fontSize: 6.5,
    color: '#9CA3AF',
    marginTop: 1.5,
  },
  separadorGrueso: {
    borderBottomWidth: 3,
    borderBottomColor: '#0F6E56',
    marginBottom: 5,
  },
  separadorFino: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    marginBottom: 3,
  },
  titulo: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0F6E56',
    textAlign: 'center',
    marginVertical: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitulo: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 3,
  },
})

interface MembreteProps {
  titulo: string
  subtitulo?: string
  logoSrc?: string
}

export function Membrete({ titulo, subtitulo, logoSrc }: MembreteProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {logoSrc ? (
          <Image src={logoSrc} style={styles.logo} />
        ) : (
          <View style={styles.accentBar} />
        )}
        <View style={styles.empresaBlock}>
          <Text style={styles.empresaNombre}>CIAE — UIIE-CRE-021</Text>
          <Text style={styles.empresaRazon}>INTELIGENCIA EN AHORRO DE ENERGÍA S.A. DE C.V.</Text>
          <Text style={styles.empresaDatos}>RFC: IAE160824L54  ·  Acreditación CRE: RES/821/2019 (19-Jul-2019)</Text>
          <Text style={styles.empresaDatos}>Calle 2 #5, Col. La Victoria, Hermosillo, Sonora  C.P. 83304</Text>
          <Text style={styles.empresaDatos}>Tel: (662) 282-0016 / (662) 267-2381  ·  uiie@ciae.com.mx</Text>
        </View>
      </View>

      <View style={styles.separadorGrueso} />
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      <View style={styles.separadorFino} />
    </View>
  )
}
