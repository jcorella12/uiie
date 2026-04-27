import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ContratoDoc } from '@/lib/pdf/ContratoDoc'
import type { ContratoData } from '@/lib/pdf/ContratoDoc'
import { createElement } from 'react'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

  const fechaVisita = inspeccion?.fecha_hora
    ? fmtFecha(inspeccion.fecha_hora)
    : undefined

  const resolutFecha = exp.resolutivo_fecha
    ? fmtFecha(exp.resolutivo_fecha)
    : undefined

  const datos: ContratoData = {
    logoSrc: getLogoPath(),
    folio,
    fecha: fmtFecha(new Date().toISOString()),
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

  const buffer = await renderToBuffer(createElement(ContratoDoc, { datos }) as any)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Contrato-${folio}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
