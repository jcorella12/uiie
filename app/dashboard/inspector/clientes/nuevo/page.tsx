import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClienteForm from '@/components/clientes/ClienteForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NuevoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/inspector/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Catálogo de Clientes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
        <p className="text-gray-500 text-sm mt-1">Registra los datos del cliente para el expediente.</p>
      </div>

      <ClienteForm modo="crear" />
    </div>
  )
}
