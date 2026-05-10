import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PendientesCNEClient from '@/components/cre/PendientesCNEClient'

export default async function PendientesCNEPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (!['admin', 'inspector_responsable'].includes(u?.rol ?? '')) {
    redirect('/dashboard')
  }

  const db = await createServiceClient()

  const { data: pendientes } = await db
    .from('cne_inbound_pendientes')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(200)

  return <PendientesCNEClient pendientes={pendientes ?? []} />
}
