import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, Plus, Upload } from 'lucide-react'

type Filtro = 'todos' | 'con_cert' | 'sin_cert'

interface Props {
  searchParams: Promise<{ filtro?: string }>
}

export default async function InversoresPage({ searchParams }: Props) {
  const { filtro: filtroParam } = await searchParams
  const filtro: Filtro =
    filtroParam === 'con_cert' ? 'con_cert'
    : filtroParam === 'sin_cert' ? 'sin_cert'
    : 'todos'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['admin', 'inspector_responsable'].includes(usuarioActual?.rol ?? '')) {
    redirect('/dashboard')
  }

  const { data: inversores } = await supabase
    .from('inversores')
    .select('id, marca, modelo, potencia_kw, tipo, certificacion, ficha_tecnica_url, certificado_url, total_usos, activo')
    .eq('activo', true)
    .order('marca')
    .order('modelo')

  const todos = inversores ?? []

  const lista = filtro === 'con_cert'
    ? todos.filter((i) => i.certificado_url)
    : filtro === 'sin_cert'
    ? todos.filter((i) => !i.certificado_url)
    : todos

  const TIPO_BADGE: Record<string, string> = {
    string: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    microinversor: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
    hibrido: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
  }

  const TIPO_LABEL: Record<string, string> = {
    string: 'String',
    microinversor: 'Microinversor',
    hibrido: 'Híbrido',
  }

  const CERT_BADGE: Record<string, string> = {
    ul1741: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    ieee1547: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
    ninguna: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
  }

  const CERT_LABEL: Record<string, string> = {
    ul1741: 'UL1741 ✓',
    ieee1547: 'IEEE 1547',
    ninguna: 'Sin cert',
  }

  const chips: { key: Filtro; label: string }[] = [
    { key: 'todos', label: `Todos (${todos.length})` },
    { key: 'con_cert', label: `Con certificado (${todos.filter((i) => i.certificado_url).length})` },
    { key: 'sin_cert', label: `Sin certificado (${todos.filter((i) => !i.certificado_url).length})` },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Inversores</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} inversor{lista.length !== 1 ? 'es' : ''} encontrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/inversores/carga-masiva"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 text-gray-500" /> Carga masiva
          </Link>
          <Link href="/dashboard/admin/inversores/nuevo" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo inversor
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-6">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.key === 'todos' ? '/dashboard/admin/inversores' : `/dashboard/admin/inversores?filtro=${chip.key}`}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filtro === chip.key
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        {lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-6">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin inversores registrados</p>
            <p className="text-sm mt-1">Agrega el primer inversor al catálogo.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Marca / Modelo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">kW</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Certificación</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Ficha técnica</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Certificado</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Usos</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-gray-500 text-xs">{inv.marca}</div>
                    <div className="font-semibold text-gray-800">{inv.modelo}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 font-mono">
                    {inv.potencia_kw != null ? Number(inv.potencia_kw).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={TIPO_BADGE[inv.tipo] ?? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'}>
                      {TIPO_LABEL[inv.tipo] ?? inv.tipo ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.certificacion ? (
                      <span className={CERT_BADGE[inv.certificacion] ?? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'}>
                        {CERT_LABEL[inv.certificacion] ?? inv.certificacion}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.ficha_tecnica_url ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogos/${inv.ficha_tecnica_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium"
                      >
                        📄 PDF
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.certificado_url ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogos/${inv.certificado_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-medium hover:bg-green-100"
                      >
                        ✅ Cargado
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                        ❌ Falta
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">
                    {inv.total_usos ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/dashboard/admin/inversores/${inv.id}`}
                      className="text-xs text-brand-green hover:text-brand-green-dark font-semibold hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
