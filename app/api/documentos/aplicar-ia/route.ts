import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/documentos/aplicar-ia
 * Toma los datos extraídos por IA de un documento (analisis_ia)
 * y los aplica a los campos correspondientes del expediente.
 *
 * Body: { documento_id: string, tipo: 'resolutivo' | 'dictamen', expediente_id: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { documento_id, tipo, expediente_id } = await req.json()
  if (!documento_id || !tipo || !expediente_id) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verify the user has access to this expediente via RLS before using service client to write
  const { data: expAccess } = await supabase
    .from('expedientes')
    .select('id, nombre_cliente_final')
    .eq('id', expediente_id)
    .maybeSingle()
  if (!expAccess) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Use service client for writes to bypass any column-level RLS restrictions
  const svc = await createServiceClient()

  // Obtener el análisis guardado en el documento
  const { data: doc } = await svc
    .from('documentos_expediente')
    .select('analisis_ia, expediente_id')
    .eq('id', documento_id)
    .single()
  const expActual = expAccess

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  if (!doc.analisis_ia) return NextResponse.json({ error: 'Este documento aún no tiene análisis IA' }, { status: 400 })

  const ai = doc.analisis_ia as Record<string, any>
  const update: Record<string, any> = {}
  let conflicto_cliente_final: { actual: string; nuevo: string } | null = null

  // Normalizar tipo del cliente al tipo canónico IA
  const TIPO_MAP: Record<string, string> = {
    oficio_resolutivo: 'resolutivo',
    diagrama:          'plano',
    memoria_calculo:   'memoria_tecnica',
    dictamen_uvie:     'dictamen',
  }
  const tipoNorm = TIPO_MAP[tipo] ?? tipo

  // ── Mapeo de campos según tipo de documento ──────────────────
  if (tipoNorm === 'resolutivo') {
    if (ai.folio        != null) update.resolutivo_folio        = ai.folio
    if (ai.fecha        != null) update.resolutivo_fecha        = ai.fecha
    if (ai.tiene_cobro  != null) update.resolutivo_tiene_cobro  = ai.tiene_cobro
    if (ai.monto        != null) update.resolutivo_monto        = ai.monto
    if (ai.referencia   != null) update.resolutivo_referencia   = ai.referencia
    if (ai.kwp          != null) update.kwp                     = ai.kwp
    if (ai.nombre_cliente_final != null) {
      const actual = expActual?.nombre_cliente_final
      if (actual && actual.trim().toLowerCase() !== String(ai.nombre_cliente_final).trim().toLowerCase()) {
        conflicto_cliente_final = { actual, nuevo: ai.nombre_cliente_final }
      }
      update.nombre_cliente_final = ai.nombre_cliente_final
    }

  } else if (tipoNorm === 'dictamen') {
    if (ai.folio_dvnp        != null) update.dictamen_folio_dvnp  = ai.folio_dvnp
    if (ai.nombre_uvie       != null) update.dictamen_uvie_nombre = ai.nombre_uvie
    if (ai.nombre_cliente_final != null) {
      const actual = expActual?.nombre_cliente_final
      if (actual && actual.trim().toLowerCase() !== String(ai.nombre_cliente_final).trim().toLowerCase()) {
        conflicto_cliente_final = { actual, nuevo: ai.nombre_cliente_final }
      }
      update.nombre_cliente_final = ai.nombre_cliente_final
    }
    // Address of the installation from the dictamen
    if (ai.direccion_proyecto != null) update.direccion_proyecto = ai.direccion_proyecto
    if (ai.colonia            != null) update.colonia            = ai.colonia
    if (ai.municipio          != null) update.municipio          = ai.municipio
    if (ai.ciudad             != null) update.ciudad             = ai.ciudad
    if (ai.codigo_postal      != null) update.codigo_postal      = ai.codigo_postal
    if (ai.estado_mx          != null) update.estado_mx          = ai.estado_mx

  } else if (tipoNorm === 'plano' || tipoNorm === 'memoria_tecnica') {
    if (ai.kwp              != null) update.kwp              = ai.kwp
    if (ai.num_paneles      != null) update.num_paneles      = ai.num_paneles
    if (ai.potencia_panel_wp != null) update.potencia_panel_wp = ai.potencia_panel_wp
    if (ai.num_inversores   != null) update.num_inversores   = ai.num_inversores
    if (ai.tipo_conexion    != null) update.tipo_conexion    = ai.tipo_conexion
    if (ai.tipo_central     != null) update.tipo_central     = ai.tipo_central
    if (ai.numero_medidor   != null) update.numero_medidor   = ai.numero_medidor

    // Subestación
    if (ai.capacidad_subestacion_kva != null) update.capacidad_subestacion_kva = ai.capacidad_subestacion_kva
    // Protecciones (solo si el AI detectó el elemento; no sobreescribir con false si ya estaba en true)
    if (ai.tiene_i1_i2               === true) update.tiene_i1_i2               = true
    if (ai.tiene_interruptor_exclusivo === true) update.tiene_interruptor_exclusivo = true
    if (ai.tiene_ccfp                === true) update.tiene_ccfp                = true
    if (ai.tiene_proteccion_respaldo === true) update.tiene_proteccion_respaldo = true

    // Try to match inversor from catalog using the extracted marca_inversor text
    if (ai.marca_inversor) {
      const marcaStr = String(ai.marca_inversor).toLowerCase().trim()
      const { data: inversores } = await supabase
        .from('inversores')
        .select('id, marca, modelo')
        .eq('activo', true)

      if (inversores?.length) {
        // Prefer match where both marca and modelo appear in the AI string
        let match = inversores.find(inv =>
          marcaStr.includes(inv.marca.toLowerCase()) &&
          marcaStr.includes(inv.modelo.toLowerCase())
        )
        // Fallback: marca only
        if (!match) {
          match = inversores.find(inv => marcaStr.includes(inv.marca.toLowerCase()))
        }
        if (match) update.inversor_id = match.id
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No se encontraron campos para aplicar' }, { status: 400 })
  }

  const { error } = await svc
    .from('expedientes')
    .update(update)
    .eq('id', expediente_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    campos_aplicados: Object.keys(update),
    ...(conflicto_cliente_final ? { conflicto_cliente_final } : {}),
  })
}
