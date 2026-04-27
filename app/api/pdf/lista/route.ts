import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ListaInspeccionDoc } from '@/lib/pdf/ListaInspeccionDoc'
import type { ListaData } from '@/lib/pdf/ListaInspeccionDoc'
import { createElement } from 'react'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('expediente_id')
  if (!id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

  // ── Expediente con joins ───────────────────────────────────────────────────
  const { data: exp, error: expError } = await supabase
    .from('expedientes')
    .select(`
      *,
      cliente:clientes(nombre, representante, atiende_nombre),
      folio:folios_lista_control(numero_folio),
      inversor:inversores(marca, modelo, certificacion),
      inspector:usuarios!inspector_id(nombre, apellidos)
    `)
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Inspección realizada más reciente ─────────────────────────────────────
  const { data: inspeccion } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora, direccion')
    .eq('expediente_id', id)
    .eq('status', 'realizada')
    .order('fecha_hora', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const cliente    = exp.cliente as any
  const inv        = exp.inversor as any
  const inspUser   = exp.inspector as any   // ahora es usuarios directamente
  const folio: string = (exp.folio as any)?.numero_folio ?? exp.numero_folio ?? id

  const fecha = inspeccion
    ? fmtFecha(inspeccion.fecha_hora)
    : fmtFecha(new Date().toISOString())

  const datos: ListaData = {
    logoSrc: getLogoPath(),
    folio,
    fecha,

    // Cliente final
    cliente_nombre: (exp as any).nombre_cliente_final ?? cliente?.nombre ?? '—',
    atiende_nombre: cliente?.atiende_nombre ?? cliente?.representante ?? cliente?.nombre ?? '—',

    // Dirección
    direccion:     exp.direccion_proyecto ?? inspeccion?.direccion ?? '—',
    colonia:       exp.colonia ?? undefined,
    codigo_postal: exp.codigo_postal ?? undefined,
    municipio:     exp.municipio ?? undefined,
    ciudad:        exp.ciudad ?? '—',
    estado:        exp.estado_mx ?? '—',

    // Inspector
    inspector_nombre: inspUser
      ? `${inspUser.nombre} ${inspUser.apellidos ?? ''}`.trim()
      : 'Inspector UIIE',

    // Checks
    tipo_central:   exp.tipo_central ?? 'MT',
    tiene_ccfp:     exp.tiene_ccfp ?? false,
    numero_medidor: exp.numero_medidor ?? '—',
    tiene_i1_i2:    exp.tiene_i1_i2 ?? false,
    dictamen_folio_dvnp: exp.dictamen_folio_dvnp ?? '—',

    // Inversores
    num_inversores:         exp.num_inversores ?? 1,
    marca_inversor:         inv?.marca ?? '—',
    modelo_inversor:        inv?.modelo ?? '—',
    certificacion_inversor: inv?.certificacion ?? 'ul1741',

    // Subestación
    capacidad_subestacion_kva: exp.capacidad_subestacion_kva ?? undefined,

    // Resultado
    resultado: exp.resultado_inspeccion ?? 'aprobado',
  }

  const buffer = await renderToBuffer(createElement(ListaInspeccionDoc, { datos }) as any)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Lista-DACG-${folio}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
