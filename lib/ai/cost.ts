/**
 * Helper para calcular y registrar costos de uso de la API de Claude (Anthropic).
 *
 * Tabla de precios por modelo (USD por 1 millón de tokens).
 * Fuente: https://www.anthropic.com/pricing
 *
 * Ajusta los precios aquí si Anthropic los cambia.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Precios por modelo (USD por 1M tokens) ──────────────────────────────────
const PRICING: Record<string, {
  input:        number   // $/M tokens de entrada
  output:       number   // $/M tokens de salida
  cacheRead:    number   // $/M tokens leídos del prompt cache
  cacheWrite:   number   // $/M tokens escritos al prompt cache (5min TTL)
}> = {
  // Claude Opus 4.5 (precios aproximados — ajustar si cambia)
  'claude-opus-4-5':       { input: 5,    output: 25,   cacheRead: 0.50, cacheWrite: 6.25  },
  'claude-opus-4-5-20251015': { input: 5, output: 25,   cacheRead: 0.50, cacheWrite: 6.25  },

  // Claude Sonnet 4.5
  'claude-sonnet-4-5':     { input: 3,    output: 15,   cacheRead: 0.30, cacheWrite: 3.75  },

  // Claude Haiku
  'claude-haiku-4-5':      { input: 1,    output: 5,    cacheRead: 0.10, cacheWrite: 1.25  },

  // Modelos legacy (por si quedan referencias)
  'claude-3-5-sonnet-20241022': { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3-5-haiku-20241022':  { input: 1, output: 5,  cacheRead: 0.10, cacheWrite: 1.25 },
}

// Precio por defecto si el modelo no está en la tabla
const DEFAULT_PRICING = { input: 5, output: 25, cacheRead: 0.50, cacheWrite: 6.25 }

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Acepta tanto undefined como null (Anthropic SDK devuelve null en algunos casos)
export interface UsageInfo {
  input_tokens?:                number | null
  output_tokens?:               number | null
  cache_read_input_tokens?:     number | null
  cache_creation_input_tokens?: number | null
}

// ─── Cálculo de costo ────────────────────────────────────────────────────────
/**
 * Calcula el costo en USD a partir del usage que devuelve la API de Anthropic.
 */
export function calcularCostoUSD(usage: UsageInfo, modelo: string): number {
  const p = PRICING[modelo] ?? DEFAULT_PRICING

  const inTok      = usage.input_tokens ?? 0
  const outTok     = usage.output_tokens ?? 0
  const cacheRead  = usage.cache_read_input_tokens ?? 0
  const cacheWrite = usage.cache_creation_input_tokens ?? 0

  const costo =
      (inTok      * p.input)      / 1_000_000 +
      (outTok     * p.output)     / 1_000_000 +
      (cacheRead  * p.cacheRead)  / 1_000_000 +
      (cacheWrite * p.cacheWrite) / 1_000_000

  // Redondear a 6 decimales para evitar problemas de precisión flotante
  return Math.round(costo * 1_000_000) / 1_000_000
}

// ─── Registro en DB ──────────────────────────────────────────────────────────
export interface RegistrarCostoArgs {
  /** Cliente Supabase con permisos de service role (createServiceClient). */
  supabase:       SupabaseClient
  /** ID del usuario que invocó la IA. */
  usuarioId:      string | null
  /** ID del expediente al que se asocia (si aplica). */
  expedienteId?:  string | null
  /** Identificador del endpoint que llamó a la IA. */
  endpoint:       string
  /** Nombre del modelo invocado. */
  modelo:         string
  /** Usage que devuelve la API de Anthropic. */
  usage:          UsageInfo
  /** ¿La llamada fue exitosa o falló? */
  exitoso?:       boolean
  /** JSON adicional con detalle (para debug). */
  detalle?:       any
}

/**
 * Registra el costo en la tabla `ai_costos`. No lanza errores — falla silenciosa
 * para no romper el flujo principal. Devuelve el costo en USD calculado.
 */
export async function registrarCostoIA(args: RegistrarCostoArgs): Promise<number> {
  const { supabase, usuarioId, expedienteId, endpoint, modelo, usage, exitoso = true, detalle } = args

  const costoUSD = calcularCostoUSD(usage, modelo)

  try {
    await supabase.from('ai_costos').insert({
      usuario_id:          usuarioId,
      expediente_id:       expedienteId ?? null,
      endpoint,
      modelo,
      tokens_input:        usage.input_tokens ?? 0,
      tokens_output:       usage.output_tokens ?? 0,
      tokens_cache_read:   usage.cache_read_input_tokens ?? 0,
      tokens_cache_write:  usage.cache_creation_input_tokens ?? 0,
      costo_usd:           costoUSD,
      exitoso,
      detalle:             detalle ?? null,
    })
  } catch (e: any) {
    // No bloqueamos el flujo principal por un error de logging
    console.error('[ai-cost] No se pudo registrar costo:', e?.message)
  }

  return costoUSD
}

/**
 * Formatea un costo en USD para mostrarlo en la UI.
 * Para montos muy chicos (< $0.01) usa más decimales.
 */
export function formatearCostoUSD(usd: number): string {
  if (usd >= 1)        return `$${usd.toFixed(2)}`
  if (usd >= 0.01)     return `$${usd.toFixed(3)}`
  if (usd >= 0.001)    return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(6)}`
}
