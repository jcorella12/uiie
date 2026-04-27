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

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
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
