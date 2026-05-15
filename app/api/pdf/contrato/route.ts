import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarContratoDocx } from '@/lib/docx/ContratoDocx'
import type { ContratoData } from '@/lib/docx/ContratoDocx'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

import { TZ_MX, tzForEstadoMx, parseDBDate } from '@/lib/utils'

function fmtFecha(iso: string, tz: string = TZ_MX): string {
  // parseDBDate ancla las fechas DATE-only (YYYY-MM-DD) a mediodía local
  // para que la conversión a tz no las desplace al día anterior.
  return parseDBDate(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('expediente_id')
  if (!id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

  // ── Expediente con joins ───────────────────────────────────────────────────
  const { data: exp, error: expError } = await supabase
    .from('expedientes')
    .select(`
      *,
      cliente:clientes(*),
      folio:folios_lista_control(numero_folio)
    `)
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Inspección programada / realizada más próxima ─────────────────────────
  const { data: inspeccion } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora, direccion')
    .eq('expediente_id', id)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle()

  // ── Precio desde solicitud de folio ──────────────────────────────────────
  const { data: solicitud } = await supabase
    .from('solicitudes_folio')
    .select('precio_propuesto')
    .eq('folio_asignado_id', (exp as any).folio_id)
    .maybeSingle()

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const cliente = exp.cliente as any
  const folio: string = (exp.folio as any)?.numero_folio ?? exp.numero_folio ?? id

  const precio: number = (solicitud as any)?.precio_propuesto ?? 0

  // Firmante
  const firmanteMismo   = cliente?.firmante_mismo !== false
  const firmanteNombre  = !firmanteMismo ? (cliente?.firmante_nombre ?? undefined) : undefined

  // Domicilio del cliente (para declaraciones)
  const domParts = [
    cliente?.direccion,
    cliente?.colonia ? `Col. ${cliente.colonia}` : null,
    cliente?.ciudad,
    cliente?.estado,
    cliente?.cp ? `C.P. ${cliente.cp}` : null,
  ].filter(Boolean)
  const clienteDomicilio = domParts.length ? domParts.join(', ') : undefined

  // TZ del estado donde se realiza la inspección (no asumir CDMX)
  const tzExp = tzForEstadoMx(exp.estado_mx)

  const fechaVisita = inspeccion?.fecha_hora
    ? fmtFecha(inspeccion.fecha_hora, tzExp)
    : undefined

  const resolutFecha = exp.resolutivo_fecha
    ? fmtFecha(exp.resolutivo_fecha, tzExp)
    : undefined

  const datos: ContratoData = {
    logoSrc: getLogoPath(),
    folio,
    // Fecha del contrato: si hay inspección agendada, usa esa fecha
    // (el contrato se firma en/antes de la visita). Si aún no hay agenda,
    // fallback a hoy. Antes mostraba new Date() siempre, lo que producía
    // contratos fechados DESPUÉS de la visita ya realizada.
    fecha: fmtFecha(inspeccion?.fecha_hora ?? new Date().toISOString(), tzExp),
    fecha_visita: fechaVisita,

    // Solicitante / cliente final
    cliente_nombre:       (exp as any).nombre_cliente_final ?? cliente?.nombre ?? '—',
    cliente_rfc:          cliente?.rfc ?? undefined,
    cliente_representante: cliente?.representante ?? undefined,
    figura_juridica:      cliente?.figura_juridica ?? undefined,
    cliente_domicilio:    clienteDomicilio,
    correo_solicitante:   cliente?.firmante_correo ?? cliente?.atiende_correo ?? undefined,
    telefono_solicitante: cliente?.firmante_telefono ?? cliente?.atiende_telefono ?? undefined,
    firmante_nombre:      firmanteNombre,
    firmante_numero_ine:  !firmanteMismo ? (cliente?.firmante_numero_ine ?? undefined) : undefined,

    // Instalación
    direccion:     exp.direccion_proyecto ?? inspeccion?.direccion ?? '—',
    colonia:       exp.colonia ?? undefined,
    codigo_postal: exp.codigo_postal ?? undefined,
    municipio:     exp.municipio ?? undefined,
    ciudad:        exp.ciudad ?? '—',
    estado:        exp.estado_mx ?? '—',
    kwp:           exp.kwp ?? 0,

    // Resolutivo
    resolutivo_folio: exp.resolutivo_folio ?? '—',
    resolutivo_fecha: resolutFecha,

    // Precio
    precio_sin_iva: precio,
  }

  const buffer = await generarContratoDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Contrato-${folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
