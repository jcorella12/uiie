import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DictamenVista from '@/components/dictamen/DictamenVista'
import DictamenForm from '@/components/dictamen/DictamenForm'

interface Props {
  params: { id: string }
}

export default async function DictamenPage({ params }: Props) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esAdmin = ['admin', 'inspector_responsable'].includes(usuarioActual?.rol ?? '')
  const db = esAdmin ? await createServiceClient() : supabase

  const { data: expediente, error: expError } = await db
    .from('expedientes')
    .select(
      '*, cliente:clientes(nombre, rfc, representante, tipo_persona), folio:folios_lista_control(numero_folio)'
    )
    .eq('id', params.id)
    .single()

  if (expError || !expediente) {
    return (
      <div className="p-8">
        <div className="card text-center py-16 text-gray-500">
          <p className="font-semibold text-gray-700">Expediente no encontrado</p>
          <p className="text-sm mt-1">El expediente solicitado no existe o no tienes acceso.</p>
        </div>
      </div>
    )
  }

  const { data: dictamen } = await db
    .from('dictamenes')
    .select('*')
    .eq('expediente_id', params.id)
    .maybeSingle()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dictamen Técnico</h1>
        <p className="text-gray-500 text-sm mt-1">
          Expediente{' '}
          <span className="font-mono text-brand-green font-semibold">
            {expediente.numero_folio ?? '—'}
          </span>
        </p>
      </div>

      {dictamen ? (
        <DictamenVista dictamen={dictamen} expediente={expediente} />
      ) : (
        <DictamenForm expediente={expediente} userId={user.id} />
      )}
    </div>
  )
}
