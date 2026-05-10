import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import GlobalKPIsDashboard from '@/components/dashboard/GlobalKPIsDashboard'
import MarketShareCNE from '@/components/dashboard/MarketShareCNE'

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

  // Bypass RLS — este dashboard ya pasó el guard de rol.
  const db = await createServiceClient()
  const { data: certs } = await db
    .from('expedientes')
    .select('numero_certificado, fecha_emision_certificado')
    .not('numero_certificado', 'is', null)
    .not('fecha_emision_certificado', 'is', null)

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Globales</h1>
        <p className="text-gray-500 text-sm mt-1">Panel del Inspector Responsable · {new Date().getFullYear()}</p>
      </div>
      <MarketShareCNE certs={(certs ?? []) as any} />
      <GlobalKPIsDashboard />
    </div>
  )
}
