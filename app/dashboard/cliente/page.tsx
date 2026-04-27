import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, MapPin, Calendar, ChevronRight, FolderOpen, CheckCircle2, Clock, Eye } from 'lucide-react'
import NotificarBtn from '@/components/cliente/NotificarBtn'

const ROLES_STAFF = ['inspector', 'inspector_responsable', 'admin', 'auxiliar']

// Etiquetas amigables para el cliente (sin tecnicismos internos)
const STATUS_CLIENTE: Record<string, { label: string; color: string }> = {
  borrador:   { label: 'Iniciando',         color: 'bg-gray-100 text-gray-600' },
  en_proceso: { label: 'En Proceso',        color: 'bg-blue-100 text-blue-700' },
  revision:   { label: 'En Revisión Final', color: 'bg-orange-100 text-orange-700' },
  aprobado:   { label: 'Aprobado',          color: 'bg-green-100 text-green-700' },
  rechazado:  { label: 'Requiere Atención', color: 'bg-red-100 text-red-700' },
  cerrado:    { label: 'Completado',        color: 'bg-green-100 text-green-700' },
}

function calcularPaso(status: string, tieneInspProgramada: boolean, tieneInspRealizada: boolean, tieneDictamen: boolean): number {
  if (['aprobado', 'cerrado'].includes(status)) return 5
  if (tieneDictamen || status === 'revision') return 4
  if (tieneInspRealizada) return 3
  if (tieneInspProgramada) return 2
  return 1
}

export default async function ClientePortal({
  searchParams,
}: {
  searchParams: { preview?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  const esStaff = ROLES_STAFF.includes(usuario?.rol ?? '')
  const previewClienteId = searchParams.preview

  // Staff con preview=clienteId → modo previsualización
  if (esStaff && !previewClienteId) redirect('/dashboard/inspector/clientes')
  if (!esStaff && usuario?.rol !== 'cliente') redirect('/dashboard')

  // Obtener el registro de cliente
  let clienteRecord: { id: string; nombre: string; ciudad?: string; estado?: string } | null = null

  if (esStaff && previewClienteId) {
    // Staff previewando un cliente específico
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, ciudad, estado')
      .eq('id', previewClienteId)
      .maybeSingle()
    clienteRecord = data
  } else {
    // Cliente real — buscar por usuario_id
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, ciudad, estado')
      .eq('usuario_id', user.id)
      .maybeSingle()
    clienteRecord = data
  }

  // Para staff en modo preview usamos service client (bypass RLS completo)
  // Para clientes reales el supabase normal respeta sus políticas
  const db = esStaff ? await createServiceClient() : supabase

  const EXP_SELECT = `
    id, numero_folio, kwp, ciudad, estado_mx, status, fecha_inicio,
    cli_marca_paneles, cli_modelo_paneles, cli_num_paneles, cli_potencia_panel_wp,
    cli_marca_inversor, cli_modelo_inversor, cli_capacidad_kw, cli_num_inversores,
    cli_num_medidor, cli_direccion, cli_completado_at,
    folio:folios_lista_control(numero_folio),
    inspecciones:inspecciones_agenda(status, fecha_hora),
    dictamenes(id),
    documentos_cliente:documentos_expediente(tipo, subido_por_cliente)
  `

  // ── Paso 1: expedientes directamente vinculados por cliente_id ───────────
  const { data: expDirectos } = clienteRecord
    ? await db
        .from('expedientes')
        .select(EXP_SELECT)
        .eq('cliente_id', clienteRecord.id)
        .order('fecha_inicio', { ascending: false })
    : { data: [] }

  // ── Paso 2: expedientes vía solicitud (cubre cliente_id null en expediente)
  // Busca solicitudes donde PSE aparece como cliente_epc_id o cliente_id
  const { data: solicitudesConFolio } = clienteRecord
    ? await db
        .from('solicitudes_folio')
        .select('folio_asignado_id')
        .or(`cliente_id.eq.${clienteRecord.id},cliente_epc_id.eq.${clienteRecord.id}`)
        .not('folio_asignado_id', 'is', null)
    : { data: [] }

  const folioIds = (solicitudesConFolio ?? [])
    .map((s: any) => s.folio_asignado_id)
    .filter(Boolean)

  const idsYaVistos = new Set((expDirectos ?? []).map((e: any) => e.id))

  const { data: expViaFolio } = folioIds.length > 0
    ? await db
        .from('expedientes')
        .select(EXP_SELECT)
        .in('folio_id', folioIds)
        .order('fecha_inicio', { ascending: false })
    : { data: [] }

  // Merge evitando duplicados
  const lista = [
    ...(expDirectos ?? []),
    ...(expViaFolio ?? []).filter((e: any) => !idsYaVistos.has(e.id)),
  ]

  // ── Solicitudes sin folio aún (pendientes / en revisión) ─────────────────
  const { data: solicitudesPendientes } = clienteRecord
    ? await db
        .from('solicitudes_folio')
        .select('id, cliente_nombre, kwp, ciudad, estado_mx, status, created_at, fecha_estimada')
        .or(`cliente_id.eq.${clienteRecord.id},cliente_epc_id.eq.${clienteRecord.id}`)
        .is('folio_asignado_id', null)
        .not('status', 'in', '("rechazada")')
        .order('created_at', { ascending: false })
    : { data: [] }

  const solicitudes = solicitudesPendientes ?? []


  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">

      {/* Banner staff preview */}
      {esStaff && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <Eye className="w-4 h-4 shrink-0" />
            <span>
              Estás viendo el portal como{' '}
              <span className="font-semibold">{clienteRecord?.nombre ?? 'este cliente'}</span>
            </span>
          </div>
          <Link
            href={`/dashboard/inspector/clientes/${previewClienteId}`}
            className="text-xs text-amber-700 font-semibold hover:underline shrink-0"
          >
            ← Volver al perfil
          </Link>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Proyectos</h1>
            <p className="text-gray-500 text-sm">
              {clienteRecord?.nombre ?? usuario?.nombre ?? user.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sin cuenta vinculada ── */}
      {!clienteRecord && (
        <div className="card text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Sin proyectos asignados</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Tu inspector vinculará tu cuenta en cuanto tu expediente esté en proceso.
            Puedes contactarlos directamente si tienes preguntas.
          </p>
        </div>
      )}

      {/* ── Sin nada ── */}
      {clienteRecord && lista.length === 0 && solicitudes.length === 0 && (
        <div className="card text-center py-16">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">Sin expedientes activos</p>
          <p className="text-sm text-gray-400 mt-1">
            {esStaff
              ? 'Este cliente aún no tiene expedientes registrados.'
              : 'Regresa pronto — tu inspector lo activará en breve.'}
          </p>
        </div>
      )}

      {/* ── Solicitudes pendientes de folio ── */}
      {solicitudes.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Solicitudes en proceso
          </h2>
          {solicitudes.map((sol) => {
            const statusLabel =
              sol.status === 'pendiente'   ? 'Solicitud recibida' :
              sol.status === 'en_revision' ? 'En revisión' :
              sol.status === 'aprobada'    ? 'Folio en asignación' :
              sol.status
            const statusColor =
              sol.status === 'pendiente'   ? 'bg-yellow-100 text-yellow-700' :
              sol.status === 'en_revision' ? 'bg-blue-100 text-blue-700' :
              sol.status === 'aprobada'    ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'

            return (
              <div key={sol.id} className="card border-l-4 border-l-yellow-400">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-700 text-sm">
                        Folio pendiente de asignación
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {sol.kwp && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {sol.kwp} kWp
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {(sol.ciudad || sol.estado_mx) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[sol.ciudad, sol.estado_mx].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {sol.fecha_estimada && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Fecha estimada:{' '}
                          {new Date(sol.fecha_estimada + 'T12:00:00').toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lista de proyectos ── */}
      {lista.length > 0 && (
        <div className="space-y-4">
          {solicitudes.length > 0 && (
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Expedientes activos
            </h2>
          )}
          {lista.map((exp) => {
            const folio = exp.folio as any
            const inspecciones = (exp.inspecciones as any[]) ?? []
            const dictamenes = (exp.dictamenes as any[]) ?? []

            const folioNum: string = folio?.numero_folio ?? exp.numero_folio ?? '—'
            const tieneInspProgramada = inspecciones.some((i) =>
              ['programada', 'en_curso', 'realizada'].includes(i.status)
            )
            const tieneInspRealizada = inspecciones.some((i) => i.status === 'realizada')
            const tieneDictamen = dictamenes.length > 0
            const paso = calcularPaso(exp.status, tieneInspProgramada, tieneInspRealizada, tieneDictamen)
            const { porcentaje, camposFilled, docsFilled } = calcularProgreso(exp)
            const mostrarProgreso = ['borrador', 'en_proceso'].includes(exp.status)

            const proxima = inspecciones
              .filter((i) => i.status === 'programada' && new Date(i.fecha_hora) > new Date())
              .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())[0]

            const st = STATUS_CLIENTE[exp.status] ?? { label: exp.status, color: 'bg-gray-100 text-gray-600' }

            // En modo preview, el link lleva al detalle con el param de preview también
            const detailHref = esStaff
              ? `/dashboard/cliente/${exp.id}?preview=${previewClienteId}`
              : `/dashboard/cliente/${exp.id}`

            return (
              <div key={exp.id} className="card hover:shadow-md transition-shadow">
                {/* Zona clickeable hacia el detalle */}
                <Link href={detailHref} className="block group">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="font-mono font-bold text-brand-green text-lg">{folioNum}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                        {exp.kwp && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {exp.kwp} kWp
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-green mt-1 transition-colors flex-shrink-0" />
                  </div>

                  {/* Mini stepper */}
                  <MiniStepper pasoActual={paso} />

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {(exp.ciudad || exp.estado_mx) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[exp.ciudad, exp.estado_mx].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {proxima && (
                      <span className="flex items-center gap-1 text-brand-green font-medium">
                        <Calendar className="w-3 h-3" />
                        Próx. inspección:{' '}
                        {new Date(proxima.fecha_hora).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    )}
                    {['aprobado', 'cerrado'].includes(exp.status) && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Expediente completado
                      </span>
                    )}
                  </div>
                </Link>

                {/* Barra de progreso de precarga — fuera del Link para evitar navegación */}
                {mostrarProgreso && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">
                        {porcentaje === 0
                          ? 'Pendiente de subir información'
                          : porcentaje === 100
                          ? 'Información completa ✓'
                          : `Información subida — ${porcentaje}%`}
                      </span>
                      <span className="text-gray-400">
                        {camposFilled}/10 campos · {docsFilled}/6 docs
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={[
                          'h-full rounded-full transition-all duration-500',
                          porcentaje === 100
                            ? 'bg-brand-green'
                            : porcentaje >= 60
                            ? 'bg-blue-500'
                            : porcentaje >= 30
                            ? 'bg-brand-orange'
                            : 'bg-gray-300',
                        ].join(' ')}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <NotificarBtn
                      expedienteId={exp.id}
                      notificadoAt={(exp as any).cli_completado_at ?? null}
                      porcentaje={porcentaje}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Progreso de precarga ─────────────────────────────────────────────────────

const CAMPOS_REQUERIDOS = [
  'cli_marca_paneles', 'cli_modelo_paneles', 'cli_num_paneles', 'cli_potencia_panel_wp',
  'cli_marca_inversor', 'cli_modelo_inversor', 'cli_capacidad_kw', 'cli_num_inversores',
  'cli_num_medidor', 'cli_direccion',
] as const

const TIPOS_DOC_REQUERIDOS = [
  'diagrama', 'certificado_inversor', 'dictamen_uvie',
  'oficio_resolutivo', 'recibo_cfe', 'ine_participante',
]

function calcularProgreso(exp: any): { porcentaje: number; camposFilled: number; docsFilled: number } {
  const totalCampos = CAMPOS_REQUERIDOS.length       // 10
  const totalDocs   = TIPOS_DOC_REQUERIDOS.length    // 6

  const camposFilled = CAMPOS_REQUERIDOS.filter(k => {
    const v = exp[k]
    return v !== null && v !== undefined && v !== ''
  }).length

  const docsCliente  = ((exp.documentos_cliente ?? []) as any[]).filter((d: any) => d.subido_por_cliente)
  const tiposSubidos = new Set(docsCliente.map((d: any) => d.tipo))
  const docsFilled   = TIPOS_DOC_REQUERIDOS.filter(t => tiposSubidos.has(t)).length

  const porcentaje = Math.round((camposFilled + docsFilled) / (totalCampos + totalDocs) * 100)
  return { porcentaje, camposFilled, docsFilled }
}

// ─── Mini stepper ─────────────────────────────────────────────────────────────

const PASOS = ['Folio', 'Programado', 'Inspeccionado', 'En Revisión', 'Cerrado']

function MiniStepper({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="flex items-center gap-0">
      {PASOS.map((label, i) => {
        const n = i + 1
        const done = n < pasoActual
        const active = n === pasoActual
        return (
          <div key={n} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                done    ? 'bg-brand-green text-white'
                : active ? 'bg-brand-orange text-white ring-2 ring-brand-orange/30'
                : 'bg-gray-100 text-gray-400',
              ].join(' ')}>
                {done ? '✓' : n}
              </div>
              <span className={`text-[9px] mt-0.5 whitespace-nowrap font-medium ${
                done ? 'text-brand-green' : active ? 'text-brand-orange' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded ${done ? 'bg-brand-green' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
