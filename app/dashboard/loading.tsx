/**
 * Loading skeleton para todas las páginas dentro de /dashboard.
 * Mantiene el shell del layout para que la transición se vea fluida.
 *
 * Nota: el sidebar real ya se está renderizando por el layout padre,
 * así que aquí solo necesitamos el skeleton del área de contenido.
 */
export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-6 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
                <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse" />
                <div className="w-12 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
