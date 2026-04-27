'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AgregarAuxiliarModal } from '@/components/equipo/AgregarAuxiliarModal'
import {
  UserPlus, Users, CheckCircle2, XCircle,
  Loader2, Mail, Phone, Shield, ShieldOff,
} from 'lucide-react'

type Auxiliar = {
  id: string
  email: string
  nombre: string
  apellidos: string | null
  telefono: string | null
  activo: boolean
  created_at: string
  vinculo_activo: boolean
}

export default function MiEquipoPage() {
  const supabase = createClient()
  const [auxiliares,  setAuxiliares]  = useState<Auxiliar[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [toggling,    setToggling]    = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('inspector_auxiliares')
      .select(`
        activo,
        created_at,
        auxiliar:usuarios!auxiliar_id(id, email, nombre, apellidos, telefono, activo)
      `)
      .eq('inspector_id', user.id)
      .order('created_at', { ascending: false })

    const lista: Auxiliar[] = (data ?? []).map((row: any) => ({
      ...row.auxiliar,
      vinculo_activo: row.activo,
      created_at: row.created_at,
    }))

    setAuxiliares(lista)
    setLoading(false)
  }, [supabase])

  useEffect(() => { cargar() }, [cargar])

  async function toggleActivo(auxiliarId: string, activoActual: boolean) {
    setToggling(auxiliarId)
    await fetch('/api/auxiliares/crear', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auxiliarId, activo: !activoActual }),
    })
    await cargar()
    setToggling(null)
  }

  const activos   = auxiliares.filter(a => a.vinculo_activo)
  const inactivos = auxiliares.filter(a => !a.vinculo_activo)

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Equipo</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Auxiliares y administrativos con acceso a tu cuenta
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Agregar auxiliar
        </button>
      </div>

      {/* Info card */}
      <div className="card mb-6 bg-brand-green-light/40 border border-brand-green/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1">Acceso controlado por ti</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Tus auxiliares pueden gestionar expedientes, agenda, clientes y solicitudes en tu nombre.
              No pueden ver comisiones, modificar datos financieros ni firmar documentos oficiales.
              Puedes desactivar su acceso en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de auxiliares */}
      {loading ? (
        <div className="card flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-green" />
        </div>
      ) : auxiliares.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-600">Sin auxiliares registrados</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Agrega a tu primer auxiliar para que te ayude a gestionar el trabajo.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Agregar auxiliar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activos */}
          {activos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Activos ({activos.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {activos.map(aux => (
                  <AuxiliarCard
                    key={aux.id}
                    aux={aux}
                    toggling={toggling}
                    onToggle={toggleActivo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-300" />
                Inactivos ({inactivos.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {inactivos.map(aux => (
                  <AuxiliarCard
                    key={aux.id}
                    aux={aux}
                    toggling={toggling}
                    onToggle={toggleActivo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <AgregarAuxiliarModal
          onClose={() => setModalOpen(false)}
          onCreado={cargar}
        />
      )}
    </div>
  )
}

// ── Sub-componente tarjeta de auxiliar ────────────────────────
function AuxiliarCard({
  aux,
  toggling,
  onToggle,
}: {
  aux: Auxiliar
  toggling: string | null
  onToggle: (id: string, activo: boolean) => void
}) {
  const isToggling = toggling === aux.id

  return (
    <div className={`card flex items-start gap-4 transition-opacity ${!aux.vinculo_activo ? 'opacity-60' : ''}`}>
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        aux.vinculo_activo ? 'bg-brand-green-light text-brand-green' : 'bg-gray-100 text-gray-400'
      }`}>
        {aux.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm">
            {aux.nombre}{aux.apellidos ? ' ' + aux.apellidos : ''}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            aux.vinculo_activo
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {aux.vinculo_activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="mt-1 space-y-0.5">
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="w-3 h-3" />
            {aux.email}
          </p>
          {aux.telefono && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone className="w-3 h-3" />
              {aux.telefono}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Agregado {new Date(aux.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Botón toggle */}
      <button
        onClick={() => onToggle(aux.id, aux.vinculo_activo)}
        disabled={isToggling}
        title={aux.vinculo_activo ? 'Desactivar acceso' : 'Reactivar acceso'}
        className={`flex-shrink-0 p-2 rounded-lg transition-colors disabled:opacity-50 ${
          aux.vinculo_activo
            ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            : 'hover:bg-green-50 text-gray-300 hover:text-green-600'
        }`}
      >
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : aux.vinculo_activo ? (
          <ShieldOff className="w-4 h-4" />
        ) : (
          <Shield className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
