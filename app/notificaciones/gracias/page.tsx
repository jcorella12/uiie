import { CheckCircle2 } from 'lucide-react'

export default function GraciasPage({
  searchParams,
}: { searchParams: { label?: string; status?: string } }) {
  const label = searchParams.label
  const yaRespondida = searchParams.status === 'ya_respondida'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        {yaRespondida ? (
          <>
            <h1 className="text-xl font-bold text-gray-900">Ya habías respondido</h1>
            <p className="text-sm text-gray-500">
              El equipo de revisión ya tiene tu respuesta anterior. Si necesitas
              corregirla, contacta directamente al equipo.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">¡Gracias!</h1>
            <p className="text-sm text-gray-500">Tu respuesta quedó registrada.</p>
            {label && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 italic">
                "{label}"
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              El equipo de revisión recibirá una notificación con tu respuesta
              y dará seguimiento al expediente.
            </p>
          </>
        )}
        <p className="text-[11px] text-gray-300 pt-2 border-t border-gray-100">
          UIIE-CRE-021 · Inteligencia en Ahorro de Energía S.A. de C.V.
        </p>
      </div>
    </div>
  )
}
