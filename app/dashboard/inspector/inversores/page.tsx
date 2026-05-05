import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Zap, Search, Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string; tipo?: string; cert?: string }>
}

export default async function InversoresCatalogoPage({ searchParams }: Props) {
  const { q, tipo: tipoParam, cert: certParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Build query — all authenticated users can read inversores (RLS allows it)
  let query = supabase
    .from('inversores')
    .select('id, marca, modelo, potencia_kw, fase, tipo, certificacion, ficha_tecnica_url, certificado_url, eficiencia, tension_ac, corriente_max, total_usos')
    .eq('activo', true)
    .order('marca')
    .order('modelo')

  if (tipoParam && tipoParam !== 'todos') query = query.eq('tipo', tipoParam)
  if (certParam && certParam !== 'todos') query = query.eq('certificacion', certParam)

  const { data: inversores } = await query
  const todos = inversores ?? []

  // Client-side text search result (filter by marca/modelo)
  const lista = q
    ? todos.filter(i =>
        `${i.marca} ${i.modelo}`.toLowerCase().includes(q.toLowerCase())
      )
    : todos

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  const TIPO_BADGE: Record<string, string> = {
    string:       'bg-blue-100 text-blue-800',
    microinversor:'bg-purple-100 text-purple-800',
    hibrido:      'bg-orange-100 text-orange-800',
  }
  const TIPO_LABEL: Record<string, string> = {
    string: 'String', microinversor: 'Microinversor', hibrido: 'Híbrido',
  }
  const CERT_BADGE: Record<string, string> = {
    ul1741:        'bg-green-100  text-green-800',
    homologado_cne:'bg-emerald-100 text-emerald-800',
    ieee1547:      'bg-orange-100 text-orange-800',
    ninguna:       'bg-gray-100   text-gray-500',
  }
  const CERT_LABEL: Record<string, string> = {
    ul1741: 'UL1741 ✓',
    homologado_cne: 'Homologado a UL (CNE)',
    ieee1547: 'IEEE 1547',
    ninguna: 'Sin cert',
  }
  const FASE_LABEL: Record<string, string> = {
    monofasico: '1F', bifasico: '2F', trifasico: '3F',
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Inversores</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} inversor{lista.length !== 1 ? 'es' : ''} registrado{lista.length !== 1 ? 's' : ''} · base de datos compartida
          </p>
        </div>
        <Link
          href="/dashboard/inspector/inversores/agregar"
          className="btn-primary flex items-center gap-2 text-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Agregar inversor
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-6">
        {/* Text search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar marca o modelo…"
            className="input-field pl-9 py-1.5 text-sm w-56"
          />
        </div>

        {/* Tipo filter */}
        <select name="tipo" defaultValue={tipoParam ?? 'todos'}
          className="input-field py-1.5 text-sm pr-8">
          <option value="todos">Todos los tipos</option>
          <option value="string">String</option>
          <option value="microinversor">Microinversor</option>
          <option value="hibrido">Híbrido</option>
        </select>

        {/* Cert filter */}
        <select name="cert" defaultValue={certParam ?? 'todos'}
          className="input-field py-1.5 text-sm pr-8">
          <option value="todos">Todas las certificaciones</option>
          <option value="ul1741">UL1741</option>
          <option value="homologado_cne">Homologado a UL (CNE)</option>
          <option value="ieee1547">IEEE 1547</option>
          <option value="ninguna">Sin certificación</option>
        </select>

        <button type="submit" className="btn-primary py-1.5 text-sm px-4">Filtrar</button>
        <a href="/dashboard/inspector/inversores" className="text-sm text-gray-400 hover:text-gray-600">
          Limpiar
        </a>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-6">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin resultados</p>
            <p className="text-sm mt-1">Prueba con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Marca / Modelo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">kW</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Fase</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Certificación</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Efic. %</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Ficha técnica</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Certificado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((inv, i) => (
                <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="py-3 px-4">
                    <div className="text-gray-500 text-xs">{inv.marca}</div>
                    <div className="font-semibold text-gray-800">{inv.modelo}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-700">
                    {inv.potencia_kw != null ? Number(inv.potencia_kw).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs text-gray-600 font-medium">
                      {FASE_LABEL[inv.fase] ?? inv.fase ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_BADGE[inv.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TIPO_LABEL[inv.tipo] ?? inv.tipo ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CERT_BADGE[inv.certificacion] ?? 'bg-gray-100 text-gray-500'}`}>
                      {CERT_LABEL[inv.certificacion] ?? inv.certificacion ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {inv.eficiencia != null ? `${inv.eficiencia}%` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.ficha_tecnica_url ? (
                      <a
                        href={`${SUPABASE_URL}/storage/v1/object/public/catalogos/${inv.ficha_tecnica_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium"
                      >
                        📄 Ver PDF
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.certificado_url ? (
                      <a
                        href={`${SUPABASE_URL}/storage/v1/object/public/catalogos/${inv.certificado_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-medium hover:bg-green-100"
                      >
                        ✅ Ver
                      </a>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                        Sin archivo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Catálogo compartido — visible para todo el equipo · cualquier inspector puede agregar inversores
      </p>
    </div>
  )
}
