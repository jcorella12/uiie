import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GlobalKPIsDashboard from '@/components/dashboard/GlobalKPIsDashboard'

export default async function DashboardResponsable() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rol = usuario?.rol

  if (rol === 'admin') redirect('/dashboard/admin')
  if (rol === 'inspector') redirect('/dashboard/inspector')
  if (rol === 'cliente') redirect('/dashboard/cliente')
  if (rol && rol !== 'inspector_responsable') redirect('/dashboard/inspector')

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Globales</h1>
        <p className="text-gray-500 text-sm mt-1">Panel del Inspector Responsable · {new Date().getFullYear()}</p>
      </div>
      <GlobalKPIsDashboard />
    </div>
  )
}
