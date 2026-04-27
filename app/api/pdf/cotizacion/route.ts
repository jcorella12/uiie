import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { CotizacionExternaDoc } from '@/lib/pdf/CotizacionExternaDoc'
import { createElement } from 'react'
import path from 'path'
import fs from 'fs'

// Logo path (resuelto en tiempo de ejecución en el servidor)
function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const expedienteId = searchParams.get('expediente_id')
  if (!expedienteId)
    return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

  const { data: exp } = await supabase
    .from('expedientes')
    .select(
      `*, cliente:clientes(*), folio:folios_lista_control(numero_folio), inversor:inversores(marca,modelo), inspector:usuarios!inspector_id(nombre,apellidos)`,
    )
    .eq('id', expedienteId)
    .single()

  if (!exp) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: solicitud } = await supabase
    .from('solicitudes_folio')
    .select('precio_propuesto')
    .eq('folio_asignado_id', (exp as any).folio_id)
    .maybeSingle()

  const precio: number = (solicitud as any)?.precio_propuesto ?? 0
  const insp = (exp as any).inspector as { nombre: string; apellidos?: string } | null
  const cliente = (exp as any).cliente as {
    nombre?: string
    rfc?: string
    representante?: string
  } | null
  const folio: string =
    (exp as any).folio?.numero_folio ?? (exp as any).numero_folio ?? 'SIN-FOLIO'

  const datos = {
    folio,
    fecha: new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    cliente_nombre: (exp as any).nombre_cliente_final ?? cliente?.nombre ?? 'Cliente',
    cliente_rfc: cliente?.rfc,
    cliente_representante: cliente?.representante,
    ciudad_instalacion: (exp as any).ciudad ?? '',
    estado_instalacion: (exp as any).estado_mx ?? '',
    kwp: (exp as any).kwp ?? 0,
    tipo_conexion: (exp as any).tipo_conexion ?? 'generacion_distribuida',
    precio_sin_iva: precio,
    precio_con_iva: Math.round(precio * 1.16 * 100) / 100,
    inspector_nombre: insp
      ? `${insp.nombre} ${insp.apellidos ?? ''}`.trim()
      : 'Joaquín Corella Puente',
    vigencia_dias: 30,
    logoSrc: getLogoPath(),
  }

  const buffer = await renderToBuffer(createElement(CotizacionExternaDoc, { datos }) as any)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cotizacion-${folio}.pdf"`,
    },
  })
}
