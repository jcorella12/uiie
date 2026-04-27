import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ImportarTestigosForm from '@/components/testigos/ImportarTestigosForm'

export default async function ImportarTestigosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()

  if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(perfil?.rol ?? '')) {
    redirect('/dashboard')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Participantes con IA</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sube un CSV, Excel exportado como texto, o pega una lista de nombres — la IA extrae los datos automáticamente.
        </p>
      </div>
      <ImportarTestigosForm />
    </div>
  )
}
