import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgregarInversor from '@/components/inversores/AgregarInversor'

export default async function AgregarInversorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!u || !rolesPermitidos.includes(u.rol)) redirect('/dashboard')

  return <AgregarInversor backHref="/dashboard/inspector/inversores" />
}
