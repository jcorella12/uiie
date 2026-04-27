import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    marginRight: 6,
  },
  valor: {
    fontSize: 9,
    color: '#111827',
    flex: 1,
  },
  seccionWrapper: {
    marginTop: 10,
    marginBottom: 4,
  },
  seccionTexto: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F6E56',
    paddingBottom: 3,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#0F6E56',
  },
})

interface FilaInfoProps {
  label: string
  valor: string | number | undefined | null
  ancho?: number
}

export function FilaInfo({ label, valor, ancho }: FilaInfoProps) {
  const labelStyle = ancho
    ? { ...styles.label, width: ancho }
    : styles.label

  return (
    <View style={styles.fila}>
      <Text style={labelStyle}>{label}:</Text>
      <Text style={styles.valor}>{valor !== undefined && valor !== null ? String(valor) : '—'}</Text>
    </View>
  )
}

interface SeccionTituloProps {
  texto: string
}

export function SeccionTitulo({ texto }: SeccionTituloProps) {
  return (
    <View style={styles.seccionWrapper}>
      <Text style={styles.seccionTexto}>{texto.toUpperCase()}</Text>
    </View>
  )
}
