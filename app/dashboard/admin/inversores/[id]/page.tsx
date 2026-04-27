import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InversorForm from '@/components/inversores/InversorForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarInversorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: inversor } = await supabase
    .from('inversores')
    .select('*')
    .eq('id', id)
    .single()

  if (!inversor) redirect('/dashboard/admin/inversores')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editar Inversor</h1>
        <p className="text-gray-500 text-sm mt-1">
          {inversor.marca} — {inversor.modelo}
        </p>
      </div>
      <InversorForm inversor={inversor} />
    </div>
  )
}
