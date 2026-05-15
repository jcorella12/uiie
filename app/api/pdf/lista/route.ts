import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarListaDocx } from '@/lib/docx/ListaInspeccionDocx'
import type { ListaData } from '@/lib/docx/ListaInspeccionDocx'
import path from 'path'
import fs from 'fs'

function getLogoPath(): string | undefined {
  const p = path.join(process.cwd(), 'public', 'logo-ciae.png')
  return fs.existsSync(p) ? p : undefined
}

async function loadHomologacionRedaccion(
  db: any, marca: string | null | undefined
): Promise<string | undefined> {
  if (!marca) return undefined
  const { data } = await db
    .from('inversor_homologaciones')
    .select('redaccion_lista')
    .ilike('marca', marca)
    .eq('vigente', true)
    .maybeSingle()
  return data?.redaccion_lista ?? undefined
}

import { TZ_MX, tzForEstadoMx, parseDBDate } from '@/lib/utils'

function fmtFecha(iso: string, tz: string = TZ_MX): string {
  return parseDBDate(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    timeZone: tz,
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
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, certificacion),
      inversores_lista:expediente_inversores(
        id, orden, marca, modelo, cantidad, potencia_kw,
        certificacion, justificacion_ieee1547
      ),
      inspector:usuarios!inspector_id(nombre, apellidos)
    `)
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Inspección: preferir 'realizada', luego 'en_curso', luego 'programada' ──
  const { data: inspeccionesRaw } = await supabase
    .from('inspecciones_agenda')
    .select('fecha_hora, direccion, status, inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)')
    .eq('expediente_id', id)
    .in('status', ['programada', 'en_curso', 'realizada'])
    .order('fecha_hora', { ascending: false })
    .limit(5)

  const STATUS_PRIO: Record<string, number> = { realizada: 0, en_curso: 1, programada: 2 }
  const inspeccion = (inspeccionesRaw ?? [])
    .slice()
    .sort((a: any, b: any) => (STATUS_PRIO[a.status] ?? 9) - (STATUS_PRIO[b.status] ?? 9))[0] ?? null

  // ── Mapeos ────────────────────────────────────────────────────────────────
  const cliente    = exp.cliente as any
  const inv        = exp.inversor as any
  const inspUser   = exp.inspector as any   // ahora es usuarios directamente
  const folio: string = (exp.folio as any)?.numero_folio ?? exp.numero_folio ?? id

  // TZ del estado del expediente (Sonora UTC-7, BC UTC-8, etc.)
  const tzExpediente = tzForEstadoMx(exp.estado_mx)
  const fechaBase = inspeccion?.fecha_hora ?? new Date().toISOString()
  const horaStr = new Date(fechaBase).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzExpediente })
  const fecha = `${fmtFecha(fechaBase, tzExpediente)}, ${horaStr} hrs`

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

    // Inspector — usar ejecutor si fue delegada la visita
    inspector_nombre: (() => {
      const ejecutor = (inspeccion as any)?.inspector_ejecutor as { nombre: string; apellidos?: string } | null
      if (ejecutor) return `${ejecutor.nombre} ${ejecutor.apellidos ?? ''}`.trim()
      return inspUser ? `${inspUser.nombre} ${inspUser.apellidos ?? ''}`.trim() : 'Inspector UIIE'
    })(),

    // Checks
    tipo_central:   exp.tipo_central ?? 'MT',
    tiene_ccfp:     exp.tiene_ccfp ?? false,
    numero_medidor: exp.numero_medidor ?? '—',
    tiene_i1_i2:    exp.tiene_i1_i2 ?? false,
    dictamen_folio_dvnp: exp.dictamen_folio_dvnp ?? '—',

    // ── Inversores (multi) ───────────────────────────────────────────────────
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
            ? (await loadHomologacionRedaccion(supabase, r.marca)) ?? null
            : null,
        })
      }
      return out
    })(),
    // Legacy
    num_inversores:         exp.num_inversores ?? 1,
    marca_inversor:         inv?.marca ?? '—',
    modelo_inversor:        inv?.modelo ?? '—',
    certificacion_inversor: inv?.certificacion ?? 'ul1741',
    homologacion_redaccion: await loadHomologacionRedaccion(supabase, inv?.marca),

    // Subestación
    capacidad_subestacion_kva: exp.capacidad_subestacion_kva ?? undefined,

    // Resultado
    resultado: exp.resultado_inspeccion ?? 'aprobado',
  }

  const buffer = await generarListaDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Lista-DACG-${folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
