'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendario } from '@/components/agenda/Calendario'
import { BloquearDiaModal } from '@/components/agenda/BloquearDiaModal'
import { Calendar, Lock } from 'lucide-react'

type Inspector = { id: string; nombre: string }

export default function AgendaAdminPage() {
  const supabase = createClient()
  const [modalOpen,   setModalOpen]   = useState(false)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [inspectores, setInspectores] = useState<Inspector[]>([])

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('id, nombre')
      .in('rol', ['inspector', 'inspector_responsable'])
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setInspectores(data ?? []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGuardado = () => {
    setRefreshKey(k => k + 1)
    setModalOpen(false)
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda General</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Todas las inspecciones del equipo CIAE
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Lock className="w-4 h-4" />
          Bloquear día
        </button>
      </div>

      {/* Calendario — key fuerza re-montaje al guardar bloqueo */}
      <Calendario key={refreshKey} isAdmin inspectores={inspectores} />

      {/* Modal de bloquear día */}
      {modalOpen && (
        <BloquearDiaModal
          inspectores={inspectores}
          onClose={() => setModalOpen(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}
