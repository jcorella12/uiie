import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarCotizacionDocx } from '@/lib/docx/CotizacionDocx'
import { TZ_MX, isoMinusDays } from '@/lib/utils'
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
      `*, cliente:clientes(*), folio:folios_lista_control(numero_folio), inversor:inversores!expedientes_inversor_id_fkey(marca,modelo), inspector:usuarios!inspector_id(nombre,apellidos)`,
    )
    .eq('id', expedienteId)
    .single()

  if (!exp) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: solicitud } = await supabase
    .from('solicitudes_folio')
    .select('precio_propuesto')
    .eq('folio_asignado_id', (exp as any).folio_id)
    .maybeSingle()

  // Visita programada — la cotización se fecha 2 días antes de la visita.
  const { data: inspeccion } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora')
    .eq('expediente_id', expedienteId)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle()

  const fechaCotizacionISO = inspeccion?.fecha_hora
    ? isoMinusDays(inspeccion.fecha_hora, 2)
    : new Date().toISOString()

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
    fecha: new Date(fechaCotizacionISO).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: TZ_MX,
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

  const buffer = await generarCotizacionDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Cotizacion-${folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
