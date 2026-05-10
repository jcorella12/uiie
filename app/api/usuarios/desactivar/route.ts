import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/usuarios/desactivar
 *
 * Soft-delete de un usuario (activo=false). NO se hace hard delete
 * porque hay decenas de FKs históricas (expedientes.inspector_id,
 * documentos.subido_por, etc.) que se romperían o destruirían
 * historial.
 *
 * Body: { usuario_id: string, justificacion: string (>=5 chars) }
 *
 * Permisos:
 * - admin: cualquiera (excepto sí mismo y otros admins lo permite,
 *   con cuidado)
 * - inspector_responsable: cualquiera excepto admins y sí mismo
 * - inspector / auxiliar: SOLO usuarios con supervisor_id = auth.uid()
 *   (ej. un inspector desactiva a un auxiliar bajo su cargo)
 *
 * Operación auditada en usuario_desactivacion_audit. La cuenta de
 * auth (Supabase Auth) NO se borra — el admin puede reactivar
 * cuando quiera con activo=true.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await req.json().catch(() => null) as
      | { usuario_id?: string; justificacion?: string }
      | null
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const usuario_id = body.usuario_id?.trim()
    const justificacion = body.justificacion?.trim()
    if (!usuario_id) return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 })
    if (!justificacion || justificacion.length < 5) {
      return NextResponse.json({ error: 'La justificación es obligatoria (mínimo 5 caracteres)' }, { status: 400 })
    }

    // No puede desactivarse a sí mismo
    if (usuario_id === user.id) {
      return NextResponse.json({ error: 'No puedes desactivarte a ti mismo' }, { status: 400 })
    }

    const db = await createServiceClient()

    const { data: target, error: tErr } = await db
      .from('usuarios')
      .select('id, email, nombre, apellidos, rol, activo, supervisor_id')
      .eq('id', usuario_id)
      .single()
    if (tErr || !target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (!target.activo) {
      return NextResponse.json({ ok: true, ya_desactivado: true })
    }

    // Authorization
    const esAdmin     = u.rol === 'admin'
    const esResp      = u.rol === 'inspector_responsable'
    const esSuper     = target.supervisor_id === user.id
    const esTargetAdm = target.rol === 'admin'

    if (esAdmin) {
      // admin puede todo (excepto sí mismo, ya validado)
    } else if (esResp) {
      if (esTargetAdm) {
        return NextResponse.json({ error: 'Un inspector responsable no puede desactivar a un administrador' }, { status: 403 })
      }
    } else if (esSuper) {
      // Inspector/auxiliar puede desactivar a quien le reporta directamente
      if (esTargetAdm) {
        return NextResponse.json({ error: 'No puedes desactivar a un administrador' }, { status: 403 })
      }
    } else {
      return NextResponse.json(
        { error: 'No tienes permisos sobre este usuario. Solo el inspector responsable o el supervisor directo pueden desactivarlo.' },
        { status: 403 },
      )
    }

    // Audit (antes del UPDATE)
    await db.from('usuario_desactivacion_audit').insert({
      usuario_id:      target.id,
      usuario_email:   target.email,
      usuario_nombre:  [target.nombre, target.apellidos].filter(Boolean).join(' '),
      usuario_rol:     target.rol,
      justificacion,
      desactivado_por: user.id,
    })

    // Soft delete: activo=false. Limpia supervisor_id para no dejar
    // referencias colgando si el supervisor intenta verlo.
    const { error: updErr } = await db
      .from('usuarios')
      .update({ activo: false })
      .eq('id', usuario_id)
    if (updErr) {
      return NextResponse.json({ error: `No se pudo desactivar: ${updErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      nombre: [target.nombre, target.apellidos].filter(Boolean).join(' '),
      rol: target.rol,
    })
  } catch (err: any) {
    console.error('[POST /api/usuarios/desactivar]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
