/**
 * Calcula el "market share" de la unidad de inspección vs el total
 * nacional de certificados CNE emitidos.
 *
 * Cómo funciona:
 * Cada certificado emitido a nivel nacional recibe un número secuencial
 * (UIIE-CC-XXXXX-YYYY donde XXXXX es el consecutivo nacional). Si en el
 * mes vimos un cert con #2840 y en el mes anterior nuestro cert más alto
 * fue #2300, entonces a nivel nacional se emitieron ~540 certs en este
 * mes. Si nosotros emitimos 60, nuestro share fue ~11%.
 *
 * Limitación: la métrica asume que vemos suficientes certs como para
 * "ver" el progreso de los números nacionales. Si en un mes no
 * emitimos ninguno, se infiere del próximo periodo en que sí emitimos.
 */

export interface CertRaw {
  numero_certificado: string             // ej. "UIIE-CC-02840-2026"
  fecha_emision_certificado: string      // "YYYY-MM-DD"
}

export interface PeriodoStats {
  label:           string                // ej. "Mayo 2026", "Sem 18", "Q2 2026"
  start:           string                // ISO date
  end:             string                // ISO date
  nuestros:        number                // certs emitidos por nosotros en el periodo
  nacional_estim:  number                // certs emitidos a nivel nacional (estimado)
  share_pct:       number                // 0-100
}

export type Granularidad = 'semana' | 'mes' | 'trimestre'

interface ParsedCert {
  num:    number          // ej. 2840
  year:   number          // ej. 2026
  fecha:  Date
}

function parseCertNumber(s: string): { num: number; year: number } | null {
  const m = s.match(/UIIE-CC-(\d+)-(\d{4})/i)
  if (!m) return null
  return { num: parseInt(m[1], 10), year: parseInt(m[2], 10) }
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  // Lunes = 1, Domingo = 0 → restar para llegar al lunes
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3)
  return new Date(d.getFullYear(), q * 3, 1)
}

function nextPeriodStart(start: Date, gran: Granularidad): Date {
  const d = new Date(start)
  if (gran === 'semana')    d.setDate(d.getDate() + 7)
  if (gran === 'mes')       d.setMonth(d.getMonth() + 1)
  if (gran === 'trimestre') d.setMonth(d.getMonth() + 3)
  return d
}

function labelFor(d: Date, gran: Granularidad): string {
  if (gran === 'semana') {
    // Número de semana ISO aproximado
    const onejan = new Date(d.getFullYear(), 0, 1)
    const diasDesde = Math.floor((d.getTime() - onejan.getTime()) / 86400000)
    const week = Math.ceil((diasDesde + onejan.getDay() + 1) / 7)
    return `Sem ${week} · ${d.getFullYear()}`
  }
  if (gran === 'mes') {
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }
  // trimestre
  const q = Math.floor(d.getMonth() / 3) + 1
  return `Q${q} ${d.getFullYear()}`
}

/**
 * Calcula stats por periodo. Solo considera certs del año más reciente
 * encontrado en los datos (los números resetean cada año).
 *
 * Si quieres limitar al año actual, filtra antes de llamar.
 */
export function calcMarketShare(
  certs: CertRaw[],
  gran: Granularidad,
  year?: number,
): PeriodoStats[] {
  const parsed: ParsedCert[] = certs
    .map(c => {
      const p = parseCertNumber(c.numero_certificado)
      if (!p) return null
      return { num: p.num, year: p.year, fecha: new Date(c.fecha_emision_certificado + 'T12:00:00') }
    })
    .filter((p): p is ParsedCert => p !== null && !isNaN(p.fecha.getTime()))

  // Filtrar por año si se pide; si no, tomar el más reciente presente
  const targetYear = year ?? Math.max(...parsed.map(p => p.year), new Date().getFullYear())
  const ofYear = parsed.filter(p => p.year === targetYear)
  if (ofYear.length === 0) return []

  // Sort por fecha ascendente
  ofYear.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  // Construir buckets de periodos del año
  const minDate = ofYear[0].fecha
  const maxDate = ofYear[ofYear.length - 1].fecha

  let periodStart: Date
  if (gran === 'semana')         periodStart = startOfWeek(minDate)
  else if (gran === 'mes')       periodStart = startOfMonth(minDate)
  else                            periodStart = startOfQuarter(minDate)

  const out: PeriodoStats[] = []
  // El "max nacional anterior" es el cert más alto que vimos antes del
  // inicio del periodo en cuestión. Para el primer periodo, asumimos
  // que el primer cert visto - 1 es el "anterior".
  // Si nunca emitimos antes del año, el primer cert del año marca el inicio.

  let maxAnterior = ofYear[0].num - 1

  while (periodStart <= maxDate) {
    const periodEnd = nextPeriodStart(periodStart, gran)
    const enPeriodo = ofYear.filter(p => p.fecha >= periodStart && p.fecha < periodEnd)

    if (enPeriodo.length === 0) {
      // No emitimos nada — saltamos
      periodStart = periodEnd
      continue
    }

    const maxEnPeriodo = Math.max(...enPeriodo.map(p => p.num))
    const nuestros = enPeriodo.length
    // Total nacional emitido en el periodo = la diferencia de "altos
    // vistos". Mínimo es "nuestros" (al menos los nuestros se emitieron).
    const nacional_estim = Math.max(maxEnPeriodo - maxAnterior, nuestros)
    const share_pct = nacional_estim > 0 ? (nuestros / nacional_estim) * 100 : 0

    out.push({
      label: labelFor(periodStart, gran),
      start: periodStart.toISOString().slice(0, 10),
      end:   new Date(periodEnd.getTime() - 86400000).toISOString().slice(0, 10),
      nuestros,
      nacional_estim,
      share_pct,
    })

    maxAnterior = Math.max(maxAnterior, maxEnPeriodo)
    periodStart = periodEnd
  }

  return out
}

/** Resumen anual: stats agregados de todo el año. */
export interface ResumenAnual {
  year:           number
  nuestros:       number
  nacional_estim: number
  share_pct:      number
  cert_min:       number
  cert_max:       number
}

export function calcResumenAnual(certs: CertRaw[], year?: number): ResumenAnual | null {
  const parsed = certs
    .map(c => parseCertNumber(c.numero_certificado))
    .filter((p): p is { num: number; year: number } => p !== null)

  const targetYear = year ?? Math.max(...parsed.map(p => p.year), new Date().getFullYear())
  const ofYear = parsed.filter(p => p.year === targetYear)
  if (ofYear.length === 0) return null

  const nums = ofYear.map(p => p.num)
  const cert_min = Math.min(...nums)
  const cert_max = Math.max(...nums)
  const nuestros = ofYear.length
  // Total nacional estimado = max - 0 (asume que la secuencia empezó en 1).
  // Para 2026, el rango va 1..maxObservado.
  const nacional_estim = cert_max
  const share_pct = nacional_estim > 0 ? (nuestros / nacional_estim) * 100 : 0

  return { year: targetYear, nuestros, nacional_estim, share_pct, cert_min, cert_max }
}
