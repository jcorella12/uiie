// Tabulador de precios UIIE-CRE-021 (precio base sin IVA)
export interface PriceRange {
  min: number
  max: number
  precio_base: number
}

export const TABULADOR: PriceRange[] = [
  { min: 0,   max: 9,   precio_base: 17000 },
  { min: 10,  max: 19,  precio_base: 18000 },
  { min: 20,  max: 29,  precio_base: 20000 },
  { min: 30,  max: 39,  precio_base: 22000 },
  { min: 40,  max: 49,  precio_base: 23000 },
  { min: 50,  max: 69,  precio_base: 25000 },
  { min: 70,  max: 79,  precio_base: 26000 },
  { min: 80,  max: 89,  precio_base: 27000 },
  { min: 90,  max: 99,  precio_base: 28000 },
  { min: 100, max: 124, precio_base: 30000 },
  { min: 125, max: 149, precio_base: 32000 },
  { min: 150, max: 199, precio_base: 34000 },
  { min: 200, max: 249, precio_base: 36000 },
  { min: 250, max: 299, precio_base: 38000 },
  { min: 300, max: 349, precio_base: 41000 },
  { min: 350, max: 399, precio_base: 44000 },
  { min: 400, max: 449, precio_base: 47000 },
  { min: 450, max: 499, precio_base: 50000 },
]

export const UMBRAL_AUTORIZACION = 0.70 // 70% del precio base

export function getPrecioBase(kwp: number): number | null {
  const range = TABULADOR.find((r) => kwp >= r.min && kwp <= r.max)
  return range ? range.precio_base : null
}

export function calcularPorcentaje(precioBase: number, precioPropuesto: number): number {
  if (precioBase <= 0) return 0
  return (precioPropuesto / precioBase) * 100
}

export function requiereAutorizacion(kwp: number, precioPropuesto: number): boolean {
  const base = getPrecioBase(kwp)
  if (!base) return false
  const pct = calcularPorcentaje(base, precioPropuesto)
  return pct < UMBRAL_AUTORIZACION * 100
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getPriceAlertLevel(porcentaje: number): 'ok' | 'warning' | 'danger' {
  if (porcentaje >= 100) return 'ok'
  if (porcentaje >= 70) return 'warning'
  return 'danger'
}
