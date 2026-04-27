import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = usuario?.rol ?? 'inspector'

  if (rol === 'inspector_responsable') redirect('/dashboard')
  if (rol === 'admin') redirect('/dashboard/admin')
  if (rol === 'inspector') redirect('/dashboard/inspector')
  redirect('/dashboard/cliente')
}
