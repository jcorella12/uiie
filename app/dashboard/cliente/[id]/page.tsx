import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowLeft, Zap, MapPin, Calendar, FileText,
  CheckCircle2, Circle, Clock, Award, Download, Eye,
} from 'lucide-react'
import ExpedientePrecarga from '@/components/cliente/ExpedientePrecarga'
import ClienteInfoTecnica from '@/components/cliente/ClienteInfoTecnica'
import ClienteInfoComplementaria from '@/components/cliente/ClienteInfoComplementaria'

// ─── Banner de previsualización para staff ────────────────────────────────────
function PreviewBanner({ clienteId, clienteNombre }: { clienteId: string; clienteNombre?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-2">
      <div className="flex items-center gap-2 text-amber-700 text-sm">
        <Eye className="w-4 h-4 shrink-0" />
        <span>
          Vista previa del portal —{' '}
          <span className="font-semibold">{clienteNombre ?? 'Cliente'}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs font-semibold text-amber-700">
        <Link href={`/dashboard/cliente?preview=${clienteId}`} className="hover:underline">
          ← Todos los proyectos
        </Link>
        <Link href={`/dashboard/inspector/clientes/${clienteId}`} className="hover:underline">
          Perfil del cliente →
        </Link>
      </div>
    </div>
  )
}

// ─── Pasos del proceso ────────────────────────────────────────────────────────

interface Paso {
  numero: number
  titulo: string
  descripcion: string
}

const PASOS: Paso[] = [
  { numero: 1, titulo: 'Folio Asignado',      descripcion: 'Se asignó un número de expediente a tu proyecto.' },
  { numero: 2, titulo: 'Inspección Agendada', descripcion: 'Un inspector visitará tu instalación.' },
  { numero: 3, titulo: 'Inspección Realizada',descripcion: 'La visita técnica fue completada exitosamente.' },
  { numero: 4, titulo: 'Revisión Técnica',    descripcion: 'El expediente está siendo evaluado por el equipo técnico.' },
  { numero: 5, titulo: 'Expediente Cerrado',  descripcion: 'Tu instalación fue aprobada y el expediente está completo.' },
]

const DICTAMEN_LABELS: Record<string, { label: string; color: string }> = {
  aprobado:    { label: 'Aprobado',    color: 'text-green-700 bg-green-100' },
  rechazado:   { label: 'Rechazado',   color: 'text-red-700 bg-red-100' },
  condicionado:{ label: 'Condicionado',color: 'text-orange-700 bg-orange-100' },
}

const DOCUMENTO_TIPO_LABELS: Record<string, string> = {
  contrato: 'Contrato', plano: 'Plano', memoria_tecnica: 'Memoria Técnica',
  dictamen: 'Dictamen', acta: 'Acta', fotografia: 'Fotografía', otro: 'Otro',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ROLES_STAFF = ['inspector', 'inspector_responsable', 'admin', 'auxiliar']

export default async function ProyectoDetalleCliente({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { preview?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esStaff = ROLES_STAFF.includes(usuario?.rol ?? '')
  const previewClienteId = searchParams.preview

  if (!esStaff && usuario?.rol !== 'cliente') redirect('/dashboard')

  // Para clientes reales: verificar que el expediente les pertenece
  let clienteRecord: { id: string; nombre: string } | null = null
  if (!esStaff) {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre')
      .eq('usuario_id', user.id)
      .maybeSingle()
    clienteRecord = data
    if (!clienteRecord) redirect('/dashboard/cliente')
  }

  // Obtener expediente (sin restricción de cliente aún)
  const { data: expediente } = await supabase
    .from('expedientes')
    .select(`
      id, numero_folio, kwp, ciudad, estado_mx, status,
      direccion_proyecto, colonia, municipio, codigo_postal,
      fecha_inicio, fecha_cierre, num_paneles, potencia_panel_wp,
      num_inversores, tipo_conexion, tipo_central, numero_medidor,
      capacidad_subestacion_kva,
      tiene_i1_i2, tiene_interruptor_exclusivo, tiene_ccfp, tiene_proteccion_respaldo,
      folio_id, cliente_id,
      cli_marca_paneles, cli_modelo_paneles, cli_num_paneles, cli_potencia_panel_wp,
      cli_inversor_id,
      cli_marca_inversor, cli_modelo_inversor, cli_capacidad_kw, cli_num_inversores,
      cli_num_medidor, cli_direccion, cli_notas, cli_completado_at,
      folio:folios_lista_control(numero_folio),
      inversor:inversores(marca, modelo, potencia_kw),
      inspector:usuarios!inspector_id(nombre, apellidos, email, telefono),
      cliente:clientes(
        id, nombre,
        firmante_nombre, firmante_curp, firmante_numero_ine, firmante_telefono, firmante_correo,
        atiende_nombre, atiende_numero_ine, atiende_telefono, atiende_correo
      )
    `)
    .eq('id', params.id)
    .single()

  if (!expediente) redirect(esStaff ? '/dashboard/inspector/clientes' : '/dashboard/cliente')

  // Para clientes: verificar que tienen acceso a este expediente
  // Acceso directo (cliente_id) o via solicitud (EPC o propietario)
  if (!esStaff && clienteRecord) {
    const tieneAccesoDirecto = await supabase
      .from('expedientes')
      .select('id')
      .eq('id', params.id)
      .eq('cliente_id', clienteRecord.id)
      .maybeSingle()
      .then(r => !!r.data)

    if (!tieneAccesoDirecto) {
      // Verificar acceso via solicitud vinculada al folio
      const { data: sol } = await supabase
        .from('solicitudes_folio')
        .select('id')
        .eq('folio_asignado_id', (expediente as any).folio_id)
        .or(`cliente_id.eq.${clienteRecord.id},cliente_epc_id.eq.${clienteRecord.id}`)
        .maybeSingle()

      if (!sol) redirect('/dashboard/cliente')
    }
  }

  const clienteId = (expediente as any).cliente_id ?? null

  // Participantes previos: testigos vinculados a expedientes de este cliente
  const testigos = clienteId ? await supabase
    .from('expediente_testigos')
    .select('testigo:testigos(id, nombre, apellidos, curp, clave_elector, numero_ine, telefono, email)')
    .in('expediente_id',
      (await supabase.from('expedientes').select('id').eq('cliente_id', clienteId)).data?.map(e => e.id) ?? []
    )
    .then(r => (r.data ?? []).map((row: any) => row.testigo).filter(Boolean))
    : []

  // También incluir firmante y atiende guardados en el registro del cliente
  const clienteData = (expediente as any).cliente as any
  const extrasCliente: any[] = []
  if (clienteData?.firmante_nombre) {
    extrasCliente.push({
      id:         `firmante-${clienteData.id}`,
      nombre:     clienteData.firmante_nombre,
      apellidos:  null,
      curp:       clienteData.firmante_curp ?? null,
      numero_ine: clienteData.firmante_numero_ine ?? null,
      clave_elector: null,
      telefono:   clienteData.firmante_telefono ?? null,
      email:      clienteData.firmante_correo ?? null,
    })
  }
  if (clienteData?.atiende_nombre) {
    extrasCliente.push({
      id:         `atiende-${clienteData.id}`,
      nombre:     clienteData.atiende_nombre,
      apellidos:  null,
      curp:       null,
      numero_ine: clienteData.atiende_numero_ine ?? null,
      clave_elector: null,
      telefono:   clienteData.atiende_telefono ?? null,
      email:      clienteData.atiende_correo ?? null,
    })
  }
  // Merge: testigos primero, extras del cliente solo si no son duplicados por nombre
  const participantesPrevios = [
    ...testigos,
    ...extrasCliente.filter(e =>
      !(testigos as any[]).some((t: any) =>
        t.nombre?.toLowerCase() === e.nombre?.toLowerCase() &&
        (t.numero_ine === e.numero_ine || (!t.numero_ine && !e.numero_ine))
      )
    ),
  ]

  const [
    { data: inspecciones },
    { data: dictamen },
    { data: documentos },
    { data: certificadosCNE },
  ] = await Promise.all([
    supabase
      .from('inspecciones_agenda')
      .select('id, fecha_hora, status, direccion')
      .eq('expediente_id', params.id)
      .order('fecha_hora', { ascending: true }),
    supabase
      .from('dictamenes')
      .select('id, resultado, fecha_emision, observaciones, norma_aplicable')
      .eq('expediente_id', params.id)
      .maybeSingle(),
    supabase
      .from('documentos_expediente')
      .select('id, nombre, tipo, created_at, storage_path')
      .eq('expediente_id', params.id)
      .eq('subido_por_cliente', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('certificados_cre')
      .select('id, numero_certificado, fecha_emision, url_cre, url_acuse')
      .eq('expediente_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  // Documentos subidos por el cliente
  const { data: clienteDocs } = await supabase
    .from('documentos_expediente')
    .select('id, nombre, tipo, created_at, storage_path')
    .eq('expediente_id', params.id)
    .eq('subido_por_cliente', true)
    .order('created_at', { ascending: false })

  const clienteDocsConUrl = await Promise.all(
    (clienteDocs ?? []).map(async (doc) => {
      if (!doc.storage_path) return { ...doc, publicUrl: null }
      const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.storage_path, 3600)
      return { ...doc, publicUrl: data?.signedUrl ?? null }
    })
  )

  const folio    = expediente.folio    as any
  const inversor = expediente.inversor as any
  const inspector= expediente.inspector as any
  const folioNum = folio?.numero_folio ?? expediente.numero_folio ?? '—'

  const insp        = inspecciones ?? []
  const tieneInspProgramada = insp.some((i) => ['programada', 'en_curso', 'realizada'].includes(i.status))
  const tieneInspRealizada  = insp.some((i) => i.status === 'realizada')
  const tieneDictamen       = !!dictamen

  const pasoActual =
    ['aprobado', 'cerrado'].includes(expediente.status) ? 5
    : tieneDictamen || expediente.status === 'revision' ? 4
    : tieneInspRealizada ? 3
    : tieneInspProgramada ? 2
    : 1

  // Próxima inspección futura
  const proxima = insp.find((i) =>
    i.status === 'programada' && new Date(i.fecha_hora) > new Date()
  )

  // Generar URLs firmadas de documentos (bucket privado)
  const docsConUrl = await Promise.all(
    (documentos ?? []).map(async (doc) => {
      if (!doc.storage_path) return { ...doc, publicUrl: null }
      const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.storage_path, 3600)
      return { ...doc, publicUrl: data?.signedUrl ?? null }
    })
  )

  // Nombre del cliente para el banner (solo cuando es staff)
  const { data: clienteParaBanner } = esStaff && previewClienteId
    ? await supabase.from('clientes').select('nombre').eq('id', previewClienteId).maybeSingle()
    : { data: null }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      {/* Banner staff preview */}
      {esStaff && previewClienteId && (
        <PreviewBanner clienteId={previewClienteId} clienteNombre={clienteParaBanner?.nombre} />
      )}

      {/* ── Back ── */}
      <Link
        href={esStaff && previewClienteId ? `/dashboard/cliente?preview=${previewClienteId}` : '/dashboard/cliente'}
        className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {esStaff ? 'Proyectos del cliente' : 'Mis Proyectos'}
      </Link>

      {/* ── Header ── */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="font-mono font-bold text-brand-green text-2xl tracking-wide">
              {folioNum}
            </span>
            <p className="text-gray-600 mt-1 text-sm flex items-center gap-1.5">
              {(expediente.ciudad || expediente.estado_mx) && (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  {[expediente.ciudad, expediente.estado_mx].filter(Boolean).join(', ')}
                </>
              )}
            </p>
          </div>
          <div className="text-right space-y-1">
            {expediente.kwp && (
              <div className="flex items-center gap-1 text-brand-green font-semibold justify-end">
                <Zap className="w-4 h-4" />
                <span>{expediente.kwp} kWp</span>
              </div>
            )}
            {expediente.num_paneles && (
              <p className="text-xs text-gray-500">{expediente.num_paneles} paneles fotovoltaicos</p>
            )}
            {inversor && (
              <p className="text-xs text-gray-500">{inversor.marca} {inversor.modelo}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stepper vertical ── */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Estado de tu Proyecto</h2>
        <div className="space-y-0">
          {PASOS.map((paso, i) => {
            const done   = paso.numero < pasoActual
            const active = paso.numero === pasoActual
            const last   = i === PASOS.length - 1
            return (
              <div key={paso.numero} className="flex gap-4">
                {/* Icono + línea */}
                <div className="flex flex-col items-center">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                    done   ? 'bg-brand-green text-white'
                    : active ? 'bg-brand-orange text-white ring-4 ring-brand-orange/20'
                    : 'bg-gray-100 text-gray-400',
                  ].join(' ')}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : active ? <Clock className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  {!last && (
                    <div className={`w-0.5 flex-1 my-1 ${done ? 'bg-brand-green' : 'bg-gray-200'}`} style={{ minHeight: 20 }} />
                  )}
                </div>
                {/* Contenido */}
                <div className="pb-5 flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${
                    done ? 'text-brand-green' : active ? 'text-brand-orange' : 'text-gray-400'
                  }`}>
                    {paso.titulo}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{paso.descripcion}</p>

                  {/* Info adicional por paso */}
                  {paso.numero === 1 && done && (
                    <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">
                      {folioNum}
                    </span>
                  )}
                  {paso.numero === 2 && proxima && active && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-orange font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(proxima.fecha_hora).toLocaleDateString('es-MX', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}
                  {paso.numero === 2 && proxima && done && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(proxima.fecha_hora).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </div>
                  )}
                  {paso.numero === 5 && done && dictamen && (
                    <div className="mt-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        DICTAMEN_LABELS[dictamen.resultado]?.color ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {DICTAMEN_LABELS[dictamen.resultado]?.label ?? dictamen.resultado}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Próxima inspección (destacada si es el paso actual) ── */}
      {proxima && pasoActual === 2 && (
        <div className="card border-l-4 border-brand-orange">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Próxima Inspección Agendada</p>
              <p className="text-brand-orange font-medium text-sm mt-0.5">
                {new Date(proxima.fecha_hora).toLocaleDateString('es-MX', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {proxima.direccion && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {proxima.direccion}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Asegúrate de estar disponible en la dirección indicada. El inspector se presentará con su credencial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Dictamen ── */}
      {dictamen && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-semibold text-gray-800">Resultado de la Revisión</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              DICTAMEN_LABELS[dictamen.resultado]?.color ?? 'bg-gray-100 text-gray-600'
            }`}>
              {DICTAMEN_LABELS[dictamen.resultado]?.label ?? dictamen.resultado}
            </span>
            {dictamen.fecha_emision && (
              <span className="text-xs text-gray-500">
                Emitido el {new Date(dictamen.fecha_emision).toLocaleDateString('es-MX', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
          </div>
          {dictamen.norma_aplicable && (
            <p className="text-xs text-gray-500 mt-2">Norma: {dictamen.norma_aplicable}</p>
          )}
          {dictamen.observaciones && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {dictamen.observaciones}
            </div>
          )}
        </div>
      )}

      {/* ── Información Técnica (read-only) ── */}
      <ClienteInfoTecnica data={{
        kwp:                      expediente.kwp,
        num_paneles:              expediente.num_paneles,
        potencia_panel_wp:        (expediente as any).potencia_panel_wp,
        inversor_marca:           inversor?.marca,
        inversor_modelo:          inversor?.modelo,
        num_inversores:           (expediente as any).num_inversores,
        tipo_conexion:            (expediente as any).tipo_conexion,
        numero_medidor:           (expediente as any).numero_medidor,
        capacidad_subestacion_kva: (expediente as any).capacidad_subestacion_kva,
        tiene_i1_i2:              (expediente as any).tiene_i1_i2,
        tiene_interruptor_exclusivo: (expediente as any).tiene_interruptor_exclusivo,
        tiene_ccfp:               (expediente as any).tiene_ccfp,
        tiene_proteccion_respaldo: (expediente as any).tiene_proteccion_respaldo,
        direccion_proyecto:       expediente.direccion_proyecto,
        colonia:                  (expediente as any).colonia,
        municipio:                (expediente as any).municipio,
        ciudad:                   expediente.ciudad,
        codigo_postal:            (expediente as any).codigo_postal,
        estado_mx:                expediente.estado_mx,
      }} />

      {/* ── Información Complementaria (editable por el cliente) ── */}
      <ClienteInfoComplementaria
        expedienteId={expediente.id}
        clienteId={clienteId}
        cliente={(expediente as any).cliente}
        participantesPrevios={participantesPrevios as any}
        isLocked={['revision', 'aprobado', 'cerrado'].includes(expediente.status)}
      />

      {/* ── Precarga del cliente ── */}
      <ExpedientePrecarga
        expedienteId={expediente.id}
        isLocked={['revision', 'aprobado', 'cerrado'].includes(expediente.status)}
        saved={expediente as any}
        clienteDocs={clienteDocsConUrl}
      />

      {/* ── Documentos ── */}
      {docsConUrl.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-semibold text-gray-800">Documentos de tu Expediente</h2>
          </div>
          <div className="space-y-2">
            {docsConUrl.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {DOCUMENTO_TIPO_LABELS[doc.tipo] ?? doc.tipo}
                    {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                {doc.publicUrl ? (
                  <a
                    href={doc.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-green hover:underline font-medium flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </a>
                ) : (
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    No disponible
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certificado CNE ── */}
      {(certificadosCNE ?? []).length > 0 && ['aprobado', 'cerrado'].includes(expediente.status) && (
        <div className="card border border-brand-green/30 bg-brand-green/5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-semibold text-gray-800">Certificado CNE</h2>
          </div>
          <div className="space-y-3">
            {(certificadosCNE ?? []).map((cert: any) => (
              <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-brand-green/20 px-4 py-3">
                <div className="space-y-0.5">
                  <p className="font-mono text-sm font-bold text-brand-green tracking-wide">
                    {cert.numero_certificado}
                  </p>
                  {cert.fecha_emision && (
                    <p className="text-xs text-gray-500">
                      Emitido el {new Date(cert.fecha_emision).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={cert.url_cre}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar certificado
                  </a>
                  {cert.url_acuse && (
                    <a
                      href={cert.url_acuse}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Acuse
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contacto del inspector ── */}
      {inspector && (
        <div className="card border border-brand-green/20 bg-brand-green-light/30">
          <p className="text-xs font-semibold text-brand-green uppercase tracking-wide mb-2">Tu Inspector</p>
          <p className="font-semibold text-gray-800">
            {inspector.nombre} {inspector.apellidos ?? ''}
          </p>
          <div className="mt-2 space-y-1">
            {inspector.email && (
              <a href={`mailto:${inspector.email}`}
                className="text-sm text-brand-green hover:underline block"
              >
                {inspector.email}
              </a>
            )}
            {inspector.telefono && (
              <a href={`tel:${inspector.telefono}`}
                className="text-sm text-gray-600 hover:underline block"
              >
                {inspector.telefono}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
