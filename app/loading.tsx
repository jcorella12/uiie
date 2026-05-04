import { Loader2 } from 'lucide-react'

/**
 * Loading state global. Se renderiza mientras Next.js hace SSR de la página.
 * Mantiene la identidad visual de CIAE (verde de marca + spinner suave).
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Cargando…</p>
      </div>
    </div>
  )
}
