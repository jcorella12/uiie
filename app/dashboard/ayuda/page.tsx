import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  HelpCircle, ClipboardList, FileText, FolderOpen, Calendar,
  Users, Building2, BookUser, Award, Brain, Receipt, Archive,
  ChevronRight, AlertTriangle, CheckCircle2, Zap, Shield,
  Search, Lightbulb, BarChart3, Globe, MapPin,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AyudaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('rol, nombre').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const rol = perfil.rol
  const esCliente   = rol === 'cliente'
  const esAdmin     = ['admin', 'inspector_responsable'].includes(rol)
  const esInspector = ['inspector', 'auxiliar'].includes(rol)

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-20">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-brand-green-light rounded-xl flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de ayuda</h1>
          <p className="text-sm text-gray-500">Guía paso a paso de la plataforma CIAE</p>
        </div>
      </div>

      {/* Índice rápido */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Saltar a…</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { href: '#flujo',        icon: ClipboardList, label: 'Flujo general' },
            { href: '#secciones',    icon: FolderOpen,    label: 'Dónde va cada cosa' },
            { href: '#expediente',   icon: FileText,      label: 'Trabajar un expediente' },
            { href: '#documentos',   icon: Archive,       label: 'Documentos & ZIP' },
            { href: '#ia',           icon: Brain,         label: 'IA del sistema' },
            { href: '#status',       icon: CheckCircle2,  label: 'Estados y badges' },
            ...(esCliente   ? [{ href: '#cliente',    icon: Users, label: 'Para clientes' }] : []),
            ...(esInspector ? [{ href: '#inspector',  icon: Users, label: 'Para inspectores' }] : []),
            ...(esAdmin     ? [{ href: '#admin',      icon: Shield,label: 'Para admins' }] : []),
            ...((esInspector || esAdmin) ? [{ href: '#delegacion', icon: Users, label: 'Delegación de visitas' }] : []),
            { href: '#faq',          icon: HelpCircle,    label: 'FAQ' },
            { href: '#atajos',       icon: Lightbulb,     label: 'Tips' },
          ].map(({ href, icon: Icon, label }) => (
            <a key={href} href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-green hover:bg-brand-green-light/40 transition-colors text-sm">
              <Icon className="w-4 h-4 text-brand-green flex-shrink-0" />
              <span className="text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="flujo" icon={ClipboardList} title="Flujo general del proceso">
        <p className="text-sm text-gray-700 leading-relaxed">
          La plataforma maneja el ciclo completo de una inspección de sistema fotovoltaico,
          desde que el inspector solicita el folio hasta que se cierra con certificado CNE.
        </p>

        <ol className="mt-4 space-y-4 relative">
          <Paso n={1} titulo="Solicitud de folio" descripcion={
            <>El inspector crea una solicitud nueva con los datos del cliente y la potencia
            del sistema. El admin revisa y asigna un folio ({code('UIIE-NNN-YYYY')}).</>
          } />
          <Paso n={2} titulo="Programación de inspección" descripcion={
            <>Una vez con folio, el inspector programa la visita al sitio desde el expediente
            (botón "Programar inspección"). Asigna testigos del catálogo o crea nuevos.</>
          } />
          <Paso n={3} titulo="Captura de información" descripcion={
            <>Inspector llena Información Técnica (kWp, paneles, inversor, medidor, resolutivo,
            dictamen) e Información Complementaria (firmante, atiende visita, testigos).</>
          } />
          <Paso n={4} titulo="Carga de documentos" descripcion={
            <>Sube los documentos clave: contrato, plano, memoria técnica, acta firmada, ficha
            de pago (si aplica), evidencia fotográfica.</>
          } />
          <Paso n={5} titulo="Envío a revisión" descripcion={
            <>Cuando el checklist está al 100%, el inspector envía el paquete a CIAE para revisión.</>
          } />
          <Paso n={6} titulo="Aprobación y certificado" descripcion={
            <>El admin/responsable revisa, aprueba, y registra el certificado CNE (sube PDF, la IA
            extrae los datos automáticamente).</>
          } />
          <Paso n={7} titulo="Cierre y archivo" descripcion={
            <>Una vez emitido el certificado, el expediente se cierra. El inspector descarga el
            ZIP completo, lo archiva localmente, y a los 20 días se borran los archivos del servidor.</>
          } último />
        </ol>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="secciones" icon={FolderOpen} title="Dónde va cada cosa">
        <p className="text-sm text-gray-700 mb-4">
          Cada documento o dato tiene un lugar específico en el expediente. Esto permite generar
          automáticamente el ZIP organizado por carpetas para auditoría.
        </p>

        <div className="space-y-2">
          <Ubicacion icon={Zap}        carpeta="Información Técnica" lugar="Sección colapsable arriba del expediente">
            kWp · paneles · inversor · medidor CFE · subestación · protecciones · resolutivo · dictamen UVIE
          </Ubicacion>
          <Ubicacion icon={Users}      carpeta="Información Complementaria" lugar="Sección colapsable">
            Firmante del contrato · persona que atiende la visita · testigos · representante legal
          </Ubicacion>
          <Ubicacion icon={Calendar}   carpeta="Agenda" lugar="Sección dedicada">
            Inspecciones programadas · fechas · testigos asignados · inspector ejecutor
          </Ubicacion>
          <Ubicacion icon={CheckCircle2} carpeta="Checklist" lugar="Sección dedicada con %">
            12 puntos que se auto-llenan según los datos · debe estar al 100% para enviar a revisión
          </Ubicacion>
          <Ubicacion icon={FileText}   carpeta="Documentos" lugar="Sección con cards de IA + lista de Otros">
            Resolutivo · Plano · Memoria técnica · Dictamen UVIE · Acta · Ficha de pago · Fotografías
          </Ubicacion>
          <Ubicacion icon={Award}      carpeta="Certificado CNE" lugar="Sección que aparece al aprobarse">
            Sube el PDF del certificado, la IA lo lee y guarda automáticamente
          </Ubicacion>
        </div>

        {/* Estructura del ZIP */}
        <div className="mt-6 rounded-xl bg-gray-900 text-gray-300 p-4 font-mono text-xs overflow-x-auto">
          <p className="text-gray-500 mb-2">// Cuando se descarga el ZIP, queda así (estructura CRE):</p>
          <pre className="leading-relaxed">{`UIIE-513-2026.zip
├── resumen.txt                       ← Metadata completa
├── 1. OFICIO RESOLUTIVO CFE/         ← Resolutivo / oficio CENACE
├── 2. DICTAMEN DE VERIFICACIÓN/      ← Dictamen UVIE
├── 3. DU y MDC/                      ← Diagrama unifilar y memoria de cálculo
├── 4. CERTIFICADO INVERSOR/          ← Cert UL · u oficio CNE de homologación
├── 5. FOTOGRAFÍAS INSTALACIÓN/       ← Evidencia de visita
├── 6. IDENTIFICACIONES/              ← INE firmante + INEs testigos
├── 7. DOCUMENTOS/                    ← Acta, lista, contrato, recibos CFE
├── 8. COTIZACIÓN FACTURA/            ← Ficha de pago
├── 9. INFORME DE INSPECCIÓN/         ← Documento aparte (en construcción)
└── 10. OPE/                          ← Certificado CRE + Acuse`}</pre>
        </div>

        {/* Homologación de marca de inversor */}
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
          <p className="font-semibold text-emerald-900 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Homologación automática del inversor
          </p>
          <p className="text-emerald-800/90">
            Algunas marcas de inversor (p.ej. <strong>Huawei</strong>) cuentan con un oficio
            oficial de la CNE que reconoce el cumplimiento de la <strong>RES/142/2017</strong> mediante
            reportes alternos a UL 1741. Cuando el expediente tiene una marca homologada, el sistema:
          </p>
          <ul className="list-disc pl-5 text-emerald-800/90 space-y-1">
            <li>Sugiere la <strong>redacción exacta</strong> para la lista de verificación y el acta
              (con un botón "Copiar" en la sección de Información Técnica).</li>
            <li>Incluye automáticamente el oficio CNE y la carta del fabricante en la carpeta
              <code className="bg-white px-1 mx-1 rounded">4. CERTIFICADO INVERSOR</code> del ZIP.</li>
            <li>El admin puede registrar nuevas marcas homologadas desde la BD
              (<code className="bg-white px-1 rounded">inversor_homologaciones</code>).</li>
          </ul>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="expediente" icon={FileText} title="Cómo trabajar un expediente">
        <ol className="space-y-3 text-sm text-gray-700">
          <Tip>
            <strong>Empieza por la Info Técnica</strong> — abre la sección colapsable y captura kWp,
            paneles, inversor, medidor. La IA llena varios datos automáticamente cuando subes el plano,
            la memoria técnica o el oficio resolutivo.
          </Tip>
          <Tip>
            <strong>Sube documentos con IA</strong> — los 4 cards principales (Resolutivo, Plano, Memoria,
            Dictamen) usan IA para extraer datos y rellenar campos del expediente automáticamente.
          </Tip>
          <Tip>
            <strong>Programa la inspección</strong> — desde la sección Agenda, click en "Programar
            inspección". Si no tienes el testigo, créalo desde el picker en Información Complementaria.
          </Tip>
          <Tip>
            <strong>Vigila el checklist</strong> — el badge ámbar "Checklist {`{XX}`}%" arriba indica
            qué falta. Click en él para ir directamente a la sección.
          </Tip>
          <Tip>
            <strong>Cuando esté al 100%</strong> — usa el botón "Enviar a revisión" en la sección
            Revisión. CIAE recibirá el paquete y lo aprobará o devolverá con comentarios.
          </Tip>
        </ol>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="documentos" icon={Archive} title="Documentos descargables y respaldo ZIP">
        <p className="text-sm text-gray-700 mb-3">
          La plataforma genera documentos en Word listos para imprimir/firmar:
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          <DocumentoTipo nombre="Cotización" descripcion="Para enviar al cliente final" />
          <DocumentoTipo nombre="Contrato" descripcion="Servicio de inspección eléctrica" />
          <DocumentoTipo nombre="Plan de Inspección" descripcion="Documento técnico previo" />
          <DocumentoTipo nombre="Acta FO-12" descripcion="Se firma en la visita al sitio" />
          <DocumentoTipo nombre="Lista DACG" descripcion="Lista de verificación firmada" />
          <DocumentoTipo nombre="Paquete OPE" descripcion="Documento final unificado" />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
          <p className="font-semibold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Validación automática
          </p>
          <p className="text-amber-800">
            Si falta algún campo requerido (cliente, kWp, dirección, testigo, medidor, etc.), el botón
            del documento se bloquea y muestra exactamente qué falta. Puedes "Generar de todos modos"
            si necesitas un borrador, pero el documento saldrá incompleto.
          </p>
        </div>

        <h3 className="font-semibold text-gray-800 mt-5 mb-2 flex items-center gap-2">
          <Archive className="w-4 h-4 text-emerald-600" />
          Respaldo ZIP del expediente cerrado
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          Cuando el expediente está aprobado/cerrado y tiene certificado, aparece el botón
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
            <Archive className="w-3 h-3" /> ZIP
          </span>
          que descarga TODO el expediente organizado por carpetas.
        </p>

        <div className="rounded-xl border border-gray-200 p-4 text-sm">
          <p className="font-semibold text-gray-800 mb-2">Auto-borrado a 20 días</p>
          <ol className="space-y-1.5 text-gray-700 list-decimal pl-4">
            <li>Descargas el ZIP — aparece prompt de confirmación</li>
            <li>Confirmas "Sí, ya lo archivé localmente" → arranca el contador</li>
            <li>El badge cambia de color: 🟢 más de 10 días, 🟠 5-10 días, 🔴 menos de 5</li>
            <li>El día 17 recibes notificación "Se borrará en 3 días"</li>
            <li>El día 20 los archivos se borran del servidor (los registros se conservan)</li>
            <li>Puedes volver a descargar el ZIP en cualquier momento si no se ha borrado</li>
          </ol>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="ia" icon={Brain} title="Funciones con IA">
        <p className="text-sm text-gray-700 mb-3">
          La plataforma usa Claude (Anthropic) para extraer información automáticamente y reducir
          captura manual:
        </p>
        <div className="space-y-2">
          <IAFeature icono="📄" nombre="Lectura del Resolutivo CFE">
            Extrae folio, fecha, monto, referencia, zona CFE, kWp aprobada
          </IAFeature>
          <IAFeature icono="🔬" nombre="Lectura del Dictamen UVIE">
            Extrae folio DVNP, UVISE, vigencia, resultado, dirección del proyecto
          </IAFeature>
          <IAFeature icono="📐" nombre="Lectura del Plano / Diagrama">
            Extrae kWp total, paneles, marca/modelo del inversor, protecciones
          </IAFeature>
          <IAFeature icono="🧮" nombre="Lectura de Memoria Técnica">
            Datos técnicos, Isc, Voc, capacidad de subestación
          </IAFeature>
          <IAFeature icono="🪪" nombre="Lectura de INEs">
            OCR de credenciales — incluso rotadas o con frente y reverso en páginas separadas
          </IAFeature>
          <IAFeature icono="🏆" nombre="Lectura de Certificado CNE">
            Extrae número de certificado, fecha, folio interno UIIE-NNN-YYYY
          </IAFeature>
          <IAFeature icono="⚡" nombre="Lectura del Inversor (catálogo)">
            Extrae marca, modelo, potencia, fase, certificación de fichas técnicas
          </IAFeature>
          <IAFeature icono="🔢" nombre="OCR del Medidor CFE">
            Lee el número de servicio o medidor desde foto o PDF
          </IAFeature>
          <IAFeature icono="🔍" nombre="Revisión cruzada del paquete">
            Analiza todos los documentos del expediente y detecta inconsistencias
          </IAFeature>
        </div>

        {esAdmin && (
          <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm">
            <p className="font-semibold text-purple-900 mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Control de gasto
            </p>
            <p className="text-purple-800">
              En <Link href="/dashboard/ai-costos" className="underline font-medium">Gastos en IA</Link> {' '}
              puedes ver cuánto se ha gastado por endpoint, por usuario y por expediente. Cada
              llamada queda registrada con tokens y costo en USD.
            </p>
          </div>
        )}
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="status" icon={CheckCircle2} title="Estados y colores">
        <p className="text-sm text-gray-700 mb-3">
          Los expedientes pasan por varios estados visualmente diferenciados:
        </p>
        <div className="space-y-2">
          <StatusExp tono="gray"   label="Borrador"   desc="Expediente recién creado, sin folio asignado" />
          <StatusExp tono="blue"   label="En proceso" desc="Inspector trabajando en él" />
          <StatusExp tono="purple" label="En revisión" desc="Enviado a CIAE, esperando aprobación" />
          <StatusExp tono="amber"  label="Devuelto"   desc="CIAE devolvió con observaciones — corrige y reenvía" />
          <StatusExp tono="red"    label="Rechazado"  desc="Rechazo final — revisar motivos" />
          <StatusExp tono="green"  label="Aprobado"   desc="Listo para emitir certificado" />
          <StatusExp tono="green"  label="Cerrado"    desc="Certificado emitido, proceso terminado" />
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Devuelto vs Rechazado
          </p>
          <p className="text-gray-700">
            <span className="text-amber-700 font-medium">Devuelto (ámbar)</span> = corregible · puedes
            ajustar y reenviar.{' '}
            <span className="text-red-700 font-medium">Rechazado (rojo)</span> = rechazo más serio,
            requiere revisar a fondo los motivos.
          </p>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {esCliente && (
        <Section id="cliente" icon={Users} title="Guía para clientes">
          <p className="text-sm text-gray-700 mb-3">
            Como cliente final ves un portal simplificado para que el inspector pueda armar
            tu expediente con la menor fricción posible.
          </p>

          <h3 className="font-semibold text-gray-800 mt-4 mb-2">¿Qué tienes que hacer?</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal pl-5">
            <li><strong>Llena tus datos del firmante</strong> — nombre, INE (frente y reverso), CURP, teléfono, correo. La INE se procesa con OCR y rellena automáticamente.</li>
            <li><strong>Datos de quien atiende la visita</strong> — si es la misma persona que firma, marca la casilla; si no, captura nombre + INE + contacto.</li>
            <li><strong>Sube los documentos del proyecto</strong> — oficio resolutivo CFE, diagrama unifilar, memoria de cálculo, dictamen UVIE. Se guardan en tu expediente.</li>
            <li><strong>Marca "Información completa"</strong> — el inspector recibe una notificación y puede continuar el expediente.</li>
            <li><strong>Cuando se emita tu certificado CNE</strong>, podrás descargarlo desde tu portal.</li>
          </ol>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
            <p className="font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Importante
            </p>
            <ul className="text-amber-800 list-disc pl-5 space-y-1">
              <li>El sistema solo te deja ver y modificar <strong>tus propios proyectos</strong>.
                  No puedes subir información a un expediente que no es tuyo.</li>
              <li>Las fechas y horas de las visitas las programa el inspector — tú no necesitas
                  agendar nada.</li>
              <li>Si tu inversor es <strong>Huawei</strong>, el inspector ya tiene la documentación
                  de la CNE precargada que homologa su uso conforme a la RES/142/2017.</li>
            </ul>
          </div>
        </Section>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {(esInspector || esAdmin) && (
        <Section id="delegacion" icon={Users} title="Delegación de visitas (ejecutor)">
          <p className="text-sm text-gray-700 mb-3">
            En la unidad somos varios inspectores y a veces un folio asignado a uno se ejecuta
            físicamente por otro (por logística o disponibilidad). El sistema soporta esto con
            dos campos:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
            <li><strong>inspector_id</strong> = el dueño del folio (responsable para conciliación / pago).</li>
            <li><strong>inspector_ejecutor_id</strong> = el inspector que físicamente hace la visita.</li>
          </ul>
          <p className="text-sm text-gray-700 mt-3">
            Cuando son la misma persona, no necesitas configurar nada. Si delegas la visita, al
            crear la solicitud (o al programar la inspección) elige el ejecutor del dropdown.
            Tanto el inspector dueño como el ejecutor verán el expediente en su dashboard, en
            "Mis expedientes" y en su agenda.
          </p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            La conciliación y el pago siguen al <code className="bg-white px-1 rounded">inspector_id</code> (dueño del folio),
            no al ejecutor — ese acuerdo se maneja entre los dos inspectores fuera del sistema.
          </div>
        </Section>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="faq" icon={HelpCircle} title="Preguntas frecuentes">
        <FAQ q="¿Por qué la visita aparece a una hora distinta de la que capturé?">
          La hora se guarda en zona México (UTC-6, sin horario de verano). Si entras desde otro
          país verás la hora ajustada al uso horario de tu navegador, pero la hora oficial en
          el acta es la de México.
        </FAQ>
        <FAQ q="¿Qué hago si capturé un folio incorrecto?">
          Solo el admin / inspector_responsable puede liberar un folio mal asignado. Avísale
          para que ejecute "Recrear expediente" desde la sección Folios.
        </FAQ>
        <FAQ q="¿Puedo cambiar el cliente final de un expediente cerrado?">
          No. Una vez emitido el certificado, los datos del cliente final son los que reportamos
          a la CRE. Si hay un error, contacta al admin para corrección manual con auditoría.
        </FAQ>
        <FAQ q="¿Cómo sé si un cert CRE ya está emitido?">
          El expediente cambia a estado <span className="text-emerald-700 font-medium">Cerrado</span> con
          un badge verde con el número de certificado (UIIE-CC-NNNNN-YYYY). Aparece el botón
          ZIP para descargar el respaldo completo.
        </FAQ>
        <FAQ q="Mi inversor es Huawei pero no veo la redacción sugerida">
          Verifica que en Información Técnica hayas seleccionado un inversor Huawei del catálogo
          (no solo escrito "Huawei" en otro campo). La redacción aparece automáticamente debajo
          del selector de inversor.
        </FAQ>
        <FAQ q="¿Por qué me bloquea para enviar a revisión?">
          El checklist tiene que estar al 100%. Click en el badge "Checklist X%" para ver
          exactamente qué punto falta y qué dato lo desbloquea.
        </FAQ>
        <FAQ q="Subí un documento equivocado ¿cómo lo borro?">
          En la sección Documentos, cada archivo tiene un menú "⋮" con opción Borrar. Si el
          expediente ya está enviado a revisión, contacta al admin.
        </FAQ>
      </Section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {esInspector && (
        <Section id="inspector" icon={Users} title="Guía para inspectores">
          <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li><strong>Mi Dashboard</strong> — ver KPIs, expediente prioritario, próximas inspecciones. Las cards son clickables.</li>
            <li><strong>Mis Expedientes</strong> — todos tus expedientes ordenables por prioridad (drag & drop o ↑/↓). Botón ZIP para los cerrados.</li>
            <li><strong>Mi Agenda</strong> — calendario con todas las inspecciones programadas.</li>
            <li><strong>Solicitudes</strong> — crear nueva solicitud de folio para un cliente.</li>
            <li><strong>Clientes</strong> — catálogo de clientes para reutilizar en solicitudes.</li>
            <li><strong>Participantes</strong> — catálogo de testigos, firmantes y representantes.</li>
            <li><strong>Certificados</strong> — todos los certificados que has emitido, con búsqueda.</li>
            <li><strong>Inversores</strong> — catálogo común; agrega nuevos modelos con IA.</li>
            <li><strong>Conciliación</strong> — facturación mensual de tus expedientes cerrados.</li>
          </ul>
        </Section>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {esAdmin && (
        <Section id="admin" icon={Shield} title="Guía para administradores">
          <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li><strong>KPIs Globales</strong> — métricas de toda la organización (solo inspector_responsable)</li>
            <li><strong>Panel Admin</strong> — cola de solicitudes pendientes de asignación de folio</li>
            <li><strong>Solicitudes</strong> — revisar, aprobar o rechazar solicitudes</li>
            <li><strong>Asignar Folios</strong> — asignar folios a solicitudes aprobadas</li>
            <li><strong>Expedientes</strong> — vista con todos los expedientes filtrable por inspector</li>
            <li><strong>Usuarios</strong> — alta y gestión de inspectores/auxiliares/clientes</li>
            <li><strong>Certificados CRE</strong> — registro de certificados emitidos en la bóveda CNE</li>
            <li><strong>Conciliación / Pagos</strong> — control de facturas y pagos a inspectores</li>
            <li><strong>Gastos en IA</strong> — dashboard de costos de Claude API por usuario y expediente</li>
            <li><strong>Reporte Trimestral</strong> — exportable para CRE</li>
          </ul>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Permisos por rol
            </p>
            <ul className="text-amber-800 space-y-0.5 list-disc pl-4">
              <li><strong>admin</strong> — acceso total</li>
              <li><strong>inspector_responsable</strong> — casi todo, pero no puede crear/modificar admins</li>
              <li><strong>inspector</strong> — solo sus propios expedientes y solicitudes</li>
              <li><strong>auxiliar</strong> — apoya a un inspector específico, sin ver finanzas</li>
              <li><strong>cliente</strong> — solo ve sus proyectos vinculados</li>
            </ul>
          </div>
        </Section>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      <Section id="atajos" icon={Lightbulb} title="Tips y atajos">
        <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
          <li><strong>Búsqueda en pickers</strong> — al asignar testigos o firmantes puedes escribir parte del nombre, INE, empresa o teléfono. La lista se filtra en vivo.</li>
          <li><strong>Crear desde búsqueda</strong> — si la persona no existe en el catálogo, abajo del picker está el botón "+ Crear nuevo testigo".</li>
          <li><strong>Subir INE</strong> — desde el picker, opción "Subir INE" lee con OCR y rellena nombre, CURP, número INE, domicilio.</li>
          <li><strong>Auto-guardado</strong> — Información Complementaria guarda automáticamente 1.5s después de cualquier cambio. Verás "✓ Guardado" arriba.</li>
          <li><strong>Hot-reload del logo</strong> — si no ves el logo nuevo en la barra, recarga con <code className="bg-gray-100 px-1 rounded font-mono text-xs">Cmd+Shift+R</code>.</li>
          <li><strong>Notificaciones en tiempo real</strong> — la campana arriba a la derecha avisa cuando hay cambios en tus expedientes (Realtime de Supabase).</li>
        </ul>
      </Section>

      {/* Pie */}
      <div className="text-center pt-8 text-xs text-gray-400">
        <p>¿No encontraste lo que buscabas? Contacta al equipo de CIAE.</p>
        <p className="mt-1">UIIE-CRE-021 · Plataforma CIAE</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Helpers de presentación
// ═══════════════════════════════════════════════════════════════

function Section({
  id, icon: Icon, title, children,
}: { id: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-6">
      <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
        <span className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-green" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Paso({ n, titulo, descripcion, último = false }: {
  n: number; titulo: string; descripcion: React.ReactNode; último?: boolean
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center shadow-sm">
          {n}
        </div>
        {!último && <div className="w-0.5 flex-1 bg-brand-green/20 mt-1" style={{ minHeight: 24 }} />}
      </div>
      <div className="flex-1 pb-4">
        <p className="font-semibold text-gray-800 text-sm">{titulo}</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{descripcion}</p>
      </div>
    </li>
  )
}

function Ubicacion({ icon: Icon, carpeta, lugar, children }: {
  icon: any; carpeta: string; lugar: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
      <Icon className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <p className="font-semibold text-sm text-gray-800">{carpeta}</p>
          <p className="text-xs text-gray-400">{lugar}</p>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{children}</p>
      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm text-gray-700">
      <ChevronRight className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function DocumentoTipo({ nombre, descripcion }: { nombre: string; descripcion: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
      <p className="font-semibold text-gray-800">{nombre}</p>
      <p className="text-xs text-gray-500">{descripcion}</p>
    </div>
  )
}

function IAFeature({ icono, nombre, children }: { icono: string; nombre: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-purple-50/40 border border-purple-100">
      <span className="text-lg flex-shrink-0">{icono}</span>
      <div>
        <p className="font-semibold text-sm text-gray-800">{nombre}</p>
        <p className="text-xs text-gray-600">{children}</p>
      </div>
    </div>
  )
}

function StatusExp({ tono, label, desc }: { tono: string; label: string; desc: string }) {
  const colors: Record<string, string> = {
    gray:   'bg-gray-100 text-gray-700 border-gray-200',
    blue:   'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    amber:  'bg-amber-100 text-amber-800 border-amber-200',
    red:    'bg-red-100 text-red-800 border-red-200',
    green:  'bg-green-100 text-green-800 border-green-200',
  }
  return (
    <div className="flex items-center gap-3 py-1">
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[tono]} flex-shrink-0 min-w-[100px] text-center`}>
        {label}
      </span>
      <span className="text-sm text-gray-600">{desc}</span>
    </div>
  )
}

function code(s: string) {
  return <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">{s}</code>
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-gray-200 bg-white open:bg-gray-50 transition-colors">
      <summary className="px-3 py-2.5 cursor-pointer text-sm font-semibold text-gray-800 flex items-center justify-between">
        <span>{q}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform [details[open]_&]:rotate-90" />
      </summary>
      <div className="px-3 pb-3 pt-0 text-sm text-gray-600">{children}</div>
    </details>
  )
}
