import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sincroniza el certificado del expediente hacia la tabla central
 * `certificados_cre` (la que alimenta "Mis Certificados" y "Bóveda CNE").
 *
 * Razón: el flujo del expediente (CertificadoSection) escribe en columnas
 * de `expedientes` y en `documentos_expediente`, pero NO toca
 * `certificados_cre`. Esto causaba que un certificado subido desde el
 * expediente no apareciera en las vistas centrales. Esta función cierra
 * la brecha — se llama desde:
 *   - PATCH /api/expedientes/certificado (al guardar número/fecha)
 *   - POST  /api/documentos/subir        (al subir cert PDF / acuse)
 *
 * Idempotente. Solo crea/actualiza la fila si se cumplen TODAS las
 * condiciones: número de certificado lleno + al menos un documento de
 * tipo `certificado_cre`. Si solo hay número (sin archivo) o solo
 * archivo (sin número), no hace nada — la fila se materializa en cuanto
 * ambos coincidan.
 *
 * URLs: genera signed URLs con TTL de 10 años (lo mismo que usa la
 * Bóveda CNE central) sobre el bucket `documentos`.
 */
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10

export async function syncCertificadoCre(
  db: SupabaseClient,
  expedienteId: string,
  userId: string | null,
): Promise<{ ok: boolean; reason?: string; cert_id?: string }> {
  // 1. Datos del expediente
  const { data: exp, error: expErr } = await db
    .from('expedientes')
    .select('id, numero_certificado, fecha_emision_certificado, nombre_cliente_final')
    .eq('id', expedienteId)
    .maybeSingle()

  if (expErr || !exp) {
    return { ok: false, reason: 'expediente_no_encontrado' }
  }
  if (!exp.numero_certificado?.trim()) {
    return { ok: false, reason: 'sin_numero_certificado' }
  }

  // 2. Documentos del certificado y del acuse (más reciente de cada uno)
  const { data: certDocs } = await db
    .from('documentos_expediente')
    .select('storage_path, created_at')
    .eq('expediente_id', expedienteId)
    .eq('tipo', 'certificado_cre')
    .order('created_at', { ascending: false })
    .limit(1)

  const certPath = certDocs?.[0]?.storage_path as string | undefined
  if (!certPath) {
    return { ok: false, reason: 'sin_documento_certificado_cre' }
  }

  const { data: acuseDocs } = await db
    .from('documentos_expediente')
    .select('storage_path, created_at')
    .eq('expediente_id', expedienteId)
    .eq('tipo', 'acuse_cre')
    .order('created_at', { ascending: false })
    .limit(1)

  const acusePath = acuseDocs?.[0]?.storage_path as string | undefined

  // 3. Generar signed URLs de larga duración (la Bóveda CNE las renderea
  //    como `<a href={cert.url_cre}>` directo, así que tienen que vivir
  //    mucho tiempo)
  const { data: certSign, error: certSignErr } = await db.storage
    .from('documentos')
    .createSignedUrl(certPath, TEN_YEARS_SECONDS)

  if (certSignErr || !certSign?.signedUrl) {
    return { ok: false, reason: `firma_url_cert_fallo:${certSignErr?.message}` }
  }

  let acuseUrl: string | null = null
  if (acusePath) {
    const { data: acuseSign } = await db.storage
      .from('documentos')
      .createSignedUrl(acusePath, TEN_YEARS_SECONDS)
    acuseUrl = acuseSign?.signedUrl ?? null
  }

  // 4. Upsert: si ya hay row para este expediente, actualizar; si no, insertar
  const { data: existente } = await db
    .from('certificados_cre')
    .select('id')
    .eq('expediente_id', expedienteId)
    .maybeSingle()

  const payload = {
    numero_certificado: exp.numero_certificado.trim(),
    titulo:             exp.nombre_cliente_final ?? `Certificado ${exp.numero_certificado.trim()}`,
    url_cre:            certSign.signedUrl,
    url_acuse:          acuseUrl,
    storage_path_cert:  certPath,
    storage_path_acuse: acusePath ?? null,
    fecha_emision:      exp.fecha_emision_certificado ?? null,
    expediente_id:      expedienteId,
  }

  if (existente) {
    const { error } = await db
      .from('certificados_cre')
      .update(payload)
      .eq('id', existente.id)
    if (error) return { ok: false, reason: `update_fallo:${error.message}` }
    return { ok: true, cert_id: existente.id }
  } else {
    const { data: inserted, error } = await db
      .from('certificados_cre')
      .insert({ ...payload, created_by: userId })
      .select('id')
      .single()
    if (error) return { ok: false, reason: `insert_fallo:${error.message}` }
    return { ok: true, cert_id: inserted?.id }
  }
}
