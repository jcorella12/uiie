import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateShort } from '@/lib/utils'
import { Users, Search, Plus, GitMerge } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CatalogoClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; solo?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esAdmin = ['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')

  const q = searchParams.q ?? ''
  // Por defecto mostrar solo EPCs; "solo=todos" muestra todos
  const soloEpc = searchParams.solo !== 'todos'

  let query = supabase
    .from('clientes')
    .select('id, tipo_persona, nombre, nombre_comercial, rfc, ciudad, estado, email, es_epc, created_at')

  if (soloEpc) {
    query = query.eq('es_epc', true)
  }

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,rfc.ilike.%${q}%,nombre_comercial.ilike.%${q}%`)
  }

  const { data: clientes } = await query.order('nombre').limit(100)

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clientes?.length ?? 0} cliente{(clientes?.length ?? 1) !== 1 ? 's' : ''}
            {q ? ` para "${q}"` : ''}
            {soloEpc ? ' · Solo EPC/integradores' : ' · Todos'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {esAdmin && (
            <Link
              href="/dashboard/inspector/clientes/duplicados"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <GitMerge className="w-4 h-4" />
              Duplicados
            </Link>
          )}
          <Link
            href="/dashboard/inspector/clientes/nuevo"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Link>
        </div>
      </div>

      {/* Search bar + filtro */}
      <form method="GET" className="mb-6">
        {/* Preservar filtro solo al buscar */}
        {!soloEpc && <input type="hidden" name="solo" value="todos" />}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o RFC..."
              className="input-field pl-9 pr-4 w-full"
            />
            {q && (
              <Link
                href={soloEpc ? '/dashboard/inspector/clientes' : '/dashboard/inspector/clientes?solo=todos'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </Link>
            )}
          </div>

          {/* Toggle EPC / Todos */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shrink-0">
            <Link
              href={q ? `/dashboard/inspector/clientes?q=${q}` : '/dashboard/inspector/clientes'}
              className={`px-3 py-2 font-medium transition-colors ${
                soloEpc ? 'bg-brand-green text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Solo EPC
            </Link>
            <Link
              href={q ? `/dashboard/inspector/clientes?solo=todos&q=${q}` : '/dashboard/inspector/clientes?solo=todos'}
              className={`px-3 py-2 font-medium transition-colors border-l border-gray-200 ${
                !soloEpc ? 'bg-brand-green text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Todos
            </Link>
          </div>
        </div>
      </form>

      {/* Results */}
      <div className="card p-0 overflow-hidden">
        {!clientes?.length ? (
          <div className="text-center py-20 px-6">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">
              {q ? `Sin resultados para "${q}"` : soloEpc ? 'Sin clientes EPC registrados' : 'Sin clientes'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {q
                ? 'Intenta con otro nombre o RFC.'
                : 'Crea el primero usando el botón "Nuevo cliente".'}
            </p>
            {q && (
              <Link
                href="/dashboard/inspector/clientes"
                className="mt-4 inline-block text-sm text-brand-green hover:underline"
              >
                Ver todos los clientes
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">RFC</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Ciudad / Estado</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500">EPC</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    {/* Nombre + nombre_comercial */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/inspector/clientes/${cliente.id}`}
                        className="font-medium text-gray-900 hover:text-brand-green transition-colors"
                      >
                        {cliente.nombre}
                      </Link>
                      {cliente.nombre_comercial && (
                        <span className="text-gray-400 text-xs ml-1.5">
                          / {cliente.nombre_comercial}
                        </span>
                      )}
                    </td>

                    {/* Tipo persona */}
                    <td className="py-3 px-3 text-center">
                      {cliente.tipo_persona === 'fisica' ? (
                        <span className="badge-aprobada">Física</span>
                      ) : (
                        <span className="badge-en_revision">Moral</span>
                      )}
                    </td>

                    {/* RFC */}
                    <td className="py-3 px-3 font-mono text-xs text-gray-700">
                      {cliente.rfc ?? <span className="text-gray-400">—</span>}
                    </td>

                    {/* Ciudad / Estado */}
                    <td className="py-3 px-3 text-gray-600">
                      {cliente.ciudad || cliente.estado
                        ? [cliente.ciudad, cliente.estado].filter(Boolean).join(', ')
                        : <span className="text-gray-400">—</span>}
                    </td>

                    {/* EPC */}
                    <td className="py-3 px-3 text-center">
                      {cliente.es_epc ? (
                        <span className="text-brand-green font-bold text-base" title="Es cliente EPC">✓</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/inspector/clientes/${cliente.id}`}
                        className="text-xs text-brand-green hover:underline font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
