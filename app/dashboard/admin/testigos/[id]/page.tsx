import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TestigoForm from '@/components/testigos/TestigoForm'
import INECaptura from '@/components/ocr/INECaptura'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarTestigoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol').eq('id', user.id).single()

  const rol = perfil?.rol ?? ''
  if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(rol)) {
    redirect('/dashboard')
  }

  const esAdmin = ['admin', 'inspector_responsable'].includes(rol)

  const { data: testigo } = await supabase
    .from('testigos')
    .select('*')
    .eq('id', id)
    .single()

  if (!testigo) redirect('/dashboard/admin/testigos')

  // Inspectors can only edit their own testigos
  if (!esAdmin && testigo.creado_por !== user.id) {
    redirect('/dashboard/admin/testigos')
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Participante</h1>
        <p className="text-gray-500 text-sm mt-1">
          {testigo.nombre} {testigo.apellidos ?? ''}
        </p>
      </div>

      {/* Formulario de datos */}
      <div className="card">
        <TestigoForm testigo={testigo} />
      </div>

      {/* OCR INE */}
      <details className="card p-0 overflow-hidden group" open={!!(testigo.ocr_nombre || testigo.ine_url_frente)}>
        <summary className="cursor-pointer px-6 py-4 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors select-none flex items-center justify-between list-none">
          <span className="flex items-center gap-2">
            Credencial INE / IFE
            {testigo.ine_url_frente && (
              <span className="text-xs font-normal text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                Archivo guardado
              </span>
            )}
            {testigo.ocr_nombre && (
              <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                Datos extraídos
              </span>
            )}
          </span>
          <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </summary>
        <div className="p-6 border-t border-gray-100">
          <INECaptura
            entityType="testigo"
            entityId={testigo.id}
            savedData={{
              ine_url_frente:    testigo.ine_url_frente,
              ine_url_reverso:   testigo.ine_url_reverso,
              ocr_nombre:        testigo.ocr_nombre,
              ocr_curp:          testigo.ocr_curp,
              ocr_clave_elector: testigo.ocr_clave_elector,
              ocr_vigencia:      testigo.ocr_vigencia,
              ocr_numero_ine:    testigo.ocr_numero_ine,
            }}
          />
        </div>
      </details>
    </div>
  )
}
