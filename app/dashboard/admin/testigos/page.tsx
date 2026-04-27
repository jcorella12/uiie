import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Upload } from 'lucide-react'

export default async function TestigosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = usuarioActual?.rol ?? ''
  if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(rol)) {
    redirect('/dashboard')
  }

  const esAdmin = ['admin', 'inspector_responsable'].includes(rol)

  // Admins ven todos; inspectores solo los suyos (RLS también lo aplica, pero filtramos aquí para claridad)
  let query = supabase
    .from('testigos')
    .select('id, nombre, apellidos, empresa, email, telefono, rol, curp, numero_ine, ciudad, estado, activo, creado_por, created_at')
    .order('nombre')

  if (!esAdmin) {
    query = query.eq('creado_por', user.id)
  }

  const { data: testigos } = await query
  const lista = testigos ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {esAdmin ? 'Participantes' : 'Mis Participantes'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} participante{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
            {!esAdmin && ' por ti'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/admin/testigos/importar" className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Importar con IA
          </Link>
          <Link href="/dashboard/admin/testigos/nuevo" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo participante
          </Link>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-6">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin participantes registrados</p>
            <p className="text-sm mt-1">Agrega el primer participante al catálogo.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre completo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">INE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ciudad / Estado</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Activo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((t) => {
                const ineDisplay = t.numero_ine
                  ? `···${t.numero_ine.slice(-4)}`
                  : '—'
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {t.nombre} {t.apellidos ?? ''}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 capitalize">
                        {(t as any).rol === 'atiende' ? 'Atiende visita'
                          : (t as any).rol === 'firmante' ? 'Firmante'
                          : (t as any).rol === 'representante' ? 'Representante'
                          : (t as any).rol === 'testigo' ? 'Testigo'
                          : (t as any).rol ?? 'Testigo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {t.empresa ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                      {ineDisplay}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {[t.ciudad, t.estado].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/dashboard/admin/testigos/${t.id}`}
                        className="text-xs text-brand-green hover:text-brand-green-dark font-semibold hover:underline"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
