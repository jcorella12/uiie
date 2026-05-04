// ============================================================
// Configuración centralizada de modelos de Claude (Anthropic)
// ============================================================
// Cambiar aquí afecta a todos los endpoints que usan IA.
// Útil para experimentar con modelos más baratos en tareas simples
// (ej. OCR de medidor) sin tener que tocar 11 archivos.
//
// Referencia de modelos: https://docs.claude.com/en/docs/about-claude/models

import Anthropic from '@anthropic-ai/sdk'

/**
 * Catálogo de modelos por caso de uso.
 * Mantén estos nombres alineados con los que documenta Anthropic.
 *
 * Si quieres ahorrar costo: prueba bajar OCR a un modelo más barato (Sonnet
 * o Haiku) — el OCR de INE/medidor son tareas estructuradas con JSON de
 * salida y los modelos chicos rinden bien.
 */
export const CLAUDE_MODELS = {
  // OCR de documentos simples (INE, medidor CFE, placa de inversor).
  OCR:           'claude-opus-4-5',
  // Análisis y revisión de documentos completos del expediente
  // (planos, memorias técnicas, contratos). Requiere razonamiento más profundo.
  ANALISIS_DOC:  'claude-opus-4-5',
  // Lectura de certificados CRE / CNE — extracción estructurada
  CERTIFICADOS:  'claude-opus-4-5',
  // Importación masiva de testigos desde lote de INEs
  IMPORT_BATCH:  'claude-opus-4-5',
} as const

/**
 * Cliente Anthropic singleton. Lanza error explícito si falta la API key,
 * en lugar de fallar dentro de un endpoint con un mensaje vago.
 */
let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_client) return _client

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está definida. Configúrala en .env.local')
  }

  _client = new Anthropic({ apiKey })
  return _client
}
