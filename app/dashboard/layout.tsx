import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@/lib/types'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre, apellidos')
    .eq('id', user.id)
    .single()

  // Fallback: derive role from JWT user_metadata if DB row not ready yet
  const meta = user.user_metadata as any
  const rol: UserRole = (usuario?.rol ?? meta?.rol ?? 'inspector') as UserRole
  const nombre = usuario
    ? [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ')
    : (meta?.nombre ?? user.email ?? 'Usuario')

  return (
    <Suspense fallback={<div className="flex min-h-screen bg-gray-50 items-center justify-center"><span className="text-gray-400 text-sm">Cargando…</span></div>}>
      <DashboardLayout rol={rol} nombre={nombre}>
        {children}
      </DashboardLayout>
    </Suspense>
  )
}
