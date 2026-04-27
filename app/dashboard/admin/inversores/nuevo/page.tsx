import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgregarInversor from '@/components/inversores/AgregarInversor'

export default async function NuevoInversorAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <AgregarInversor backHref="/dashboard/admin/inversores" />
}
