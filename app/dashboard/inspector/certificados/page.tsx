import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Award, Download, Search, MapPin, Calendar, FolderOpen } from 'lucide-react'
import { parseDBDate } from '@/lib/utils'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  // parseDBDate evita el corrimiento de día cuando `fecha_emision` viene como
  // YYYY-MM-DD (DATE) y se interpretaría como UTC.
  return parseDBDate(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function InspectorCertificadosPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol, nombre').eq('id', user.id).single()

  const esAdmin = ['admin', 'inspector_responsable'].includes(perfil?.rol ?? '')
  const esInspector = ['inspector', 'auxiliar'].includes(perfil?.rol ?? '')
  if (!esAdmin && !esInspector) redirect('/dashboard')

  const db = await createServiceClient()
  const q = searchParams.q?.trim() ?? ''

  // Query base: certificados propios (inspector) o todos (admin/ir)
  let query = db
    .from('certificados_cre')
    .select(`
      id, numero_certificado, titulo, url_cre, url_acuse,
      fecha_emision, created_at,
      expediente:expedientes(
        id, numero_folio, ciudad, estado_mx, nombre_cliente_final, inspector_id,
        inspector:usuarios!inspector_id(nombre, apellidos),
        cliente:clientes(nombre)
      )
    `)
    .order('fecha_emision', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(300)

  const { data: todos } = await query

  // Filtrar: inspectores ven solo sus propios; todos filtran por búsqueda
  const certificados = (todos ?? []).filter((c: any) => {
    const exp = c.expediente as any
    if (!exp) return esAdmin
    // Inspector solo ve sus propios expedientes
    if (!esAdmin && exp.inspector_id !== user.id) return false
    // Búsqueda de texto
    if (!q) return true
    const ql = q.toLowerCase()
    return (
      (exp.numero_folio ?? '').toLowerCase().includes(ql) ||
      (exp.cliente?.nombre ?? '').toLowerCase().includes(ql) ||
      (exp.nombre_cliente_final ?? '').toLowerCase().includes(ql) ||
      (c.numero_certificado ?? '').toLowerCase().includes(ql)
    )
  })

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Certificados</h1>
            <p className="text-sm text-gray-500">
              {certificados.length} certificado{certificados.length !== 1 ? 's' : ''} emitido{certificados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <form method="GET" className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por folio, cliente o cliente final…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
        />
      </form>

      {/* Lista */}
      {certificados.length === 0 ? (
        <div className="card text-center py-16">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">
            {q ? 'Sin resultados para esa búsqueda' : 'Aún no hay certificados emitidos'}
          </p>
          {q && (
            <Link href="/dashboard/inspector/certificados" className="text-sm text-brand-green hover:underline mt-1 inline-block">
              Limpiar búsqueda
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {certificados.map((cert: any) => {
            const exp = cert.expediente
            const inspector = exp?.inspector
            const inspNombre = inspector
              ? [inspector.nombre, inspector.apellidos].filter(Boolean).join(' ')
              : '—'

            return (
              <div key={cert.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0">
                    {/* Número de certificado + folio */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Award className="w-4 h-4 text-brand-green shrink-0" />
                      <span className="font-mono font-bold text-brand-green tracking-wide">
                        {cert.numero_certificado}
                      </span>
                      {exp && (
                        <>
                          <span className="text-gray-300">·</span>
                          <Link
                            href={`/dashboard/inspector/expedientes/${exp.id}`}
                            className="font-mono text-sm text-gray-600 hover:text-brand-green hover:underline flex items-center gap-1"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            {exp.numero_folio ?? '—'}
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Cliente y cliente final */}
                    <div className="text-sm text-gray-700 pl-6">
                      {exp?.cliente?.nombre && (
                        <span className="font-medium">{exp.cliente.nombre}</span>
                      )}
                      {exp?.nombre_cliente_final && (
                        <span className="text-gray-500">
                          {exp?.cliente?.nombre ? ' · ' : ''}{exp.nombre_cliente_final}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 pl-6">
                      {(exp?.ciudad || exp?.estado_mx) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[exp.ciudad, exp.estado_mx].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {(cert.fecha_emision || cert.created_at) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(cert.fecha_emision ?? cert.created_at)}
                        </span>
                      )}
                      {esAdmin && (
                        <span className="text-gray-400">Inspector: {inspNombre}</span>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={cert.url_cre}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Certificado
                    </a>
                    {cert.url_acuse && (
                      <a
                        href={cert.url_acuse}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Acuse
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
