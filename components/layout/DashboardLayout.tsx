'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  rol: UserRole
  nombre: string
}

export default function DashboardLayout({ children, rol, nombre }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar rol={rol} nombre={nombre} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
