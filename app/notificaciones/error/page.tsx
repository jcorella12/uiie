import { AlertTriangle } from 'lucide-react'

const REASONS: Record<string, { title: string; desc: string }> = {
  notfound:       { title: 'Notificación no encontrada',      desc: 'El enlace no es válido o ya no existe.' },
  expired:        { title: 'Enlace expirado',                 desc: 'Esta notificación expiró (más de 14 días). Contacta al equipo de revisión.' },
  invalid_choice: { title: 'Opción no válida',                desc: 'La opción que elegiste no corresponde a esta notificación.' },
  missing:        { title: 'Falta información',                desc: 'El enlace está incompleto. Vuelve a abrirlo desde el correo original.' },
  server:         { title: 'Algo salió mal',                  desc: 'Hubo un error procesando tu respuesta. Intenta de nuevo en unos minutos.' },
}

export default function ErrorPage({ searchParams }: { searchParams: { reason?: string } }) {
  const r = REASONS[searchParams.reason ?? ''] ?? { title: 'No se pudo procesar', desc: 'Intenta de nuevo o contacta al equipo.' }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{r.title}</h1>
        <p className="text-sm text-gray-500">{r.desc}</p>
        <p className="text-[11px] text-gray-300 pt-2 border-t border-gray-100">
          UIIE-CRE-021 · Inteligencia en Ahorro de Energía S.A. de C.V.
        </p>
      </div>
    </div>
  )
}
