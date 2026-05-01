import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ExpedientesOrdenables, {
  type ExpedienteRow,
  type InspectorOption,
} from '@/components/expedientes/ExpedientesOrdenables'

export default async function MisExpedientes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = usuarioData?.rol ?? 'inspector'
  const esAdmin = ['inspector_responsable', 'admin'].includes(rol)
  const db = esAdmin ? await createServiceClient() : supabase

  // ── Fetch expedientes ──────────────────────────────────────────────────────
  let query = db
    .from('expedientes')
    .select('id, numero_folio, kwp, status, ciudad, fecha_inicio, created_at, orden_inspector, inspector_id, inspector_ejecutor_id, checklist_pct, nombre_cliente_final, cli_completado_at, respaldo_descargado_at, respaldo_archivado_at, respaldo_borrado_at, cliente:clientes(nombre), inspector:usuarios!inspector_id(nombre), inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)')
    .order('orden_inspector', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (!esAdmin) {
    // Mostrar expedientes donde es el inspector principal O el ejecutor delegado
    query = query.or(`inspector_id.eq.${user.id},inspector_ejecutor_id.eq.${user.id}`)
  }

  const { data: expedientes, error: expError } = await query

  if (expError) {
    // Surface the DB error so we can diagnose (e.g. missing column from un-run migration)
    console.error('[expedientes/page] query error:', expError.message, expError.details, expError.hint)
  }

  // ── Fetch inspector list for admin ────────────────────────────────────────
  let inspectores: InspectorOption[] = []
  if (esAdmin) {
    const { data: insp } = await db
      .from('usuarios')
      .select('id, nombre')
      .in('rol', ['inspector', 'auxiliar'])
      .order('nombre')

    // Build inspector list, only include those that have expedientes
    const inspIds = new Set((expedientes ?? []).map(e => e.inspector_id).filter(Boolean))
    inspectores = (insp ?? [])
      .filter(i => inspIds.has(i.id))
      .map(i => ({
        id: i.id,
        nombre: i.nombre,
        expedientes_count: (expedientes ?? []).filter(e => e.inspector_id === i.id).length,
      }))
  }

  const rowCount = expedientes?.length ?? 0

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {esAdmin ? 'Expedientes' : 'Mis Expedientes'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {rowCount} expediente{rowCount !== 1 ? 's' : ''}
            {esAdmin ? ' en total · activos arriba' : ' · arrastra para cambiar el orden de trabajo'}
          </p>
        </div>
      </div>

      {expError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Error al cargar expedientes</p>
          <p className="mt-0.5 font-mono text-xs opacity-80">{expError.message}</p>
          {expError.message.includes('orden_inspector') && (
            <p className="mt-1 text-xs">
              Falta ejecutar la migración <code className="font-mono">20260421430000_expedientes-orden.sql</code> en Supabase.
            </p>
          )}
        </div>
      )}

      <ExpedientesOrdenables
        expedientes={(expedientes ?? []) as unknown as ExpedienteRow[]}
        rol={rol}
        userId={user.id}
        inspectores={esAdmin ? inspectores : undefined}
      />
    </div>
  )
}
