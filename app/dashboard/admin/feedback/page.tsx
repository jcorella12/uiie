import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MessageSquarePlus } from 'lucide-react'
import FeedbackList from './FeedbackList'
import TestEmailButton from '@/components/admin/TestEmailButton'

export const dynamic = 'force-dynamic'

export default async function FeedbackAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()
  if (!perfil || !['admin', 'inspector_responsable'].includes(perfil.rol)) {
    redirect('/dashboard')
  }

  // Cargar todo el feedback con datos del reporter
  const db = await createServiceClient()
  const { data: items } = await db
    .from('feedback')
    .select(`
      id, tipo, titulo, descripcion, url_pagina, user_agent,
      screenshots, status, prioridad, notas_responsable,
      atendido_por, atendido_en, created_at, updated_at,
      reporter:usuarios!feedback_usuario_id_fkey(id, nombre, apellidos, email, rol),
      atendedor:usuarios!feedback_atendido_por_fkey(id, nombre, apellidos)
    `)
    .order('created_at', { ascending: false })

  const lista = (items ?? []) as any[]
  const counts = {
    nuevo:       lista.filter(i => i.status === 'nuevo').length,
    en_revision: lista.filter(i => i.status === 'en_revision').length,
    resuelto:    lista.filter(i => i.status === 'resuelto').length,
    descartado:  lista.filter(i => i.status === 'descartado').length,
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <MessageSquarePlus className="w-6 h-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback de usuarios</h1>
          <p className="text-sm text-gray-500">Bugs, mejoras y preguntas reportadas por los usuarios</p>
        </div>
      </div>

      {/* KPIs por status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'nuevo',       label: 'Nuevos',       count: counts.nuevo,       color: 'bg-red-50    text-red-700    border-red-200' },
          { key: 'en_revision', label: 'En revisión',  count: counts.en_revision, color: 'bg-amber-50  text-amber-700  border-amber-200' },
          { key: 'resuelto',    label: 'Resueltos',    count: counts.resuelto,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { key: 'descartado',  label: 'Descartados',  count: counts.descartado,  color: 'bg-gray-50    text-gray-600   border-gray-200' },
        ].map(k => (
          <div key={k.key} className={`rounded-xl border-2 p-3 ${k.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{k.label}</p>
            <p className="text-2xl font-bold mt-0.5">{k.count}</p>
          </div>
        ))}
      </div>

      <FeedbackList items={lista} />

      {/* Pruebas técnicas */}
      <details className="rounded-xl bg-gray-50 border border-gray-200 p-3 mt-6">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Pruebas técnicas
        </summary>
        <div className="mt-3">
          <TestEmailButton />
        </div>
      </details>
    </div>
  )
}
