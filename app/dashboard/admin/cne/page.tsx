import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import CertificadosCRE from '@/components/cre/CertificadosCRE'

export default async function CertificadosCREPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esStaff = ['admin', 'inspector_responsable'].includes(usuarioData?.rol ?? '')

  const db = await createServiceClient()

  // Certificados ordenados por más reciente
  const { data: certificados } = await db
    .from('certificados_cre')
    .select(`
      id, numero_certificado, titulo, url_cre, url_acuse, url_qr, resumen_acta,
      fecha_emision, created_at,
      expediente:expedientes(
        id, numero_folio, ciudad, estado_mx, nombre_cliente_final,
        inspector:usuarios!inspector_id(nombre, apellidos),
        cliente:clientes(nombre)
      )
    `)
    .order('fecha_emision', { ascending: false, nullsFirst: false })
    .order('created_at',    { ascending: false })
    .limit(200)

  return (
    <CertificadosCRE
      certificados={(certificados ?? []) as any}
      esStaff={esStaff}
    />
  )
}
