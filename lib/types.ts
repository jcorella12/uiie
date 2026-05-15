export type UserRole = 'inspector_responsable' | 'admin' | 'inspector' | 'auxiliar' | 'cliente'
export type TipoPersona = 'fisica' | 'moral'
export type SolicitudStatus = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'folio_asignado'
export type ExpedienteStatus = 'borrador' | 'en_proceso' | 'revision' | 'aprobado' | 'rechazado' | 'devuelto' | 'cerrado'
export type InspeccionStatus = 'programada' | 'en_curso' | 'realizada' | 'cancelada'
export type DocumentoTipo =
  | 'contrato' | 'plano' | 'memoria_tecnica' | 'dictamen'
  | 'acta' | 'lista_verificacion' | 'paquete_actas_listas'
  | 'resolutivo' | 'ficha_pago' | 'comprobante_pago'
  | 'fotografia' | 'evidencia_visita' | 'foto_medidor'
  | 'certificado_cre' | 'acuse_cre'
  | 'cotizacion' | 'plan_inspeccion' | 'recibo_cfe'
  // Tipos auditables que antes faltaban en el TS pero ya existían en la
  // BD enum. Sin esto los inspectores tenían que tagear como 'otro'
  // y los archivos terminaban en la carpeta equivocada del ZIP.
  | 'ine_participante' | 'certificado_inversor'
  | 'dictamen_uvie' | 'oficio_resolutivo'
  | 'diagrama' | 'memoria_calculo'
  | 'otro'
export type InversorFase = 'monofasico' | 'bifasico' | 'trifasico'

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellidos?: string
  telefono?: string
  rol: UserRole
  activo: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Inspector {
  id: string
  usuario_id: string
  numero_cedula?: string
  especialidad?: string
  firma_url?: string
  sello_url?: string
  max_expedientes_mes: number
  activo: boolean
  created_at: string
  updated_at: string
  usuario?: Usuario
}

export interface Cliente {
  id: string
  tipo_persona: TipoPersona
  nombre: string
  nombre_comercial?: string
  rfc?: string
  curp?: string
  representante?: string
  figura_juridica?: 'representante_legal' | 'gestor' | 'propietario'
  email?: string
  telefono?: string
  direccion?: string
  numero_exterior?: string
  numero_interior?: string
  colonia?: string
  cp?: string
  ciudad?: string
  municipio?: string
  estado?: string
  correo_cfe?: string
  es_epc: boolean
  // Quien firma el contrato
  firmante_mismo: boolean
  firmante_nombre?: string
  firmante_curp?: string
  firmante_numero_ine?: string
  firmante_telefono?: string
  firmante_correo?: string
  // Quien atiende la visita
  atiende_mismo: boolean
  atiende_nombre?: string
  atiende_curp?: string
  atiende_numero_ine?: string
  atiende_telefono?: string
  atiende_correo?: string
  notas?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface FolioListaControl {
  id: string
  numero_folio: string
  numero_secuencial: number
  asignado: boolean
  asignado_a?: string
  fecha_asignacion?: string
  created_at: string
}

export interface SolicitudFolio {
  id: string
  inspector_id: string
  cliente_id?: string
  cliente_nombre?: string          // EPC / integrador que contrata a CIAE (nullable en nuevos registros)
  propietario_nombre?: string      // Dueño del sitio de instalación (Walmart, 7-Eleven, etc.)
  tipo_persona: TipoPersona
  ciudad: string
  estado_mx?: string
  kwp: number
  fecha_estimada: string
  cliente_epc_id?: string
  cliente_epc_nombre?: string
  precio_propuesto: number
  precio_base: number
  porcentaje_precio: number
  requiere_autorizacion: boolean
  status: SolicitudStatus
  notas_inspector?: string
  notas_responsable?: string
  folio_asignado_id?: string
  revisado_por?: string
  fecha_revision?: string
  created_at: string
  updated_at: string
  inspector?: Usuario
  folio?: FolioListaControl
}

export interface Expediente {
  id: string
  folio_id: string
  numero_folio: string
  inspector_id: string
  cliente_id: string
  propietario_nombre?: string      // Dueño del sitio (copiado desde solicitudes_folio)
  kwp: number
  direccion_proyecto?: string
  ciudad?: string
  estado_mx?: string
  inversor_id?: string
  num_paneles?: number
  potencia_panel_wp?: number
  status: ExpedienteStatus
  fecha_inicio?: string
  fecha_cierre?: string
  observaciones?: string
  created_at: string
  updated_at: string
  inspector?: Usuario
  cliente?: Cliente
  folio?: FolioListaControl
}

export interface Inversor {
  id: string
  marca: string
  modelo: string
  potencia_kw: number
  fase: InversorFase
  tension_ac?: number
  corriente_max?: number
  eficiencia?: number
  activo: boolean
}

export interface InspeccionAgenda {
  id: string
  expediente_id: string
  inspector_id: string
  testigo_id?: string
  fecha_hora: string
  duracion_min: number
  direccion?: string
  status: InspeccionStatus
  notas?: string
  acta_url?: string
  created_at: string
  updated_at: string
  expediente?: Expediente
}

// Dashboard KPI types
export interface KPIGlobal {
  total_solicitudes: number
  solicitudes_pendientes: number
  folios_asignados_mes: number
  expedientes_activos: number
  inspectores_activos: number
  ingresos_mes: number
}

export interface KPIInspector {
  mis_expedientes: number
  mis_solicitudes_pendientes: number
  mis_inspecciones_semana: number
  mis_folios_asignados: number
}
