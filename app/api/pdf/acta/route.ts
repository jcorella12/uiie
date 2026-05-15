import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generarActaDocx } from '@/lib/docx/ActaDocx'
import type { ActaData } from '@/lib/docx/ActaDocx'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

import { TZ_MX, tzForEstadoMx, parseDBDate } from '@/lib/utils'

function fmtFecha(iso: string): string {
  return parseDBDate(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    timeZone: TZ_MX,
  })
}

/**
 * Si la marca del inversor tiene homologación CNE vigente, devuelve la
 * redacción precargada en `inversor_homologaciones` (acta o lista).
 * Útil para inyectar el texto largo del oficio CNE en los documentos
 * generados sin que el inspector tenga que copiar/pegar.
 */
async function loadHomologacionRedaccion(
  db: any, marca: string | null | undefined, doc: 'acta' | 'lista'
): Promise<string | undefined> {
  if (!marca) return undefined
  const col = doc === 'acta' ? 'redaccion_acta' : 'redaccion_lista'
  const { data } = await db
    .from('inversor_homologaciones')
    .select(col)
    .ilike('marca', marca)
    .eq('vigente', true)
    .maybeSingle()
  return data?.[col] ?? undefined
}

/**
 * Construye una dirección completa para el acta:
 *   "Calle Tal #123, COL Centro, CP 80000, Culiacán, Sinaloa"
 *
 * Si los campos estructurados (colonia/cp/ciudad/estado) están vacíos,
 * cae al campo libre `domicilio` o `ocr_domicilio` que viene de la INE.
 */
function construirDireccionCompleta(t: any): string | undefined {
  if (!t) return undefined
  const partes: string[] = []
  // Calle/número
  const calle = t.direccion ?? t.domicilio
  if (calle) partes.push(String(calle).trim())
  if (t.colonia) partes.push(`COL ${String(t.colonia).trim()}`)
  if (t.cp)      partes.push(`CP ${String(t.cp).trim()}`)
  if (t.ciudad)  partes.push(String(t.ciudad).trim())
  if (t.estado)  partes.push(String(t.estado).trim())
  if (partes.length > 0) return partes.join(', ')
  // Fallback: el OCR concatena calle + colonia + CP + municipio + estado en una línea
  if (t.ocr_domicilio) return String(t.ocr_domicilio).trim()
  return undefined
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('expediente_id')
  if (!id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

  // ── Expediente con todos los joins ────────────────────────────────────────
  const { data: exp, error: expError } = await supabase
    .from('expedientes')
    .select(`
      *,
      cliente:clientes(*),
      folio:folios_lista_control(numero_folio),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, certificacion, justificacion_ieee1547),
      inversores_lista:expediente_inversores(
        id, orden, marca, modelo, cantidad, potencia_kw,
        certificacion, justificacion_ieee1547
      ),
      inspector:usuarios!inspector_id(
        nombre, apellidos,
        perfil:inspectores!usuario_id(numero_cedula, firma_url, sello_url)
      ),
      testigos:expediente_testigos(
        orden,
        testigo:testigos(
          nombre, apellidos, numero_ine,
          direccion, domicilio, colonia, cp, ciudad, estado,
          ocr_domicilio
        )
      )
    `)
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Inspector responsable (primer usuario con ese rol) ────────────────────
  const db = await createServiceClient()
  const { data: respUsers } = await db
    .from('usuarios')
    .select('nombre, apellidos')
    .eq('rol', 'inspector_responsable')
    .limit(1)
    .maybeSingle()

  // ── Inspección: preferir 'realizada', luego 'en_curso', luego 'programada' ──
  const { data: inspeccionesRaw } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora, duracion_min, direccion, status, inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)')
    .eq('expediente_id', id)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: false })
    .limit(5)

  const STATUS_PRIO: Record<string, number> = { realizada: 0, en_curso: 1, programada: 2 }
  const inspeccion = (inspeccionesRaw ?? [])
    .slice()
    .sort((a: any, b: any) => (STATUS_PRIO[a.status] ?? 9) - (STATUS_PRIO[b.status] ?? 9))[0] ?? null

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const testigos = (exp.testigos as any[]) ?? []
  const t1       = testigos.find((t: any) => t.orden === 1)?.testigo
  const t2       = testigos.find((t: any) => t.orden === 2)?.testigo
  const inv      = exp.inversor as any
  const cliente  = exp.cliente as any
  const inspUser = exp.inspector as any          // ahora es usuarios directamente
  const inspPerfil = inspUser?.perfil as any     // registro inspectores (cedula, firma, etc.)
  const folio: string = (exp.folio as any)?.numero_folio ?? exp.numero_folio ?? id

  // Usar la timezone REAL del estado donde se hizo la inspección. Si no
  // se hace, una visita en Hermosillo (UTC-7) capturada como 14:00 sale
  // en el Acta como 15:00 porque CDMX es UTC-6 (1h de diferencia).
  const tzExpediente = tzForEstadoMx(exp.estado_mx)

  const fechaInsp = inspeccion ? fmtFecha(inspeccion.fecha_hora) : fmtFecha(new Date().toISOString())

  const horaInicio = inspeccion
    ? new Date(inspeccion.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzExpediente })
    : '10:00'

  const durMin = inspeccion?.duracion_min ?? 120
  const horaFin = inspeccion
    ? new Date(new Date(inspeccion.fecha_hora).getTime() + durMin * 60_000)
        .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzExpediente })
    : '12:00'

  // Si la inspección tiene un inspector ejecutor diferente, usar ese nombre en el acta
  const ejecutorUser = (inspeccion as any)?.inspector_ejecutor as { nombre: string; apellidos?: string } | null
  const inspectorNombre = ejecutorUser
    ? `${ejecutorUser.nombre} ${ejecutorUser.apellidos ?? ''}`.trim()
    : inspUser
    ? `${inspUser.nombre} ${inspUser.apellidos ?? ''}`.trim()
    : 'Inspector UIIE'

  const respNombre = respUsers
    ? `${respUsers.nombre} ${respUsers.apellidos ?? ''}`.trim()
    : inspectorNombre

  const datos: ActaData = {
    logoSrc: getLogoPath(),
    folio,
    fecha_inspeccion: fechaInsp,
    hora_inicio: horaInicio,
    hora_fin: horaFin,

    // Inspectores
    inspector_nombre: inspectorNombre,
    inspector_cedula: inspPerfil?.numero_cedula ?? undefined,
    inspector_responsable_nombre: respNombre,

    // Quien atiende
    atiende_nombre: cliente?.atiende_nombre ?? cliente?.representante ?? cliente?.nombre ?? '—',
    atiende_identificacion: 'Instituto Nacional Electoral (INE)',
    atiende_numero_id: cliente?.atiende_numero_ine ?? '—',

    // Testigos — numero_ine y dirección completa (calle/núm + colonia + CP + ciudad + estado).
    // Se construye con todos los campos disponibles; si solo hay calle, usa
    // direccion/domicilio/ocr_domicilio como fallback.
    testigo1_nombre:      t1 ? `${t1.nombre} ${t1.apellidos ?? ''}`.trim() : '—',
    testigo1_numero_ine:  t1?.numero_ine ?? '—',
    testigo1_identificacion: 'Instituto Nacional Electoral (INE)',
    testigo1_direccion:   construirDireccionCompleta(t1),
    testigo2_nombre:      t2 ? `${t2.nombre} ${t2.apellidos ?? ''}`.trim() : '—',
    testigo2_numero_ine:  t2?.numero_ine ?? '—',
    testigo2_identificacion: 'Instituto Nacional Electoral (INE)',
    testigo2_direccion:   construirDireccionCompleta(t2),

    // Cliente final (persona/empresa a quien se emite el certificado)
    cliente_nombre:       (exp as any).nombre_cliente_final ?? cliente?.nombre ?? '—',
    cliente_rfc:          cliente?.rfc ?? undefined,
    cliente_representante: cliente?.representante ?? undefined,
    cliente_figura:       cliente?.figura_juridica?.replace('_', ' ') ?? undefined,

    // Instalación
    direccion:     exp.direccion_proyecto ?? inspeccion?.direccion ?? '—',
    colonia:       exp.colonia ?? undefined,
    codigo_postal: exp.codigo_postal ?? undefined,
    municipio:     exp.municipio ?? undefined,
    ciudad:        exp.ciudad ?? '—',
    estado:        exp.estado_mx ?? '—',
    kwp:           exp.kwp ?? 0,
    tipo_conexion: exp.tipo_conexion ?? 'Generación Distribuida',
    tipo_central:  exp.tipo_central ?? 'MT',
    num_paneles:   exp.num_paneles ?? undefined,
    potencia_panel_wp: exp.potencia_panel_wp ?? undefined,

    // Medidor
    numero_medidor:        exp.numero_medidor         ?? '—',
    numero_serie_medidor:  (exp as any).numero_serie_medidor  ?? undefined,
    numero_cfe_medidor:    (exp as any).numero_cfe_medidor    ?? undefined,

    // ── Inversores ───────────────────────────────────────────────────────────
    // Multi-inversor: leemos expediente_inversores y resolvemos la redacción
    // CNE para cada marca distinta. Si no hay filas (expediente viejo), caemos
    // al campo único legacy.
    inversores: await (async () => {
      const lista = ((exp as any).inversores_lista as any[] ?? []).slice()
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      if (lista.length === 0) return undefined
      const out: import('@/lib/docx/inversores-redaccion').InversorRow[] = []
      for (const r of lista) {
        out.push({
          marca: r.marca ?? '—',
          modelo: r.modelo ?? '—',
          cantidad: r.cantidad ?? 1,
          potencia_kw: r.potencia_kw ?? null,
          certificacion: (r.certificacion ?? 'ul1741') as any,
          justificacion_ieee1547: r.justificacion_ieee1547 ?? null,
          redaccion_cne: r.certificacion === 'homologado_cne'
            ? (await loadHomologacionRedaccion(db, r.marca, 'acta')) ?? null
            : null,
        })
      }
      return out
    })(),
    // Legacy (compat): se llenan con la "fila principal" o con el catálogo viejo
    num_inversores:       exp.num_inversores ?? 1,
    marca_inversor:       inv?.marca ?? '—',
    modelo_inversor:      inv?.modelo ?? '—',
    certificacion_inversor: inv?.certificacion ?? 'ul1741',
    justificacion_ieee1547: inv?.justificacion_ieee1547 ?? undefined,
    homologacion_redaccion: await loadHomologacionRedaccion(supabase, inv?.marca, 'acta'),

    // Subestación
    capacidad_subestacion_kva: exp.capacidad_subestacion_kva ?? undefined,

    // Protecciones
    tiene_i1_i2:               exp.tiene_i1_i2 ?? false,
    tiene_interruptor_exclusivo: exp.tiene_interruptor_exclusivo ?? false,
    tiene_ccfp:                exp.tiene_ccfp ?? false,
    tiene_proteccion_respaldo: exp.tiene_proteccion_respaldo ?? false,

    // Resolutivo CFE
    resolutivo_folio:       exp.resolutivo_folio ?? '—',
    resolutivo_fecha:       exp.resolutivo_fecha ? fmtFecha(exp.resolutivo_fecha) : undefined,
    resolutivo_tiene_cobro: exp.resolutivo_tiene_cobro ?? false,
    resolutivo_monto:       exp.resolutivo_monto ?? undefined,
    resolutivo_referencia:  exp.resolutivo_referencia ?? undefined,

    // Dictamen UVIE
    dictamen_folio_dvnp:  exp.dictamen_folio_dvnp ?? '—',
    dictamen_uvie_nombre: exp.dictamen_uvie_nombre ?? undefined,

    // Resultado
    resultado:  exp.resultado_inspeccion ?? 'aprobado',
    notas_acta: exp.notas_acta ?? undefined,
  }

  const buffer = await generarActaDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Acta-${folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
