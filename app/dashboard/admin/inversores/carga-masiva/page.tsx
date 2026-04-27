import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CargaMasivaInversores from '@/components/inversores/CargaMasivaInversores'

export default async function CargaMasivaPage() {
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

  return (
    <div>
      <div className="px-6 sm:px-8 pt-6">
        <Link
          href="/dashboard/admin/inversores"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>
      </div>
      <CargaMasivaInversores />
    </div>
  )
}
