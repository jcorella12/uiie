import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate, formatDateShort, tzForEstadoMx, EXPEDIENTE_STATUS_LABELS, INSPECCION_STATUS_LABELS } from '@/lib/utils'
import SubirDocumentosMasivo from '@/components/expedientes/SubirDocumentosMasivo'
import SubirDocumentoForm from '@/components/expedientes/SubirDocumentoForm'
import EliminarDocumentoBtn from '@/components/expedientes/EliminarDocumentoBtn'
import SubirDocumentoIA from '@/components/expedientes/SubirDocumentoIA'
import EvidenciaVisitaSection from '@/components/expedientes/EvidenciaVisitaSection'
import CertificadoSection from '@/components/expedientes/CertificadoSection'
import RevisionSection from '@/components/expedientes/RevisionSection'
import EnviarRevisionCTA from '@/components/expedientes/EnviarRevisionCTA'
import EditarFolioBtn from '@/components/expedientes/EditarFolioBtn'
import EliminarExpedienteBtn from '@/components/expedientes/EliminarExpedienteBtn'
import PrecioExpedienteCard from '@/components/expedientes/PrecioExpedienteCard'
import ContactarClienteBtn from '@/components/expedientes/ContactarClienteBtn'
import EliminarInspeccionBtn from '@/components/agenda/EliminarInspeccionBtn'
import DescargarRespaldoZip from '@/components/expedientes/DescargarRespaldoZip'
import CollapsibleCard from '@/components/ui/CollapsibleCard'
import { ExpedienteProgressBar } from '@/components/expedientes/ExpedienteProgressBar'
import { BotonesPDF } from '@/components/expedientes/BotonesPDF'
import { ChecklistRevision } from '@/components/expedientes/ChecklistRevision'
import MedidorCaptura from '@/components/ocr/MedidorCaptura'
import InfoTecnicaForm from '@/components/expedientes/InfoTecnicaForm'
import InfoComplementariaForm from '@/components/expedientes/InfoComplementariaForm'
import { StatusBadge, EXPEDIENTE_STATUS, INSPECCION_STATUS, DICTAMEN_RESULTADO } from '@/components/ui/StatusBadge'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Zap,
  Award,
  ChevronRight,
  Eye,
  ClipboardCheck,
  Camera,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOCUMENTO_TIPO_LABELS: Record<string, string> = {
  contrato:          'Contrato',
  plano:             'Plano',
  memoria_tecnica:   'Memoria Técnica',
  dictamen:          'Dictamen',
  acta:              'Acta',
  resolutivo:        'Resolutivo CFE',
  ficha_pago:        'Ficha de Pago',
  fotografia:        'Fotografía',
  certificado_cre:   'Certificado CNE',
  acuse_cre:         'Acuse CNE',
  evidencia_visita:  'Evidencia de Visita',
  otro:              'Otro',
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  icon,
  title,
  action,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div id={id} className="card scroll-mt-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <span className="text-brand-green">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800 flex-1">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExpedienteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = usuarioActual?.rol ?? 'inspector'
  const isAuxiliar = rol === 'auxiliar'
  const esAdmin = ['admin', 'inspector_responsable'].includes(rol)

  // Admins bypass RLS so they can view any inspector's expediente
  const db = esAdmin ? await createServiceClient() : supabase

  const { data: expediente } = await db
    .from('expedientes')
    .select(`
      *,
      cliente:clientes(*),
      folio:folios_lista_control(numero_folio),
      inversor:inversores!expedientes_inversor_id_fkey(marca, modelo, potencia_kw, fase)
    `)
    .eq('id', params.id)
    .single()

  if (!expediente) redirect('/dashboard/inspector/expedientes')

  const [
    { data: documentos },
    { data: inspecciones },
    { data: dictamen },
    { data: ultimoEnvio },
    { data: inversoresCatalogo },
    { data: expedienteTestigos },
    { data: testigosCatalogo },
    { data: certificadosCNE },
    { data: solicitudPrecio },
    { data: inversoresExpediente },
  ] = await Promise.all([
    db
      .from('documentos_expediente')
      .select('*')
      .eq('expediente_id', params.id)
      .order('created_at', { ascending: false }),
    db
      .from('inspecciones_agenda')
      .select('*, testigo:testigos(nombre, apellidos), inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos)')
      .eq('expediente_id', params.id)
      .order('fecha_hora', { ascending: true }),
    db
      .from('dictamenes')
      .select('*')
      .eq('expediente_id', params.id)
      .maybeSingle(),
    db
      .from('envios_revision')
      .select('*')
      .eq('expediente_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('inversores')
      .select('id, marca, modelo, potencia_kw, fase')
      .eq('activo', true)
      .order('marca'),
    db
      .from('expediente_testigos')
      .select('orden, testigo:testigos(id, nombre, apellidos, numero_ine, empresa)')
      .eq('expediente_id', params.id),
    supabase
      .from('testigos')
      .select('id, nombre, apellidos, numero_ine, empresa, telefono, email')
      .eq('activo', true)
      .order('nombre'),
    db
      .from('certificados_cre')
      .select('id, numero_certificado, fecha_emision, url_cre, url_acuse')
      .eq('expediente_id', params.id)
      .order('created_at', { ascending: false }),
    db
      .from('solicitudes_folio')
      .select('precio_propuesto, precio_historial')
      .eq('folio_asignado_id', (expediente as any).folio_id)
      .maybeSingle(),
    db
      .from('expediente_inversores')
      .select('id, orden, inversor_id, marca, modelo, cantidad, potencia_kw, certificacion, justificacion_ieee1547')
      .eq('expediente_id', params.id)
      .order('orden'),
  ])

  const cliente = expediente.cliente as any
  const folio = expediente.folio as any

  // Si es borrador SIN folio, mostramos placeholder claro en lugar de "—"
  const folioNumero: string =
    folio?.numero_folio ?? expediente.numero_folio ?? 'BORRADOR (sin folio asignado)'
  const sinFolioAsignado = !folio?.numero_folio && !expediente.numero_folio
  // TZ del estado donde ocurre la inspección (Sonora UTC-7, BC UTC-8, etc.)
  // para que todas las horas mostradas en el detalle del expediente
  // coincidan con las del Acta y con la realidad del inspector.
  const tzExpediente = tzForEstadoMx(expediente.estado_mx)

  // Inspector ejecutor de la próxima/última inspección (delegación)
  const ultimaInspeccion = (inspecciones ?? []).slice().reverse().find((i: any) =>
    ['programada', 'en_curso', 'realizada'].includes(i.status)
  ) as any | undefined
  const ejecutorActivo = ultimaInspeccion?.inspector_ejecutor as { nombre: string; apellidos?: string } | null

  // statusLabel/badge ahora se renderiza con <StatusBadge dictionary={EXPEDIENTE_STATUS} />
  const statusLabel = EXPEDIENTE_STATUS[expediente.status]?.label ?? expediente.status

  // Signed URL helper — bucket 'documentos' is private
  async function getPublicUrl(path: string) {
    const { data } = await db.storage.from('documentos').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }

  // Resolve public URLs for each document
  const documentosConUrl = await Promise.all(
    (documentos ?? []).map(async (doc: any) => ({
      ...doc,
      publicUrl: doc.storage_path ? (await getPublicUrl(doc.storage_path)) : null,
    }))
  )

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">

      {/* ── Back link ── */}
      <Link
        href="/dashboard/inspector/expedientes"
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Expedientes
      </Link>

      {/* ── Header card ── */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          {/* Left: folio + client */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              {sinFolioAsignado ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  📝 BORRADOR — Sin folio aún
                </span>
              ) : (
                <span className="font-mono text-xl font-bold text-brand-green tracking-wide">
                  {folioNumero}
                </span>
              )}
              {esAdmin && !sinFolioAsignado && (
                <EditarFolioBtn expedienteId={expediente.id} folioActual={folioNumero} />
              )}
              <StatusBadge status={expediente.status} dictionary={EXPEDIENTE_STATUS} size="sm" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {cliente?.nombre ?? '—'}
            </p>
            {sinFolioAsignado && (
              <p className="text-xs text-orange-700 mt-1">
                Puedes ir adelantando la info técnica. El folio se asignará cuando admin lo apruebe.
              </p>
            )}
          </div>

          {/* Right: meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <div className="flex flex-col items-end sm:items-start">
              <span className="text-xs text-gray-400 font-medium">kWp</span>
              <span className="font-semibold text-gray-800">{expediente.kwp ?? '—'}</span>
            </div>
            {expediente.ciudad && (
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-xs text-gray-400 font-medium">Ciudad</span>
                <span className="font-semibold text-gray-800">
                  {expediente.ciudad}
                  {expediente.estado_mx ? `, ${expediente.estado_mx}` : ''}
                </span>
              </div>
            )}
            {expediente.fecha_inicio && (
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-xs text-gray-400 font-medium">Inicio</span>
                <span className="font-semibold text-gray-800">
                  {formatDateShort(expediente.fecha_inicio)}
                </span>
              </div>
            )}
            {ejecutorActivo && (
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-xs text-gray-400 font-medium">Inspector visita</span>
                <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                  {`${ejecutorActivo.nombre} ${ejecutorActivo.apellidos ?? ''}`.trim()}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 leading-none">
                    delegado
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress stepper */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <ExpedienteProgressBar status={expediente.status} />
        </div>

        {/* Acciones del expediente — Contactar cliente disponible para
            cualquiera con acceso (inspector dueño o staff). Eliminar solo
            admin/responsable. */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 flex-wrap">
          <ContactarClienteBtn
            expedienteId={expediente.id}
            numeroFolio={folioNumero}
            clienteNombre={cliente?.nombre ?? expediente.nombre_cliente_final ?? '—'}
            clienteEmail={cliente?.email ?? cliente?.atiende_correo ?? cliente?.firmante_correo ?? null}
          />
          {esAdmin && (
            <EliminarExpedienteBtn
              expedienteId={expediente.id}
              numeroFolio={folioNumero}
              clienteNombre={cliente?.nombre ?? '—'}
              status={expediente.status}
              numDocumentos={(documentosConUrl ?? []).length}
            />
          )}
        </div>

        {/* Anchor nav tabs — scroll horizontal en móvil con snap; flex-wrap en desktop */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto sm:flex-wrap pb-1 sm:pb-0 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
            {[
              { href: '#info-tecnica', label: 'Info Técnica' },
              { href: '#info-complementaria', label: 'Info Compl.' },
              { href: '#agenda', label: 'Agenda' },
              { href: '#checklist', label: 'Checklist' },
              { href: '#evidencia', label: 'Evidencia' },
              ...(esAdmin && ['aprobado', 'cerrado'].includes(expediente.status) ? [{ href: '#certificado', label: 'Certificado' }] : []),
              { href: '#documentos', label: 'Documentos' },
              { href: '#revision', label: esAdmin ? 'Revisión' : 'Enviar a Revisión' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="snap-start whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full border border-brand-green/30 text-brand-green hover:bg-brand-green-light transition-colors flex-shrink-0"
              >
                {label}
              </a>
            ))}
          </div>
          {/* Indicador de checklist — clickable para ir al detalle */}
          {expediente.checklist_pct != null && (
            <a
              href="#checklist"
              title={
                expediente.checklist_pct >= 100
                  ? 'Checklist completo · Listo para enviar a revisión'
                  : `Checklist al ${expediente.checklist_pct}% · Click para ver qué falta`
              }
              className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:shadow-sm ${
                expediente.checklist_pct >= 100
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : expediente.checklist_pct > 0
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{expediente.checklist_pct >= 100 ? '✓' : '⚠'}</span>
              <span>Checklist {expediente.checklist_pct}%</span>
              {expediente.checklist_pct < 100 && (
                <span className="text-[10px] opacity-75 hidden sm:inline">· ver pendientes</span>
              )}
            </a>
          )}
        </div>
      </div>

      {/* ── CTA: Enviar a revisión (visible al tope para que no se pierda) ── */}
      {['borrador', 'en_proceso', 'devuelto'].includes(expediente.status) && (
        <EnviarRevisionCTA
          expedienteId={params.id}
          status={expediente.status}
          checklistPct={expediente.checklist_pct ?? 0}
          numDocumentos={(documentosConUrl ?? []).length}
          esAdmin={esAdmin}
          esInspector={
            expediente.inspector_id === user.id ||
            expediente.inspector_ejecutor_id === user.id
          }
          fueRechazado={ultimoEnvio?.decision === 'rechazado'}
        />
      )}

      {/* ── Sección 1: Información Técnica — colapsable ── */}
      <CollapsibleCard
        id="info-tecnica"
        icon={<Zap className="w-5 h-5" />}
        title="Información Técnica"
        defaultOpen={false}
        summary={[
          expediente.kwp ? `${expediente.kwp} kWp` : null,
          expediente.num_paneles ? `${expediente.num_paneles} paneles` : null,
          expediente.ciudad,
        ].filter(Boolean).join(' · ') || 'Sin capturar'}
      >
        <InfoTecnicaForm
          expediente={{
            id:                       params.id,
            nombre_cliente_final:     expediente.nombre_cliente_final ?? undefined,
            direccion_proyecto:       expediente.direccion_proyecto   ?? undefined,
            colonia:                  expediente.colonia              ?? undefined,
            codigo_postal:            expediente.codigo_postal        ?? undefined,
            municipio:                expediente.municipio            ?? undefined,
            ciudad:                   expediente.ciudad               ?? undefined,
            estado_mx:                expediente.estado_mx            ?? undefined,
            kwp:                      expediente.kwp                  ?? undefined,
            num_paneles:              expediente.num_paneles          ?? undefined,
            potencia_panel_wp:        expediente.potencia_panel_wp    ?? undefined,
            inversor_id:              expediente.inversor_id          ?? undefined,
            num_inversores:           expediente.num_inversores       ?? undefined,
            tipo_conexion:            expediente.tipo_conexion        ?? undefined,
            tipo_central:             expediente.tipo_central         ?? undefined,
            numero_medidor:           expediente.numero_medidor       ?? undefined,
            // Subestación
            capacidad_subestacion_kva: expediente.capacidad_subestacion_kva ?? undefined,
            // Protecciones
            tiene_i1_i2:              expediente.tiene_i1_i2              ?? false,
            tiene_interruptor_exclusivo: expediente.tiene_interruptor_exclusivo ?? false,
            tiene_ccfp:               expediente.tiene_ccfp           ?? false,
            tiene_proteccion_respaldo: expediente.tiene_proteccion_respaldo ?? false,
            resolutivo_folio:         expediente.resolutivo_folio     ?? undefined,
            resolutivo_fecha:         expediente.resolutivo_fecha     ?? undefined,
            resolutivo_tiene_cobro:   expediente.resolutivo_tiene_cobro ?? false,
            resolutivo_monto:         expediente.resolutivo_monto     ?? undefined,
            resolutivo_referencia:    expediente.resolutivo_referencia ?? undefined,
            dictamen_folio_dvnp:      expediente.dictamen_folio_dvnp  ?? undefined,
            dictamen_uvie_nombre:     expediente.dictamen_uvie_nombre ?? undefined,
            observaciones:            expediente.observaciones        ?? undefined,
          }}
          cliente={cliente ? {
            nombre:             cliente.nombre,
            firmante_nombre:    cliente.firmante_nombre,
            firmante_correo:    cliente.firmante_correo,
            firmante_telefono:  cliente.firmante_telefono,
            atiende_nombre:     cliente.atiende_nombre,
            atiende_correo:     cliente.atiende_correo,
            atiende_telefono:   cliente.atiende_telefono,
          } : undefined}
          inversores={inversoresCatalogo ?? []}
          inversoresExpediente={(inversoresExpediente ?? []).map((r: any) => ({
            id: r.id,
            inversor_id: r.inversor_id,
            marca: r.marca ?? '',
            modelo: r.modelo ?? '',
            cantidad: r.cantidad ?? 1,
            potencia_kw: r.potencia_kw ?? null,
            certificacion: r.certificacion ?? 'ul1741',
            justificacion_ieee1547: r.justificacion_ieee1547 ?? null,
          }))}
          readOnly={['cerrado', 'aprobado'].includes(expediente.status)}
        />

        {/* OCR Medidor — oculto cuando cerrado */}
        {expediente.status !== 'cerrado' && <details className="mt-5 border border-gray-100 rounded-xl overflow-hidden group">
          <summary className="cursor-pointer px-5 py-3.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors select-none flex items-center justify-between list-none">
            <span className="flex items-center gap-2">
              Leer número de medidor con IA
              {expediente.numero_medidor && (
                <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  {expediente.numero_medidor}
                </span>
              )}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
          </summary>
          <div className="p-5 border-t border-gray-100">
            <MedidorCaptura
              expedienteId={params.id}
              currentMedidor={expediente.numero_medidor}
            />
          </div>
        </details>}
      </CollapsibleCard>

      {/* ── Sección 1b: Información Complementaria — colapsable ── */}
      <CollapsibleCard
        id="info-complementaria"
        icon={<Users className="w-5 h-5" />}
        title="Información Complementaria"
        defaultOpen={false}
        summary={cliente
          ? [
              (cliente as any).firmante_nombre ? `Firmante: ${(cliente as any).firmante_nombre}` : null,
              (cliente as any).atiende_nombre ? `Atiende: ${(cliente as any).atiende_nombre}` : null,
            ].filter(Boolean).join(' · ') || 'Click para editar'
          : 'Click para editar'}
      >
        <InfoComplementariaForm
          expedienteId={params.id}
          cliente={cliente ? {
            id:                  cliente.id,
            nombre:              cliente.nombre,
            representante:       (cliente as any).representante,
            figura_juridica:     (cliente as any).figura_juridica,
            firmante_nombre:     cliente.firmante_nombre,
            firmante_curp:       (cliente as any).firmante_curp,
            firmante_numero_ine: (cliente as any).firmante_numero_ine,
            firmante_telefono:   cliente.firmante_telefono,
            firmante_correo:     cliente.firmante_correo,
            atiende_nombre:      cliente.atiende_nombre,
            atiende_numero_ine:  (cliente as any).atiende_numero_ine,
            atiende_telefono:    cliente.atiende_telefono,
            atiende_correo:      cliente.atiende_correo,
          } : null}
          testigo1={((expedienteTestigos ?? []).find((t: any) => t.orden === 1)?.testigo ?? null) as any}
          testigo2={((expedienteTestigos ?? []).find((t: any) => t.orden === 2)?.testigo ?? null) as any}
          testigos={(testigosCatalogo ?? []) as any[]}
          // Correo CFE: usa el del expediente; si está vacío, fallback al del cliente.
          correoCfe={(expediente as any).correo_cfe ?? (cliente as any)?.correo_cfe ?? null}
          readOnly={['cerrado', 'aprobado'].includes(expediente.status)}
        />
      </CollapsibleCard>

      {/* ── Precio del expediente — editable después de asignar folio ── */}
      {!sinFolioAsignado && (
        <PrecioExpedienteCard
          expedienteId={params.id}
          precioActual={(solicitudPrecio as any)?.precio_propuesto ?? null}
          historial={(solicitudPrecio as any)?.precio_historial ?? []}
          readOnly={expediente.status === 'cerrado'}
        />
      )}

      {/* ── Sección 2: Agenda de Inspecciones ── */}
      <Section
        id="agenda"
        icon={<Calendar className="w-5 h-5" />}
        title="Agenda de Inspecciones"
        action={expediente.status !== 'cerrado' && (
          <Link
            href={`/dashboard/inspector/agenda/nueva?expediente_id=${params.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            Programar inspección
          </Link>
        )}
      >
        {!inspecciones?.length ? (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600 mb-1">Sin inspecciones programadas</p>
            <p className="text-xs text-gray-400 mb-4">Programa la primera visita al sitio</p>
            {expediente.status !== 'cerrado' && (
              <Link
                href={`/dashboard/inspector/agenda/nueva?expediente_id=${params.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                Programar inspección
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Banner: próxima inspección programada */}
            {(() => {
              const ahora = Date.now()
              const proxima = (inspecciones ?? [])
                .filter((i: any) => i.fecha_hora && new Date(i.fecha_hora).getTime() >= ahora && ['programada', 'en_curso'].includes(i.status))
                .sort((a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())[0]
              if (!proxima) return null

              const fecha = new Date(proxima.fecha_hora)
              const diasRestantes = Math.ceil((fecha.getTime() - ahora) / (1000 * 60 * 60 * 24))
              const esHoy        = diasRestantes === 0
              const esMañana     = diasRestantes === 1
              const esEstaSemana = diasRestantes >= 0 && diasRestantes <= 7

              return (
                <div className={`mb-4 rounded-xl border-2 p-4 ${
                  esHoy ? 'border-orange-300 bg-orange-50' :
                  esEstaSemana ? 'border-emerald-200 bg-emerald-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      esHoy ? 'bg-orange-500' :
                      esEstaSemana ? 'bg-emerald-500' :
                      'bg-blue-500'
                    }`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${
                        esHoy ? 'text-orange-600' :
                        esEstaSemana ? 'text-emerald-600' :
                        'text-blue-600'
                      }`}>
                        {esHoy ? '⚡ Inspección hoy' :
                         esMañana ? 'Próxima inspección — mañana' :
                         esEstaSemana ? `Próxima inspección — en ${diasRestantes} días` :
                         'Próxima inspección programada'}
                      </p>
                      <p className="text-base font-bold text-gray-900 mt-0.5 capitalize">
                        {fecha.toLocaleDateString('es-MX', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                          timeZone: tzExpediente,
                        })}
                      </p>
                      <p className="text-sm text-gray-700 font-medium">
                        🕐 {fecha.toLocaleTimeString('es-MX', {
                          hour: '2-digit', minute: '2-digit',
                          timeZone: tzExpediente,
                        })} hrs
                      </p>
                      {proxima.direccion && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {proxima.direccion}
                        </p>
                      )}
                      {(proxima.testigo || proxima.inspector_ejecutor) && (
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                          {proxima.inspector_ejecutor && (
                            <span>
                              <span className="text-gray-400">Inspector:</span>{' '}
                              <span className="font-medium">{`${(proxima.inspector_ejecutor as any).nombre} ${(proxima.inspector_ejecutor as any).apellidos ?? ''}`.trim()}</span>
                            </span>
                          )}
                          {proxima.testigo && (
                            <span>
                              <span className="text-gray-400">Testigo:</span>{' '}
                              <span className="font-medium">{`${(proxima.testigo as any).nombre} ${(proxima.testigo as any).apellidos ?? ''}`.trim()}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={proxima.status} dictionary={INSPECCION_STATUS} size="sm" />
                  </div>
                </div>
              )
            })()}

            {/* Móvil: cards apiladas */}
            <div className="sm:hidden space-y-2">
              {inspecciones.map((insp: any) => {
                const testigo = insp.testigo as any
                const ejecutor = insp.inspector_ejecutor as { nombre: string; apellidos?: string } | null
                return (
                  <div key={insp.id} className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm text-gray-800">
                        {insp.fecha_hora
                          ? new Date(insp.fecha_hora).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : 'Fecha pendiente'}
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={insp.status} dictionary={INSPECCION_STATUS} size="xs" />
                        <EliminarInspeccionBtn
                          inspeccionId={insp.id}
                          bloqueado={!!expediente.numero_certificado || expediente.status === 'cerrado' || insp.status === 'realizada'}
                          bloqueadoMotivo={
                            expediente.numero_certificado
                              ? 'Certificado ya emitido en CNE'
                              : expediente.status === 'cerrado'
                              ? 'Expediente cerrado'
                              : insp.status === 'realizada'
                              ? 'Inspección ya realizada'
                              : undefined
                          }
                          size="xs"
                        />
                      </div>
                    </div>
                    {insp.direccion && (
                      <p className="text-xs text-gray-500 mb-1.5">📍 {insp.direccion}</p>
                    )}
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      {ejecutor && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400">Inspector:</span>
                          {`${ejecutor.nombre} ${ejecutor.apellidos ?? ''}`.trim()}
                          <span className="text-[9px] font-semibold px-1 rounded bg-amber-100 text-amber-700">delegado</span>
                        </span>
                      )}
                      {testigo && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400">Testigo:</span>
                          {`${testigo.nombre} ${testigo.apellidos ?? ''}`.trim()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-2 font-medium text-gray-500">Fecha y hora</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-500">Dirección</th>
                    <th className="text-center py-2.5 px-2 font-medium text-gray-500">Estado</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-500">Inspector</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-500">Testigo</th>
                    <th className="text-center py-2.5 px-2 font-medium text-gray-500 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {inspecciones.map((insp: any) => {
                    const testigo = insp.testigo as any
                    const ejecutor = insp.inspector_ejecutor as { nombre: string; apellidos?: string } | null
                    return (
                      <tr key={insp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-2 text-gray-800 whitespace-nowrap">
                          {insp.fecha_hora
                            ? new Date(insp.fecha_hora).toLocaleDateString('es-MX', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-gray-600 max-w-[200px] truncate">
                          {insp.direccion ?? '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <StatusBadge status={insp.status} dictionary={INSPECCION_STATUS} size="sm" />
                        </td>
                        <td className="py-2.5 px-2 text-gray-600">
                          {ejecutor ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span>{`${ejecutor.nombre} ${ejecutor.apellidos ?? ''}`.trim()}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">
                                delegado
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-gray-600">
                          {testigo
                            ? `${testigo.nombre} ${testigo.apellidos ?? ''}`.trim()
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <EliminarInspeccionBtn
                            inspeccionId={insp.id}
                            bloqueado={!!expediente.numero_certificado || expediente.status === 'cerrado' || insp.status === 'realizada'}
                            bloqueadoMotivo={
                              expediente.numero_certificado
                                ? 'Certificado ya emitido en CNE'
                                : expediente.status === 'cerrado'
                                ? 'Expediente cerrado'
                                : insp.status === 'realizada'
                                ? 'Inspección ya realizada'
                                : undefined
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Botón programar movido al header de la sección (action prop) */}
      </Section>

      {/* ── Sección 4: Checklist de Revisión ── */}
      <div id="checklist" className="scroll-mt-6">
        <ChecklistRevision
          expedienteId={params.id}
          readOnly={expediente.status === 'cerrado' || expediente.status === 'aprobado'}
          expediente={{
            resolutivo_folio:       expediente.resolutivo_folio       ?? null,
            resolutivo_fecha:       expediente.resolutivo_fecha       ?? null,
            resolutivo_tiene_cobro: expediente.resolutivo_tiene_cobro ?? null,
            resolutivo_monto:       expediente.resolutivo_monto       ?? null,
            resolutivo_referencia:  expediente.resolutivo_referencia  ?? null,
            numero_medidor:         expediente.numero_medidor         ?? null,
            kwp:                    expediente.kwp                    ?? null,
            dictamen_folio_dvnp:    expediente.dictamen_folio_dvnp    ?? null,
            inversor_id:            expediente.inversor_id            ?? null,
          }}
          documentosTipos={(documentos ?? []).map((d: any) => d.tipo)}
          tieneTestigos={(expedienteTestigos ?? []).length > 0 || (inspecciones ?? []).some((i: any) => i.testigo_id)}
        />
      </div>

      {/* ── Sección: Evidencia de Visita ── */}
      <Section id="evidencia" icon={<Camera className="w-5 h-5" />} title="Evidencia de Visita">
        <EvidenciaVisitaSection
          expedienteId={params.id}
          evidencias={documentosConUrl.filter((d: any) => d.tipo === 'evidencia_visita')}
        />
      </Section>

      {/* ── Sección 5: Certificado CNE — visible para todos cuando está aprobado o cerrado ── */}
      {['aprobado', 'cerrado'].includes(expediente.status) && <Section id="certificado" icon={<Award className="w-5 h-5" />} title="Certificado CNE">
        <CertificadoSection
          expedienteId={params.id}
          numeroCertificado={expediente.numero_certificado ?? null}
          fechaEmision={expediente.fecha_emision_certificado ?? null}
          documentosCert={documentosConUrl.filter((d: any) =>
            d.tipo === 'certificado_cre' || d.tipo === 'acuse_cre'
          )}
          canEdit={esAdmin}
          certificadosCNE={(certificadosCNE ?? []) as any}
        />

        {/* ── Descarga de respaldo ZIP — disponible cuando hay certificado o expediente cerrado ── */}
        {(((certificadosCNE ?? []).length > 0) || expediente.status === 'cerrado') && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <DescargarRespaldoZip
              expedienteId={params.id}
              folioInterno={expediente.numero_folio}
              yaDescargadoEn={(expediente as any).respaldo_descargado_at ?? null}
              yaArchivadoEn={(expediente as any).respaldo_archivado_at ?? null}
            />
          </div>
        )}

        {/* Dictamen técnico — secundario */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Dictamen técnico interno
          </p>
          {dictamen ? (
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={dictamen.resultado} dictionary={DICTAMEN_RESULTADO} size="sm" />
              {dictamen.fecha_emision && (
                <span className="text-sm text-gray-500">
                  Emitido el {formatDate(dictamen.fecha_emision)}
                </span>
              )}
              <Link
                href={`/dashboard/inspector/expedientes/${params.id}/dictamen`}
                className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium ml-auto"
              >
                Ver dictamen <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              href={`/dashboard/inspector/expedientes/${params.id}/dictamen`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
            >
              Crear dictamen <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </Section>}

      {/* ── Sección 5: Documentos PDF — oculto cuando cerrado ── */}
      {expediente.status !== 'cerrado' && (
        <BotonesPDF
          expedienteId={params.id}
          folio={expediente.numero_folio}
          status={expediente.status}
          checklistPct={expediente.checklist_pct ?? 0}
          isAuxiliar={isAuxiliar}
          validacion={{
            cliente_nombre:    (cliente as any)?.nombre ?? expediente.nombre_cliente_final,
            firmante_nombre:   (cliente as any)?.firmante_nombre,
            firmante_curp:     (cliente as any)?.firmante_curp,
            atiende_nombre:    (cliente as any)?.atiende_nombre,
            kwp:               expediente.kwp,
            num_paneles:       expediente.num_paneles,
            potencia_panel_wp: expediente.potencia_panel_wp,
            marca_inversor:    (expediente as any).inversor ? `${(expediente as any).inversor.marca} ${(expediente as any).inversor.modelo}` : null,
            num_inversores:    expediente.num_inversores,
            numero_medidor:    expediente.numero_medidor,
            precio:            (solicitudPrecio as any)?.precio_propuesto ?? (expediente as any).precio_propuesto ?? null,
            tipo_conexion:     expediente.tipo_conexion,
            tipo_central:      expediente.tipo_central,
            direccion_proyecto: expediente.direccion_proyecto,
            ciudad:            expediente.ciudad,
            estado_mx:         expediente.estado_mx,
            resolutivo_folio:  expediente.resolutivo_folio,
            resolutivo_fecha:  expediente.resolutivo_fecha,
            dictamen_folio_dvnp: expediente.dictamen_folio_dvnp,
            tiene_i1_i2:                 expediente.tiene_i1_i2,
            tiene_interruptor_exclusivo: expediente.tiene_interruptor_exclusivo,
            tiene_ccfp:                  expediente.tiene_ccfp,
            tiene_proteccion_respaldo:   expediente.tiene_proteccion_respaldo,
            documentosTipos:   (documentos ?? []).map((d: any) => d.tipo),
            // Hay testigo si está asignado al expediente (expediente_testigos) o
            // si alguna inspección tiene testigo asignado directamente
            tieneTestigos:     (expedienteTestigos ?? []).length > 0
                               || (inspecciones ?? []).some((i: any) => i.testigo_id),
            tieneInspeccion:   (inspecciones ?? []).length > 0,
          }}
        />
      )}

      {/* ── Sección 6: Documentos — carga de archivos ── */}
      <Section id="documentos" icon={<FileText className="w-5 h-5" />} title="Documentos del expediente">

        {/* Documentos clave con extracción IA */}
        {/* Tipos del cliente que mapean a cada sección IA */}
        {/* plano ← diagrama | memoria_tecnica ← memoria_calculo | resolutivo ← oficio_resolutivo | dictamen ← dictamen_uvie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SubirDocumentoIA
            expedienteId={params.id}
            tipo="plano"
            existingDoc={documentosConUrl.find((d: any) => ['plano', 'diagrama'].includes(d.tipo)) ?? null}
            readOnly={expediente.status === 'cerrado'}
          />
          <SubirDocumentoIA
            expedienteId={params.id}
            tipo="memoria_tecnica"
            existingDoc={documentosConUrl.find((d: any) => ['memoria_tecnica', 'memoria_calculo'].includes(d.tipo)) ?? null}
            readOnly={expediente.status === 'cerrado'}
          />
          <SubirDocumentoIA
            expedienteId={params.id}
            tipo="resolutivo"
            existingDoc={documentosConUrl.find((d: any) => ['resolutivo', 'oficio_resolutivo'].includes(d.tipo)) ?? null}
            readOnly={expediente.status === 'cerrado'}
          />
          <SubirDocumentoIA
            expedienteId={params.id}
            tipo="dictamen"
            existingDoc={documentosConUrl.find((d: any) => ['dictamen', 'dictamen_uvie'].includes(d.tipo)) ?? null}
            readOnly={expediente.status === 'cerrado'}
          />
        </div>

        {/* ── Ficha de pago: solo si el resolutivo tiene cobro ── */}
        {expediente.resolutivo_tiene_cobro === true && (() => {
          const fichaPago = documentosConUrl.find((d: any) => d.tipo === 'ficha_pago')
          const yaSubida = !!fichaPago

          return (
            <div className={`mb-6 rounded-xl border-2 ${
              yaSubida
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-amber-300 bg-amber-50'
            } p-4`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 ${yaSubida ? 'bg-emerald-500' : 'bg-amber-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {yaSubida
                    ? <CheckCircle2 className="w-5 h-5 text-white" />
                    : <AlertTriangle className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${yaSubida ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {yaSubida ? 'Ficha de pago cargada' : 'Falta cargar la Ficha de Pago'}
                  </p>
                  <p className={`text-xs mt-0.5 ${yaSubida ? 'text-emerald-700' : 'text-amber-800'}`}>
                    El Resolutivo CFE incluye un cobro
                    {expediente.resolutivo_monto != null && (
                      <> de <strong>${Number(expediente.resolutivo_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></>
                    )}
                    {expediente.resolutivo_referencia && (
                      <> · Ref: <span className="font-mono">{expediente.resolutivo_referencia}</span></>
                    )}
                    . {yaSubida
                      ? 'El comprobante de pago ya está adjunto al expediente.'
                      : 'Es obligatorio adjuntar la ficha o comprobante de pago para completar el expediente.'}
                  </p>

                  {yaSubida && fichaPago && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{fichaPago.nombre}</span>
                      {fichaPago.publicUrl && (
                        <a href={fichaPago.publicUrl} target="_blank" rel="noopener noreferrer"
                          className="text-brand-green hover:underline ml-auto">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!yaSubida && expediente.status !== 'cerrado' && (
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <SubirDocumentoForm
                    expedienteId={params.id}
                    tipoDefecto="ficha_pago"
                    tiposPermitidos={['ficha_pago']}
                    tituloSeccion="Subir ficha de pago"
                  />
                </div>
              )}
            </div>
          )
        })()}

        <div className="border-t border-gray-100 pt-5 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Otros documentos</p>
        </div>

        {documentosConUrl.filter((d: any) => d.tipo !== 'evidencia_visita').length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {expediente.status === 'cerrado'
              ? 'No hay documentos registrados en este expediente.'
              : 'Sin documentos subidos. Usa el formulario de abajo para agregar.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Nombre</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Tipo</th>
                  <th className="text-right py-2.5 px-2 font-medium text-gray-500">Fecha</th>
                  <th className="text-right py-2.5 px-2 font-medium text-gray-500">Tamaño</th>
                  <th className="text-center py-2.5 px-2 font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {documentosConUrl.filter((d: any) => d.tipo !== 'evidencia_visita').map((doc: any) => (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-2 text-gray-800 font-medium max-w-[200px] truncate">
                      {doc.nombre}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="badge-en_revision text-xs">
                        {DOCUMENTO_TIPO_LABELS[doc.tipo] ?? doc.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">
                      {doc.created_at ? formatDateShort(doc.created_at) : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">
                      {doc.tamano_bytes != null
                        ? `${(doc.tamano_bytes / 1024).toFixed(1)} KB`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {doc.publicUrl ? (
                          <a
                            href={doc.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">N/A</span>
                        )}
                        {expediente.status !== 'cerrado' && (
                          <EliminarDocumentoBtn documentoId={doc.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Análisis IA — collapsible disclosure */}
        {documentosConUrl.some((d: any) => d.analisis_ia != null) && (
          <div className="mt-4 space-y-2">
            {documentosConUrl
              .filter((d: any) => d.analisis_ia != null)
              .map((doc: any) => (
                <details key={`ia-${doc.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors select-none">
                    Ver análisis IA — {doc.nombre}
                  </summary>
                  <pre className="p-4 text-xs text-gray-700 bg-white overflow-x-auto leading-relaxed">
                    {JSON.stringify(doc.analisis_ia, null, 2)}
                  </pre>
                </details>
              ))}
          </div>
        )}

        {/* Upload masivo — oculto cuando cerrado */}
        {expediente.status !== 'cerrado' && <SubirDocumentosMasivo expedienteId={params.id} />}
      </Section>

      {/* ── Sección 7: Enviar a revisión — último paso ── */}
      <Section
        id="revision"
        icon={<ClipboardCheck className="w-5 h-5" />}
        title={esAdmin ? 'Revisión del paquete documental' : 'Enviar expediente a revisión'}
      >
        <RevisionSection
          expedienteId={params.id}
          expedienteStatus={expediente.status}
          documentos={documentosConUrl.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            tipo: d.tipo,
            publicUrl: d.publicUrl,
            revisado: d.revisado ?? false,
            nota_revision: d.nota_revision ?? null,
            analisis_ia: d.analisis_ia ?? null,
          }))}
          ultimoEnvio={ultimoEnvio ?? null}
          esAdmin={esAdmin}
          folio={folioNumero}
          /*
           * "Certificado emitido" = el admin ya llenó el número oficial CNE
           * en la sección Certificado CNE del expediente. Esto es lo que
           * realmente queremos validar para habilitar el cierre — la tabla
           * central certificados_cre es opcional (registro global) y no
           * todos los expedientes pasan por ahí.
           *
           * Antes el check era (certificadosCNE ?? []).length > 0 lo que
           * dejaba expedientes sin poder cerrar aunque ya tuvieran número
           * y archivos cargados.
           */
          certificadoEmitido={
            !!(expediente as any).numero_certificado?.trim() ||
            (certificadosCNE ?? []).length > 0
          }
        />
      </Section>
    </div>
  )
}
