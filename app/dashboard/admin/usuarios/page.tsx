import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateShort, ROLE_LABELS } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

const ROL_BADGE: Record<UserRole, string> = {
  inspector_responsable: 'badge-folio_asignado',
  admin: 'badge-rechazada',
  inspector: 'badge-en_revision',
  auxiliar: 'badge-pendiente',
  cliente: 'badge-aprobada',
}

export default async function GestionUsuariosPage() {
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

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, email, nombre, apellidos, rol, activo, created_at')
    .order('created_at', { ascending: false })

  const lista = usuarios ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} usuario{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/admin/usuarios/nuevo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Crear usuario
        </Link>
      </div>

      <div className="card p-0 overflow-x-auto">
        {lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-6">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Sin usuarios registrados</p>
            <p className="text-sm mt-1">Crea el primer usuario del sistema.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Rol</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Activo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Registro</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                const rolKey = u.rol as UserRole
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {u.nombre} {u.apellidos ?? ''}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={ROL_BADGE[rolKey] ?? 'badge-pendiente'}>
                        {ROLE_LABELS[rolKey] ?? u.rol}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.activo ? (
                        <span className="text-brand-green font-semibold">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {formatDateShort(u.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/dashboard/admin/usuarios/${u.id}/editar`}
                        className="text-xs text-brand-green hover:text-brand-green-dark font-semibold hover:underline"
                      >
                        Editar
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
