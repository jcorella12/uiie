import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PerfilForm from '@/components/perfil/PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Datos del usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, email, nombre, apellidos, telefono, rol, activo, avatar_url')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/login')

  // Datos de inspector (solo si aplica)
  let inspectorRow = null
  if (['inspector', 'inspector_responsable'].includes(usuario.rol)) {
    const { data } = await supabase
      .from('inspectores')
      .select('numero_cedula, especialidad')
      .eq('usuario_id', user.id)
      .maybeSingle()
    inspectorRow = data ?? null
  }

  return <PerfilForm usuario={usuario} inspector={inspectorRow} />
}
