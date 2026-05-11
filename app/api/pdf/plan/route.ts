import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarPlanDocx } from '@/lib/docx/PlanInspeccionDocx'
import type { PlanData } from '@/lib/docx/PlanInspeccionDocx'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

import { TZ_MX, isoMinusDays, tzForEstadoMx } from '@/lib/utils'

function fmtFecha(iso: string, tz: string = TZ_MX): string {
  return new Date(iso).toLocaleDateString('es-MX', {
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
      cliente:clientes(nombre, representante, atiende_nombre),
      folio:folios_lista_control(numero_folio),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo)
    `)
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Inspección programada más próxima ────────────────────────────────────
  const { data: inspeccion } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora, duracion_min, direccion')
    .eq('expediente_id', id)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle()

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const cliente   = exp.cliente as any
  const inv       = exp.inversor as any
  const folio: string = (exp.folio as any)?.numero_folio ?? exp.numero_folio ?? id
  // TZ del estado del expediente (no asumir CDMX para Sonora/BC/etc.)
  const tzExp = tzForEstadoMx(exp.estado_mx)

  // Fecha de emisión del plan: si hay visita agendada, dos días antes
  // (el plan se entrega antes de la visita). Si no, hoy como fallback.
  const fechaEmision = fmtFecha(
    inspeccion?.fecha_hora
      ? isoMinusDays(inspeccion.fecha_hora, 2)
      : new Date().toISOString(),
    tzExp,
  )
  const fechaVisita = inspeccion?.fecha_hora
    ? fmtFecha(inspeccion.fecha_hora, tzExp)
    : 'Fecha por confirmar'

  const resolutFecha = exp.resolutivo_fecha
    ? fmtFecha(exp.resolutivo_fecha, tzExp)
    : undefined

  const datos: PlanData = {
    logoSrc: getLogoPath(),
    folio,
    fecha_emision: fechaEmision,
    fecha_visita: fechaVisita,

    // Cliente final
    cliente_nombre:  (exp as any).nombre_cliente_final ?? cliente?.nombre ?? '—',
    atiende_nombre:  cliente?.atiende_nombre ?? cliente?.representante ?? cliente?.nombre ?? undefined,

    // Dirección
    direccion:     exp.direccion_proyecto ?? inspeccion?.direccion ?? '—',
    colonia:       exp.colonia ?? undefined,
    codigo_postal: exp.codigo_postal ?? undefined,
    municipio:     exp.municipio ?? undefined,
    ciudad:        exp.ciudad ?? '—',
    estado:        exp.estado_mx ?? '—',

    // Instalación
    kwp: exp.kwp ?? 0,
    resolutivo_folio: exp.resolutivo_folio ?? '—',
    resolutivo_fecha: resolutFecha,
    tipo_central: exp.tipo_central ?? 'MT',

    // Inversores
    num_inversores: exp.num_inversores ?? undefined,
    marca_inversor: inv?.marca ?? undefined,
    modelo_inversor: inv?.modelo ?? undefined,
  }

  const buffer = await generarPlanDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Plan-Inspeccion-${folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
