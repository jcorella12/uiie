import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate, formatDateShort, EXPEDIENTE_STATUS_LABELS, INSPECCION_STATUS_LABELS } from '@/lib/utils'
import SubirDocumentosMasivo from '@/components/expedientes/SubirDocumentosMasivo'
import EliminarDocumentoBtn from '@/components/expedientes/EliminarDocumentoBtn'
import SubirDocumentoIA from '@/components/expedientes/SubirDocumentoIA'
import EvidenciaVisitaSection from '@/components/expedientes/EvidenciaVisitaSection'
import CertificadoSection from '@/components/expedientes/CertificadoSection'
import RevisionSection from '@/components/expedientes/RevisionSection'
import { ExpedienteProgressBar } from '@/components/expedientes/ExpedienteProgressBar'
import { BotonesPDF } from '@/components/expedientes/BotonesPDF'
import { ChecklistRevision } from '@/components/expedientes/ChecklistRevision'
import MedidorCaptura from '@/components/ocr/MedidorCaptura'
import InfoTecnicaForm from '@/components/expedientes/InfoTecnicaForm'
import InfoComplementariaForm from '@/components/expedientes/InfoComplementariaForm'
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
} from 'lucide-react'

// ─── Badge helpers ────────────────────────────────────────────────────────────

const EXPEDIENTE_STATUS_BADGE: Record<string, string> = {
  borrador: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
  en_proceso: 'badge-en_revision',
  revision: 'badge-pendiente',
  aprobado: 'badge-aprobada',
  rechazado: 'badge-rechazada',
  devuelto: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
  cerrado: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
}

const INSPECCION_STATUS_BADGE: Record<string, string> = {
  programada: 'badge-pendiente',
  en_curso: 'badge-en_revision',
  realizada: 'badge-aprobada',
  cancelada: 'badge-rechazada',
}

const DICTAMEN_RESULTADO_BADGE: Record<string, string> = {
  aprobado: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
  rechazado: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
  condicionado: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
}
const DICTAMEN_RESULTADO_LABEL: Record<string, string> = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  condicionado: 'Condicionado',
}

const DOCUMENTO_TIPO_LABELS: Record<string, string> = {
  contrato:          'Contrato',
  plano:             'Plano',
  memoria_tecnica:   'Memoria Técnica',
  dictamen:          'Dictamen',
  acta:              'Acta',
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
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div id={id} className="card scroll-mt-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <span className="text-brand-green">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
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
      inversor:inversores(marca, modelo, potencia_kw, fase)
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
  ])

  const cliente = expediente.cliente as any
  const folio = expediente.folio as any

  const folioNumero: string =
    folio?.numero_folio ?? expediente.numero_folio ?? '—'

  // Inspector ejecutor de la próxima/última inspección (delegación)
  const ultimaInspeccion = (inspecciones ?? []).slice().reverse().find((i: any) =>
    ['programada', 'en_curso', 'realizada'].includes(i.status)
  ) as any | undefined
  const ejecutorActivo = ultimaInspeccion?.inspector_ejecutor as { nombre: string; apellidos?: string } | null

  const statusBadgeClass =
    EXPEDIENTE_STATUS_BADGE[expediente.status] ??
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
  const statusLabel =
    EXPEDIENTE_STATUS_LABELS[expediente.status as keyof typeof EXPEDIENTE_STATUS_LABELS] ??
    expediente.status

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
              <span className="font-mono text-xl font-bold text-brand-green tracking-wide">
                {folioNumero}
              </span>
              <span className={statusBadgeClass}>{statusLabel}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {cliente?.nombre ?? '—'}
            </p>
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

        {/* Anchor nav tabs */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center">
          {[
            { href: '#info-tecnica', label: 'Info Técnica' },
            { href: '#info-complementaria', label: 'Info Complementaria' },
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
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-brand-green/30 text-brand-green hover:bg-brand-green-light transition-colors"
            >
              {label}
            </a>
          ))}
          {/* Indicador de checklist */}
          {expediente.checklist_pct != null && (
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
              expediente.checklist_pct >= 100
                ? 'bg-green-100 text-green-700'
                : expediente.checklist_pct > 0
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              ✓ {expediente.checklist_pct}%
            </span>
          )}
        </div>
      </div>

      {/* ── Sección 1: Información Técnica ── */}
      <Section id="info-tecnica" icon={<Zap className="w-5 h-5" />} title="Información Técnica">
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
      </Section>

      {/* ── Sección 1b: Información Complementaria ── */}
      <Section id="info-complementaria" icon={<Users className="w-5 h-5" />} title="Información Complementaria">
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
          readOnly={['cerrado', 'aprobado'].includes(expediente.status)}
        />
      </Section>

      {/* ── Sección 2: Agenda de Inspecciones ── */}
      <Section id="agenda" icon={<Calendar className="w-5 h-5" />} title="Agenda de Inspecciones">
        {!inspecciones?.length ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Sin inspecciones programadas</p>
            <p className="text-xs mt-1">Programa la primera inspección usando el enlace de abajo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Fecha y hora</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Dirección</th>
                  <th className="text-center py-2.5 px-2 font-medium text-gray-500">Estado</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Inspector</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Testigo</th>
                </tr>
              </thead>
              <tbody>
                {inspecciones.map((insp: any) => {
                  const testigo = insp.testigo as any
                  const ejecutor = insp.inspector_ejecutor as { nombre: string; apellidos?: string } | null
                  const badgeClass =
                    INSPECCION_STATUS_BADGE[insp.status] ??
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
                  const statusLabel =
                    INSPECCION_STATUS_LABELS[insp.status as keyof typeof INSPECCION_STATUS_LABELS] ??
                    insp.status
                  return (
                    <tr key={insp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-2 text-gray-800 whitespace-nowrap">
                        {insp.fecha_hora
                          ? new Date(insp.fecha_hora).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-gray-600 max-w-[200px] truncate">
                        {insp.direccion ?? '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={badgeClass}>{statusLabel}</span>
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {expediente.status !== 'cerrado' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/inspector/agenda/nueva?expediente_id=${params.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
            >
              Programar inspección
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
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
          tieneTestigos={(inspecciones ?? []).some((i: any) => i.testigo_id)}
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

        {/* Dictamen técnico — secundario */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Dictamen técnico interno
          </p>
          {dictamen ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={
                DICTAMEN_RESULTADO_BADGE[dictamen.resultado] ??
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700'
              }>
                {DICTAMEN_RESULTADO_LABEL[dictamen.resultado] ?? dictamen.resultado}
              </span>
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
        />
      </Section>
    </div>
  )
}
