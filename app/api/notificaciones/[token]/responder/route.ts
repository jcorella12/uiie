import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/notificaciones/[token]/responder?r=<key>
 *
 * Endpoint PÚBLICO (sin auth) que recibe el clic del email mandado al
 * inspector. El token único valida el origen, ya que solo el inspector
 * con acceso al email puede tenerlo.
 *
 * Comportamiento:
 *   - Si la notificación existe, no expiró y aún no se respondió:
 *     marca status='respondida', guarda respuesta, redirige a una
 *     página de "gracias" amigable.
 *   - Si ya se respondió: muestra mensaje "ya respondiste".
 *   - Si expiró o no existe: 404 amigable.
 *
 * Este endpoint está exento del middleware de auth (ver
 * lib/supabase/middleware.ts isPublicApiRoute o similar — si no, hay
 * que agregar /api/notificaciones a la lista pública).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.uiie.com.mx'

function redirect(url: string) {
  return NextResponse.redirect(url, 302)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const url = new URL(req.url)
  const respuesta = url.searchParams.get('r')

  if (!params.token || !respuesta) {
    return redirect(`${APP_URL}/notificaciones/error?reason=missing`)
  }

  try {
    const db = await createServiceClient()
    const { data: notif } = await db
      .from('expediente_notificaciones_inspector')
      .select('id, status, opciones, expires_at, expediente_id')
      .eq('token_respuesta', params.token)
      .maybeSingle()

    if (!notif) {
      return redirect(`${APP_URL}/notificaciones/error?reason=notfound`)
    }

    if (notif.status === 'respondida') {
      return redirect(`${APP_URL}/notificaciones/gracias?status=ya_respondida`)
    }

    if (new Date(notif.expires_at as string) < new Date()) {
      await db.from('expediente_notificaciones_inspector')
        .update({ status: 'expirada' }).eq('id', notif.id)
      return redirect(`${APP_URL}/notificaciones/error?reason=expired`)
    }

    const opciones = (notif.opciones as Array<{ key: string; label: string }>) ?? []
    const elegida = opciones.find(o => o.key === respuesta)
    if (!elegida) {
      return redirect(`${APP_URL}/notificaciones/error?reason=invalid_choice`)
    }

    await db.from('expediente_notificaciones_inspector').update({
      status:          'respondida',
      respuesta:       elegida.key,
      respuesta_label: elegida.label,
      respondida_at:   new Date().toISOString(),
    }).eq('id', notif.id)

    return redirect(`${APP_URL}/notificaciones/gracias?label=${encodeURIComponent(elegida.label)}`)
  } catch (err: any) {
    console.error('[GET /api/notificaciones/[token]/responder]', err)
    return redirect(`${APP_URL}/notificaciones/error?reason=server`)
  }
}
