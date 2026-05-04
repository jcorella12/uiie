import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="card max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-brand-green-light flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-6 h-6 text-brand-green" />
        </div>
        <p className="text-5xl font-bold text-brand-green mb-2">404</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          La sección que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
