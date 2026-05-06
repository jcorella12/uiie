import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { UserRole, SolicitudStatus, ExpedienteStatus, InspeccionStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ROLE_LABELS: Record<UserRole, string> = {
  inspector_responsable: 'Inspector Responsable',
  admin: 'Administrador',
  inspector: 'Inspector',
  auxiliar: 'Auxiliar / Administrativo',
  cliente: 'Cliente',
}

export const SOLICITUD_STATUS_LABELS: Record<SolicitudStatus, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  folio_asignado: 'Folio Asignado',
}

export const EXPEDIENTE_STATUS_LABELS: Record<ExpedienteStatus, string> = {
  borrador: 'Borrador',
  en_proceso: 'En Proceso',
  revision: 'En Revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  devuelto: 'Devuelto',
  cerrado: 'Cerrado',
}

export const INSPECCION_STATUS_LABELS: Record<InspeccionStatus, string> = {
  programada: 'Programada',
  en_curso: 'En Curso',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
}

// La app sirve usuarios en México; los servidores (Vercel) corren en UTC.
// Anclamos todas las representaciones legibles a la zona horaria oficial
// para evitar el bug donde una cita capturada como 9:00 AM se mostraba
// como 3:00 PM (UTC) en documentos generados.
export const TZ_MX = 'America/Mexico_City'

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TZ_MX,
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ_MX,
  })
}

/** Hora en formato 12h con AM/PM, en zona horaria de México. */
export function formatTimeMX(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ_MX,
  })
}

/** Hora en formato 24h, en zona horaria de México. */
export function formatTime24MX(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ_MX,
  })
}

/** Resta N días a una fecha ISO y devuelve una nueva ISO en la misma TZ. */
export function isoMinusDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export function getDashboardPath(rol: UserRole): string {
  switch (rol) {
    case 'inspector_responsable': return '/dashboard'
    case 'admin': return '/dashboard/admin'
    case 'inspector': return '/dashboard/inspector'
    case 'auxiliar': return '/dashboard/inspector'   // comparte vista con inspector
    case 'cliente': return '/dashboard/cliente'
    default: return '/dashboard'
  }
}
