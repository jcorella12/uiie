import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DuplicadosMergeUI from './DuplicadosMergeUI'

// ─── Normalización de nombres ─────────────────────────────────────────────────
// Elimina: acentos, puntuación, espacios, guiones, puntos, comas
// y sufijos legales comunes → produce una "clave de comparación"

function normalizar(nombre: string): string {
  return nombre
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')              // quitar acentos
    .replace(/[^A-Z0-9]/g, '')                     // solo alfanumérico
    .replace(/(SADEcv|SAPIDECEV|SAPIDECV|SADEVC|SAPI|SAC|SC|AC|SRL)$/g, '') // sufijos legales
    .trim()
}

export interface ClienteRow {
  id: string
  nombre: string
  rfc?: string
  ciudad?: string
  estado?: string
  tipo_persona: string
  created_at: string
  num_expedientes: number
}

export interface GrupoDuplicados {
  clave: string
  clientes: ClienteRow[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DuplicadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')) {
    redirect('/dashboard/inspector/clientes')
  }

  // Traer todos los clientes con conteo de expedientes
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre, rfc, ciudad, estado, tipo_persona, created_at')
    .order('nombre')

  if (!clientes?.length) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-gray-400">Sin clientes registrados.</p>
      </div>
    )
  }

  // Contar expedientes por cliente
  const { data: conteos } = await supabase
    .from('expedientes')
    .select('cliente_id')

  const expPorCliente: Record<string, number> = {}
  for (const exp of conteos ?? []) {
    if (exp.cliente_id) expPorCliente[exp.cliente_id] = (expPorCliente[exp.cliente_id] ?? 0) + 1
  }

  // Agrupar por clave normalizada
  const grupos: Record<string, ClienteRow[]> = {}
  for (const c of clientes) {
    const clave = normalizar(c.nombre)
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push({
      ...c,
      num_expedientes: expPorCliente[c.id] ?? 0,
    })
  }

  // Solo grupos con 2+ clientes (posibles duplicados)
  const duplicados: GrupoDuplicados[] = Object.entries(grupos)
    .filter(([, arr]) => arr.length > 1)
    .map(([clave, arr]) => ({
      clave,
      // Ordenar: primero el que tenga más expedientes, luego el más antiguo
      clientes: arr.sort((a, b) => {
        if (b.num_expedientes !== a.num_expedientes) return b.num_expedientes - a.num_expedientes
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }),
    }))
    .sort((a, b) => b.clientes.length - a.clientes.length)

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard/inspector/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Catálogo de Clientes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes Duplicados</h1>
        <p className="text-gray-500 text-sm mt-1">
          Detectados por similitud de nombre (ignora espacios, comas, acentos y guiones).
          {duplicados.length > 0
            ? ` Se encontraron ${duplicados.length} grupo${duplicados.length !== 1 ? 's' : ''} con posibles duplicados.`
            : ' No se encontraron duplicados.'}
        </p>
      </div>

      {duplicados.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-gray-700">Sin duplicados detectados</p>
          <p className="text-sm text-gray-400 mt-1">Todos los clientes tienen nombres únicos.</p>
        </div>
      ) : (
        <DuplicadosMergeUI grupos={duplicados} />
      )}
    </div>
  )
}
