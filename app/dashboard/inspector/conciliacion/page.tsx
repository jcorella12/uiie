import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ConciliacionInspector from '@/components/conciliacion/ConciliacionInspector'

export default async function ConciliacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = await createServiceClient()

  // ── 1. IDs de expedientes ya conciliados por este inspector ─────────────────
  const { data: yaConc } = await db
    .from('conciliacion_expedientes')
    .select('expediente_id, conciliacion:conciliaciones!inner(inspector_id)')
    .eq('conciliacion.inspector_id', user.id)

  const conciliadosSet = new Set((yaConc ?? []).map((r: any) => r.expediente_id))

  // ── 2. Expedientes TERMINADOS y NO conciliados ───────────────────────────────
  const { data: todosAprobados } = await db
    .from('expedientes')
    .select('id, numero_folio, kwp, ciudad, status, fecha_inicio, folio_id, cliente:clientes(nombre)')
    .eq('inspector_id', user.id)
    .in('status', ['aprobado', 'cerrado'])
    .order('fecha_inicio', { ascending: false })

  const pendientes = (todosAprobados ?? []).filter(e => !conciliadosSet.has(e.id))

  // ── 3. Precios de los pendientes via solicitudes_folio ───────────────────────
  const folioIdsPendientes = pendientes.map(e => e.folio_id).filter(Boolean) as string[]
  let precioMapPendientes = new Map<string, number>()

  if (folioIdsPendientes.length > 0) {
    const { data: sols } = await db
      .from('solicitudes_folio')
      .select('folio_asignado_id, precio_propuesto')
      .in('folio_asignado_id', folioIdsPendientes)

    for (const s of sols ?? []) {
      if (s.folio_asignado_id) {
        precioMapPendientes.set(s.folio_asignado_id, s.precio_propuesto ?? 0)
      }
    }
  }

  const pendientesConPrecio = pendientes.map(e => ({
    ...e,
    precio_propuesto: precioMapPendientes.get(e.folio_id ?? '') ?? null,
  }))

  // ── 4. Historial de conciliaciones con expedientes y precios ─────────────────
  const { data: conciliaciones } = await db
    .from('conciliaciones')
    .select(`
      id, mes, anio, status, total_expedientes, total_kwp, total_monto,
      inspector_acepto_at,
      factura_url, factura_nombre, factura_subida_at,
      comprobante_url, comprobante_nombre, comprobante_subido_at
    `)
    .eq('inspector_id', user.id)
    .order('anio',  { ascending: false })
    .order('mes',   { ascending: false })

  const historial = await Promise.all(
    (conciliaciones ?? []).map(async (conc) => {
      const { data: junc } = await db
        .from('conciliacion_expedientes')
        .select('expediente:expedientes(id, numero_folio, kwp, ciudad, status, fecha_inicio, folio_id, cliente:clientes(nombre))')
        .eq('conciliacion_id', conc.id)

      const exps = (junc ?? []).map((r: any) => r.expediente).filter(Boolean)

      // Precios para este corte
      const folioIds = exps.map((e: any) => e.folio_id).filter(Boolean) as string[]
      let precioMap = new Map<string, number>()

      if (folioIds.length > 0) {
        const { data: sols } = await db
          .from('solicitudes_folio')
          .select('folio_asignado_id, precio_propuesto')
          .in('folio_asignado_id', folioIds)
        for (const s of sols ?? []) {
          if (s.folio_asignado_id) precioMap.set(s.folio_asignado_id, s.precio_propuesto ?? 0)
        }
      }

      const expedientes = exps.map((e: any) => ({
        ...e,
        precio_propuesto: precioMap.get(e.folio_id ?? '') ?? null,
      }))

      return { ...conc, expedientes }
    })
  )

  const now       = new Date()
  const mesActual  = now.getMonth() + 1
  const anioActual = now.getFullYear()

  return (
    <ConciliacionInspector
      pendientes={pendientesConPrecio as any}
      historial={historial as any}
      mesActual={mesActual}
      anioActual={anioActual}
    />
  )
}
