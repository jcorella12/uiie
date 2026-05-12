/**
 * Carga del Informe de Inspección
 *
 * Une los datos del expediente, cliente, inspector, inversores, testigos,
 * documentos e inspección agendada en una estructura `InformeData` que el
 * generador de Word (lib/docx/InformeInspeccionDocx) consume.
 *
 * Se usa desde dos lugares:
 *  - /api/expedientes/[id]/informe-inspeccion  (preview suelto)
 *  - /api/expedientes/[id]/zip                  (paquete completo)
 *
 * El cliente debe pasar un `serviceClient` (bypassea RLS) — el llamador es
 * responsable de validar permisos antes.
 */

import path from 'path'
import fs from 'fs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InformeData } from '@/lib/docx/InformeInspeccionDocx'
import { TZ_MX, tzForEstadoMx } from '@/lib/utils'

// ─── Helpers de fecha ───────────────────────────────────────────────────────

function fmtFecha(iso: string | null | undefined, tz: string = TZ_MX): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
  })
}

function fmtHora(iso: string | null | undefined, tz: string = TZ_MX): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  })
}

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

// ─── Loader ─────────────────────────────────────────────────────────────────

export async function construirInformeData(
  db: SupabaseClient,
  expedienteId: string,
): Promise<InformeData | null> {
  // Expediente con cliente, inversor catálogo, inspector, folio
  const { data: exp, error } = await db
    .from('expedientes')
    .select(`
      id, numero_folio, status, kwp, num_paneles, potencia_panel_wp,
      ciudad, estado_mx, direccion_proyecto, colonia, codigo_postal, municipio,
      nombre_cliente_final, fecha_inicio, fecha_cierre,
      inspector_id, inspector_ejecutor_id,
      tipo_conexion, tipo_central, numero_medidor,
      cli_marca_paneles, cli_modelo_paneles,
      capacidad_subestacion_kva,
      resolutivo_folio, resolutivo_fecha,
      dictamen_folio_dvnp, dictamen_uvie_nombre,
      resultado_inspeccion, notas_acta,
      cliente:clientes(*),
      folio:folios_lista_control(numero_folio),
      inspector:usuarios!inspector_id(nombre, apellidos, email,
        perfil:inspectores!usuario_id(numero_cedula)
      ),
      inversores_lista:expediente_inversores(
        id, orden, marca, modelo, cantidad, potencia_kw,
        certificacion, justificacion_ieee1547
      )
    `)
    .eq('id', expedienteId)
    .maybeSingle()

  if (error || !exp) return null

  const cliente = exp.cliente as any

  // Inspector responsable (primer usuario con ese rol)
  const { data: respUser } = await db
    .from('usuarios')
    .select('nombre, apellidos')
    .eq('rol', 'inspector_responsable')
    .limit(1)
    .maybeSingle()

  // Documentos del expediente
  const { data: documentos } = await db
    .from('documentos_expediente')
    .select('id, nombre, tipo, subido_por_cliente, created_at')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: true })

  // Inspección más relevante (realizada > en_curso > programada)
  const { data: inspeccionesRaw } = await db
    .from('inspecciones_agenda')
    .select('fecha_hora, duracion_min, status, inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)')
    .eq('expediente_id', expedienteId)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: false })
    .limit(5)

  const STATUS_PRIO: Record<string, number> = { realizada: 0, en_curso: 1, programada: 2 }
  const inspeccion = (inspeccionesRaw ?? []).slice()
    .sort((a: any, b: any) => (STATUS_PRIO[a.status] ?? 9) - (STATUS_PRIO[b.status] ?? 9))[0] ?? null

  // Testigos del expediente
  const { data: expTestigos } = await db
    .from('expediente_testigos')
    .select('orden, testigo:testigos(nombre, apellidos, numero_ine)')
    .eq('expediente_id', expedienteId)
    .order('orden')

  const testigos = (expTestigos ?? []).map((et: any) => et.testigo).filter(Boolean) as Array<{
    nombre: string; apellidos?: string; numero_ine?: string;
  }>

  // Certificado CRE
  const { data: certs } = await db
    .from('certificados_cre')
    .select('numero_certificado, fecha_emision')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: false })
    .limit(1)
  const certificado = certs?.[0] ?? null

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const tz = tzForEstadoMx(exp.estado_mx)
  const folio = (exp.folio as any)?.numero_folio
    ?? (exp.numero_folio as string | null)
    ?? exp.id

  const inspUser = exp.inspector as any
  const ejecutorUser = (inspeccion as any)?.inspector_ejecutor as
    | { nombre: string; apellidos?: string }
    | null
  const inspectorNombre = ejecutorUser
    ? `${ejecutorUser.nombre} ${ejecutorUser.apellidos ?? ''}`.trim()
    : inspUser
      ? `${inspUser.nombre} ${inspUser.apellidos ?? ''}`.trim()
      : 'Inspector UIIE'
  const inspectorCedula = inspUser?.perfil?.numero_cedula ?? undefined
  const inspectorResponsable = respUser
    ? `${respUser.nombre} ${respUser.apellidos ?? ''}`.trim()
    : undefined

  const fechaInsp = inspeccion ? fmtFecha(inspeccion.fecha_hora, tz) : fmtFecha(new Date().toISOString(), tz)
  const horaInicio = inspeccion ? fmtHora(inspeccion.fecha_hora, tz) : '—'
  const durMin = inspeccion?.duracion_min ?? 120
  const horaFin = inspeccion
    ? fmtHora(new Date(new Date(inspeccion.fecha_hora).getTime() + durMin * 60_000).toISOString(), tz)
    : '—'

  const inversoresLista = ((exp as any).inversores_lista as any[] ?? [])
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((r) => ({
      marca: r.marca ?? '—',
      modelo: r.modelo ?? '—',
      cantidad: r.cantidad ?? 1,
      potencia_kw: r.potencia_kw ?? null,
      certificacion: (r.certificacion ?? 'ul1741') as 'ul1741' | 'ieee1547' | 'homologado_cne' | 'ninguna',
      justificacion_ieee1547: r.justificacion_ieee1547 ?? null,
    }))

  const datos: InformeData = {
    logoSrc: getLogoPath(),

    folio,
    fecha_emision: fmtFecha(new Date().toISOString(), tz),

    // Cliente
    cliente_nombre:        (exp.nombre_cliente_final as string | null) ?? cliente?.nombre ?? '—',
    cliente_rfc:           cliente?.rfc ?? undefined,
    cliente_representante: cliente?.representante ?? undefined,

    // Ubicación
    direccion:     (exp.direccion_proyecto as string | null) ?? '—',
    colonia:       (exp.colonia as string | null) ?? undefined,
    codigo_postal: (exp.codigo_postal as string | null) ?? undefined,
    municipio:     (exp.municipio as string | null) ?? undefined,
    ciudad:        (exp.ciudad as string | null) ?? '—',
    estado:        (exp.estado_mx as string | null) ?? '—',

    // Sistema
    kwp:               Number(exp.kwp ?? 0),
    num_paneles:       (exp.num_paneles as number | null) ?? undefined,
    potencia_panel_wp: (exp.potencia_panel_wp as number | null) ?? undefined,
    marca_paneles:     (exp.cli_marca_paneles as string | null) ?? undefined,
    modelo_paneles:    (exp.cli_modelo_paneles as string | null) ?? undefined,
    numero_medidor:    (exp.numero_medidor as string | null) ?? undefined,
    tipo_central:      (exp.tipo_central as string | null) ?? 'MT',
    tipo_conexion:     (exp.tipo_conexion as string | null) ?? undefined,
    capacidad_subestacion_kva: (exp.capacidad_subestacion_kva as number | null) ?? null,
    inversores:        inversoresLista,

    // Visita
    fecha_inspeccion: fechaInsp,
    hora_inicio:      horaInicio,
    hora_fin:         horaFin,

    // Personal
    inspector_nombre:             inspectorNombre,
    inspector_cedula:             inspectorCedula,
    inspector_responsable_nombre: inspectorResponsable,
    atiende_nombre:    cliente?.atiende_nombre ?? cliente?.representante ?? cliente?.nombre ?? '—',
    atiende_correo:    cliente?.atiende_correo ?? cliente?.firmante_correo ?? cliente?.email ?? undefined,
    atiende_telefono:  cliente?.atiende_telefono ?? cliente?.firmante_telefono ?? cliente?.telefono ?? undefined,
    testigos:          testigos.slice(0, 4).map((t) => ({
      nombre: t.nombre, apellidos: t.apellidos, numero_ine: t.numero_ine,
    })),

    // Documentos
    documentos_inspeccionados: (documentos ?? []).map((d: any) => ({
      nombre: d.nombre, tipo: d.tipo, subido_por_cliente: !!d.subido_por_cliente, created_at: d.created_at,
    })),

    // Resolutivo / dictamen
    resolutivo_folio:    (exp.resolutivo_folio as string | null) ?? undefined,
    resolutivo_fecha:    exp.resolutivo_fecha ? fmtFecha(exp.resolutivo_fecha as string, tz) : undefined,
    dictamen_folio_dvnp: (exp.dictamen_folio_dvnp as string | null) ?? undefined,
    dictamen_uvie_nombre:(exp.dictamen_uvie_nombre as string | null) ?? undefined,

    // Resultado
    resultado:        (exp.resultado_inspeccion as 'aprobado' | 'rechazado' | 'condicionado' | null) ?? 'aprobado',
    observaciones:    (exp.notas_acta as string | null) ?? undefined,
    num_certificado:  certificado?.numero_certificado ?? undefined,
    fecha_certificado: certificado?.fecha_emision ? fmtFecha(certificado.fecha_emision, tz) : undefined,
  }

  return datos
}
