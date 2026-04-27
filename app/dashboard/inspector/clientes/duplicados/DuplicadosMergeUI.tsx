'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2, Merge, CheckCircle } from 'lucide-react'
import type { GrupoDuplicados, ClienteRow } from './page'

interface Props {
  grupos: GrupoDuplicados[]
}

export default function DuplicadosMergeUI({ grupos }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Para cada grupo, guarda qué ID se quiere conservar
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const g of grupos) {
      init[g.clave] = g.clientes[0].id // default: el primero (más expedientes / más antiguo)
    }
    return init
  })

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const g of grupos) init[g.clave] = true
    return init
  })

  const [resultados, setResultados] = useState<Record<string, 'ok' | 'error' | null>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleMerge(grupo: GrupoDuplicados) {
    const keepId = seleccion[grupo.clave]
    const mergeIds = grupo.clientes.map((c) => c.id).filter((id) => id !== keepId)

    startTransition(async () => {
      try {
        const res = await fetch('/api/clientes/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keepId, mergeIds }),
        })
        const data = await res.json()
        if (!res.ok) {
          setResultados((p) => ({ ...p, [grupo.clave]: 'error' }))
          const msg = data.error ?? 'Error desconocido'
          const logStr = data.log?.length ? `\nLog: ${data.log.join(' · ')}` : ''
          setErrores((p) => ({ ...p, [grupo.clave]: msg + logStr }))
        } else {
          setResultados((p) => ({ ...p, [grupo.clave]: 'ok' }))
          // revalidatePath ya se llamó en el servidor — forzar navegación limpia
          window.location.reload()
        }
      } catch {
        setResultados((p) => ({ ...p, [grupo.clave]: 'error' }))
        setErrores((p) => ({ ...p, [grupo.clave]: 'Error de conexión' }))
      }
    })
  }

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => {
        const resultado = resultados[grupo.clave]
        const keepId = seleccion[grupo.clave]
        const abierto = expandidos[grupo.clave] ?? true
        const mergeCount = grupo.clientes.length - 1

        if (resultado === 'ok') {
          return (
            <div key={grupo.clave} className="card border border-green-200 bg-green-50 flex items-center gap-3 py-4">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  {grupo.clientes.find((c) => c.id === keepId)?.nombre}
                </p>
                <p className="text-xs text-green-600">
                  {mergeCount} duplicado{mergeCount !== 1 ? 's' : ''} unificado{mergeCount !== 1 ? 's' : ''} correctamente.
                </p>
              </div>
            </div>
          )
        }

        return (
          <div key={grupo.clave} className="card border border-orange-200 overflow-hidden p-0">
            {/* Header del grupo */}
            <button
              onClick={() => setExpandidos((p) => ({ ...p, [grupo.clave]: !abierto }))}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold shrink-0">
                  {grupo.clientes.length}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {grupo.clientes[0].nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {grupo.clientes.length} registros con nombre similar
                  </p>
                </div>
              </div>
              {abierto ? (
                <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              )}
            </button>

            {abierto && (
              <div className="px-5 pb-5">
                {/* Tabla de opciones */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 w-8">
                          Conservar
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">Nombre</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 hidden sm:table-cell">RFC</th>
                        <th className="text-center py-2.5 px-3 text-xs font-medium text-gray-500">Expedientes</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Ciudad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.clientes.map((cliente, i) => {
                        const isKeep = keepId === cliente.id
                        return (
                          <tr
                            key={cliente.id}
                            onClick={() => setSeleccion((p) => ({ ...p, [grupo.clave]: cliente.id }))}
                            className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                              isKeep ? 'bg-brand-green-light' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <div className={`w-4 h-4 rounded-full border-2 mx-auto transition-all ${
                                isKeep
                                  ? 'border-brand-green bg-brand-green'
                                  : 'border-gray-300'
                              }`}>
                                {isKeep && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <p className={`font-medium ${isKeep ? 'text-brand-green' : 'text-gray-800'}`}>
                                {cliente.nombre}
                              </p>
                              {i === 0 && (
                                <span className="text-[10px] text-brand-green font-semibold">recomendado</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-gray-600 hidden sm:table-cell">
                              {cliente.rfc ?? '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                cliente.num_expedientes > 0
                                  ? 'bg-brand-green text-white'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {cliente.num_expedientes}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-gray-500 hidden sm:table-cell">
                              {[cliente.ciudad, cliente.estado].filter(Boolean).join(', ') || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Aviso de qué va a pasar */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-700">
                  Se conservará <strong>{grupo.clientes.find((c) => c.id === keepId)?.nombre}</strong> y se eliminarán{' '}
                  {grupo.clientes.filter((c) => c.id !== keepId).map((c) => (
                    <strong key={c.id}>"{c.nombre}"</strong>
                  )).reduce((acc: any[], el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}.
                  {' '}Todos los expedientes y solicitudes se reasignarán automáticamente.
                </div>

                {/* Error */}
                {resultados[grupo.clave] === 'error' && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {errores[grupo.clave]}
                  </p>
                )}

                {/* Botón unificar */}
                <button
                  onClick={() => handleMerge(grupo)}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Merge className="w-4 h-4" />
                  )}
                  Unificar en "{grupo.clientes.find((c) => c.id === keepId)?.nombre}"
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
