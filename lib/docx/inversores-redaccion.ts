// ─── Tipo unificado de inversor para todos los documentos ────────────────────
// Permite que un expediente tenga múltiples modelos (ej. 8 Sungrow + 2 Huawei).
// Si se pasa un array vacío, los generadores caen al modo legacy con
// `marca_inversor`/`modelo_inversor`/`num_inversores` por compat.

export type CertificacionInversor = 'ul1741' | 'ieee1547' | 'homologado_cne' | 'ninguna'

export interface InversorRow {
  marca:                  string
  modelo:                 string
  cantidad:               number
  potencia_kw?:           number | null
  certificacion:          CertificacionInversor
  justificacion_ieee1547?: string | null
  /** Texto largo del oficio CNE precargado (solo aplica si certificacion='homologado_cne') */
  redaccion_cne?:         string | null
}

// ─── Helpers de descripción ──────────────────────────────────────────────────

type EstiloTexto = 'acta' | 'lista'
// 'acta'  → "LOS 8 INVERSORES SUNGROW SG110CX"  (todo en mayúsculas, va dentro del cuerpo del acta)
// 'lista' → "Los 8 inversores Sungrow SG110CX"  (Sentence case, marca/modelo preservan caso original)

function descripcionInversor(inv: InversorRow, estilo: EstiloTexto): string {
  const cant = inv.cantidad
  const usaPlural = cant !== 1

  const marca = estilo === 'acta' ? inv.marca.toUpperCase() : inv.marca
  const modelo = estilo === 'acta' ? inv.modelo.toUpperCase() : inv.modelo
  const sustantivo = estilo === 'acta'
    ? (usaPlural ? 'INVERSORES' : 'INVERSOR')
    : (usaPlural ? 'inversores' : 'inversor')
  const articulo = estilo === 'acta'
    ? (usaPlural ? 'LOS' : 'EL')
    : (usaPlural ? 'Los' : 'El')

  return usaPlural
    ? `${articulo} ${cant} ${sustantivo} ${marca} ${modelo}`
    : `${articulo} ${sustantivo} ${marca} ${modelo}`
}

/**
 * Une lista de strings con comas y "y" final:
 *   ['a','b','c'] → "a, b y c"
 *   ['a','b']     → "a y b"
 *   ['a']         → "a"
 */
export function joinConY(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} y ${items[1]}`
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

/**
 * Cuando concatenamos dos descripciones para un mismo verbo, todas las
 * subsiguientes deben ir en minúscula porque ya no son inicio de frase.
 *   ["LOS 8 INVERSORES X", "LOS 2 INVERSORES Y"] → "LOS 8 INVERSORES X y los 2 INVERSORES Y"
 *   ["Los 8 inversores X", "El inversor Y"]      → "Los 8 inversores X y el inversor Y"
 */
function joinSujetos(items: string[], estilo: EstiloTexto): string {
  if (items.length <= 1) return joinConY(items)
  const primero = items[0]
  const resto = items.slice(1).map((s) => {
    if (estilo === 'acta') {
      // Bajamos solo el artículo (LOS/EL → los/el) para que se lea natural
      return s.replace(/^(LOS|EL)\b/, (m) => m.toLowerCase())
    }
    // En la lista, primera letra del artículo a minúscula
    return s.charAt(0).toLowerCase() + s.slice(1)
  })
  return joinConY([primero, ...resto])
}

/**
 * Devuelve la cantidad total de unidades de inversor (sumadas de todos los modelos).
 */
export function totalInversores(invs: InversorRow[]): number {
  return invs.reduce((acc, i) => acc + (i.cantidad || 0), 0)
}

// ─── Redacción para el ACTA ──────────────────────────────────────────────────
//
// Se genera un párrafo por grupo de certificación. Si todos los modelos tienen
// la misma certificación, queda un solo párrafo enunciando los N modelos juntos.

function textoInversorGrupoActa(
  invs: InversorRow[],
  cert: CertificacionInversor,
): string {
  if (invs.length === 0) return ''

  const sujetoLista = joinSujetos(invs.map((i) => descripcionInversor(i, 'acta')), 'acta')
  const totalCantidad = invs.reduce((s, i) => s + i.cantidad, 0)
  const plural = totalCantidad > 1 || invs.length > 1
  const verboCuenta = plural ? 'CUENTAN CON' : 'CUENTA CON'
  const verboCumple = plural ? 'CUMPLEN' : 'CUMPLE'

  if (cert === 'ul1741') {
    return (
      `${sujetoLista} ${verboCuenta} certificado internacional UL1741, por lo cual ${verboCumple} ` +
      `con los requerimientos establecidos en las DACGS para interconexión a la red. ` +
      `${plural ? 'Los inversores cuentan' : 'El inversor cuenta'} con certificados emitidos por laboratorios extranjeros o nacionales ` +
      `que demuestran el cumplimiento con las características para interconexión.`
    )
  }

  if (cert === 'homologado_cne') {
    // Si algún modelo trae redacción precargada del oficio CNE, la usamos.
    const redaccionesUnicas = Array.from(
      new Set(invs.map((i) => i.redaccion_cne).filter(Boolean) as string[]),
    )
    if (redaccionesUnicas.length === 1) return redaccionesUnicas[0]
    if (redaccionesUnicas.length > 1) return redaccionesUnicas.join(' ')
    return (
      `${sujetoLista} ${plural ? 'están HOMOLOGADOS' : 'está HOMOLOGADO'} a UL 1741 mediante el oficio F00.06.UE/225/2026 ` +
      `emitido por la Comisión Nacional de Energía (CNE) el 28 de enero de 2026, en el cual se acredita el cumplimiento ` +
      `de los parámetros de la Tabla 5 de la RES/142/2017 mediante reportes de pruebas operativas conforme a IEEE 1547 e IEC 61727. ` +
      `Por lo anterior ${verboCumple} con los requerimientos establecidos en las DACGS para interconexión a la red.`
    )
  }

  if (cert === 'ieee1547') {
    const justifs = Array.from(
      new Set(
        invs
          .map((i) => (i.justificacion_ieee1547 ?? '').trim())
          .filter((s) => s.length > 0),
      ),
    )
    const justifTxt = justifs.length
      ? joinConY(justifs)
      : 'El fabricante no tramitó la certificación UL1741 para ese modelo en el mercado mexicano'
    return (
      `${sujetoLista} NO ${verboCuenta} certificación UL1741. ${justifTxt}. ` +
      `Sin embargo, ${plural ? 'cuentan' : 'cuenta'} con certificación IEEE 1547, por lo cual ${verboCumple} ` +
      `con los requerimientos establecidos en las DACGS para interconexión. ` +
      `${plural ? 'Los inversores cuentan' : 'El inversor cuenta'} con certificados emitidos por laboratorios extranjeros o nacionales ` +
      `que demuestran el cumplimiento con las características para interconexión.`
    )
  }

  // ninguna
  return (
    `${sujetoLista} NO ${verboCuenta} certificación UL1741 ni IEEE 1547. ` +
    `Se levanta reporte de hallazgos adjunto al presente acta.`
  )
}

/**
 * Genera el texto final de inversores para el acta. Agrupa por certificación
 * y produce un párrafo por grupo. Si un proyecto tiene 8 Sungrow UL1741 y 2
 * Huawei homologados CNE, sale como dos enunciados consecutivos.
 */
export function textoActaInversores(invs: InversorRow[]): string {
  if (invs.length === 0) return '—'

  const grupos: Record<CertificacionInversor, InversorRow[]> = {
    ul1741: [], homologado_cne: [], ieee1547: [], ninguna: [],
  }
  for (const i of invs) grupos[i.certificacion].push(i)

  const partes: string[] = []
  for (const cert of ['ul1741', 'homologado_cne', 'ieee1547', 'ninguna'] as const) {
    if (grupos[cert].length > 0) partes.push(textoInversorGrupoActa(grupos[cert], cert))
  }
  return partes.join(' ')
}

// ─── Redacción para la LISTA DE VERIFICACIÓN ────────────────────────────────

const CERT_LABEL: Record<CertificacionInversor, string> = {
  ul1741:         'UL1741',
  ieee1547:       'IEEE 1547',
  homologado_cne: 'HOMOLOGADO A UL (CNE oficio F00.06.UE/225/2026)',
  ninguna:        '—',
}

export function observacionListaInversores(invs: InversorRow[]): string {
  if (invs.length === 0) return '—'

  const todosMismaCert = invs.every((i) => i.certificacion === invs[0].certificacion)
  const certUnica = todosMismaCert ? invs[0].certificacion : null
  const sujetoLista = joinSujetos(invs.map((i) => descripcionInversor(i, 'lista')), 'lista')
  const totalCantidad = invs.reduce((s, i) => s + i.cantidad, 0)
  const plural = totalCantidad > 1 || invs.length > 1

  if (certUnica && certUnica !== 'ninguna') {
    if (certUnica === 'homologado_cne') {
      const r = invs.find((i) => i.redaccion_cne)?.redaccion_cne
      return r
        ?? `${sujetoLista} con homologación oficial a UL 1741 reconocida por la Comisión Nacional de Energía mediante ` +
           `el oficio F00.06.UE/225/2026 del 28 de enero de 2026, en el cual se acreditan las pruebas de la ` +
           `Tabla 5 de la RES/142/2017 mediante reportes IEEE 1547 e IEC 61727. Por lo cual CUMPLE.`
    }
    return (
      `${sujetoLista} ${plural ? 'cuentan' : 'cuenta'} con certificación ${CERT_LABEL[certUnica]}, por lo cual cumple. ` +
      `${plural ? 'Los inversores cuentan' : 'El inversor cuenta'} con certificados emitidos por laboratorios extranjeros, ` +
      `los cuales demuestran el cumplimiento con las características para interconexión.`
    )
  }

  if (certUnica === 'ninguna') {
    return `${sujetoLista} ${plural ? 'no cuentan' : 'no cuenta'} con certificación UL1741 ni IEEE 1547. No Cumple.`
  }

  // Mezcla de certificaciones — enumeramos por grupo.
  const grupos: Record<CertificacionInversor, InversorRow[]> = {
    ul1741: [], homologado_cne: [], ieee1547: [], ninguna: [],
  }
  for (const i of invs) grupos[i.certificacion].push(i)

  const partes: string[] = []
  for (const cert of ['ul1741', 'homologado_cne', 'ieee1547', 'ninguna'] as const) {
    const g = grupos[cert]
    if (g.length === 0) continue
    const sujeto = joinSujetos(g.map((i) => descripcionInversor(i, 'lista')), 'lista')
    const gPlural = g.reduce((s, i) => s + i.cantidad, 0) > 1 || g.length > 1
    if (cert === 'ninguna') {
      partes.push(`${sujeto} sin certificación UL1741 ni IEEE 1547 (No Cumple).`)
    } else if (cert === 'homologado_cne') {
      partes.push(`${sujeto} ${gPlural ? 'están' : 'está'} homologado(s) a UL 1741 por la CNE (oficio F00.06.UE/225/2026).`)
    } else {
      partes.push(`${sujeto} con certificación ${CERT_LABEL[cert]}.`)
    }
  }
  return partes.join(' ')
}

/**
 * Decide si la fila "Inversor cuenta con certificación UL/IEEE" se marca como
 * Cumple (true), No Cumple (false) o N/A (null) en función de TODOS los inversores.
 * - Cumple si TODOS tienen alguna certificación válida (≠ 'ninguna').
 * - No Cumple si AL MENOS UNO está sin certificación.
 */
export function cumplimientoCertificacion(invs: InversorRow[]): boolean | null {
  if (invs.length === 0) return null
  return invs.every((i) => i.certificacion !== 'ninguna')
}

// ─── Helper para el Plan de Inspección ──────────────────────────────────────
// El plan solo necesita una descripción corta para listar el equipo a verificar.
export function descripcionParaPlan(invs: InversorRow[]): string {
  if (invs.length === 0) return ''
  return joinConY(
    invs.map((i) => `${i.cantidad} inversor${i.cantidad > 1 ? 'es' : ''} marca ${i.marca} modelo ${i.modelo}`),
  )
}
