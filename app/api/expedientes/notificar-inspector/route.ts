import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/expedientes/notificar-inspector
 *
 * El auditor (admin/responsable) envía una pregunta al inspector sobre
 * un hallazgo de la revisión IA. Crea el registro, manda email al
 * inspector con botones de respuesta (links públicos con token único).
 *
 * Body: {
 *   expediente_id: string,
 *   tipo: 'direccion' | 'razon_social' | 'capacidad' | 'firmas' | 'ficha_pago' | 'otro',
 *   prioridad: number,
 *   hallazgo_descripcion: string,
 *   pregunta_al_inspector: string,    // texto que va en el email
 *   opciones?: Array<{ key: string, label: string }>  // default: si/no estándar
 * }
 *
 * Solo admin / inspector_responsable.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.uiie.com.mx'

const OPCIONES_DEFAULT_DIRECCION = [
  { key: 'si', label: 'Sí, con esa dirección se emitirá' },
  { key: 'no', label: 'No, cambiaré los documentos' },
]

const OPCIONES_DEFAULT_GENERICAS = [
  { key: 'si', label: 'Sí, está correcto así' },
  { key: 'no', label: 'No, lo voy a corregir' },
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol, nombre, apellidos').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos — solo admin/responsable' }, { status: 403 })
    }

    const body = await req.json().catch(() => null) as {
      expediente_id?: string
      tipo?: string
      prioridad?: number
      hallazgo_descripcion?: string
      pregunta_al_inspector?: string
      opciones?: Array<{ key: string; label: string }>
    } | null

    if (!body?.expediente_id || !body.tipo || !body.prioridad ||
        !body.hallazgo_descripcion || !body.pregunta_al_inspector) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const opciones = body.opciones && body.opciones.length >= 2
      ? body.opciones
      : (body.tipo === 'direccion' ? OPCIONES_DEFAULT_DIRECCION : OPCIONES_DEFAULT_GENERICAS)

    const db = await createServiceClient()

    // Cargar expediente + inspector destinatario
    const { data: exp } = await db
      .from('expedientes')
      .select(`
        id, numero_folio, nombre_cliente_final,
        inspector_id, inspector_ejecutor_id,
        inspector:usuarios!inspector_id(id, nombre, apellidos, email),
        inspector_ejecutor:usuarios!inspector_ejecutor_id(id, nombre, apellidos, email)
      `)
      .eq('id', body.expediente_id)
      .single()

    if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

    // Destinatario = el inspector ejecutor si está delegado, si no el inspector_id
    const destino = (exp.inspector_ejecutor as any) ?? (exp.inspector as any)
    if (!destino?.email) {
      return NextResponse.json({ error: 'El inspector del expediente no tiene email registrado' }, { status: 422 })
    }

    // Token único de un solo uso (96 bits, base64url)
    const tokenRespuesta = randomBytes(24).toString('base64url')

    // Insert el registro
    const { data: notif, error: insErr } = await db
      .from('expediente_notificaciones_inspector')
      .insert({
        expediente_id:         body.expediente_id,
        inspector_id:          destino.id,
        enviado_por:           user.id,
        tipo:                  body.tipo,
        prioridad:             body.prioridad,
        hallazgo_descripcion:  body.hallazgo_descripcion,
        pregunta_al_inspector: body.pregunta_al_inspector,
        opciones,
        token_respuesta:       tokenRespuesta,
      })
      .select('id, token_respuesta')
      .single()

    if (insErr || !notif) {
      console.error('[notificar-inspector] insert error:', insErr?.message)
      return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 })
    }

    // Construir email
    const nombreInsp = `${destino.nombre} ${destino.apellidos ?? ''}`.trim()
    const auditor = `${u.nombre} ${u.apellidos ?? ''}`.trim()
    const html = renderEmail({
      inspector_nombre: nombreInsp,
      auditor,
      folio: exp.numero_folio,
      cliente: exp.nombre_cliente_final ?? '—',
      pregunta: body.pregunta_al_inspector,
      hallazgo: body.hallazgo_descripcion,
      opciones,
      token: notif.token_respuesta,
    })

    try {
      await sendEmail({
        to:      destino.email,
        subject: `[UIIE ${exp.numero_folio}] Necesitamos tu confirmación`,
        html,
        text: `Hola ${nombreInsp},\n\n${body.pregunta_al_inspector}\n\nResponde abriendo el correo en el navegador.`,
      })

      await db
        .from('expediente_notificaciones_inspector')
        .update({ email_enviado_at: new Date().toISOString() })
        .eq('id', notif.id)
    } catch (emailErr: any) {
      console.error('[notificar-inspector] email error:', emailErr?.message)
      // No abortamos: la notificación queda creada, se puede reintentar
      return NextResponse.json({
        ok: true,
        notificacion_id: notif.id,
        warning: `Notificación creada pero falló el email: ${emailErr?.message ?? 'desconocido'}`,
      })
    }

    return NextResponse.json({
      ok: true,
      notificacion_id: notif.id,
      destino: { nombre: nombreInsp, email: destino.email },
    })
  } catch (err: any) {
    console.error('[POST /api/expedientes/notificar-inspector]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

// ─── Email template ─────────────────────────────────────────────────────────

function renderEmail(d: {
  inspector_nombre: string
  auditor:          string
  folio:            string
  cliente:          string
  pregunta:         string
  hallazgo:         string
  opciones:         Array<{ key: string; label: string }>
  token:            string
}): string {
  const botonesHTML = d.opciones.map((opt, i) => {
    const url = `${APP_URL}/api/notificaciones/${d.token}/responder?r=${encodeURIComponent(opt.key)}`
    const isPrimary = i === 0
    const bg   = isPrimary ? '#0F6E56' : '#ffffff'
    const text = isPrimary ? '#ffffff' : '#0F6E56'
    const border = isPrimary ? '#0F6E56' : '#0F6E56'
    return `
      <a href="${url}"
         style="display:inline-block;margin:6px 4px;padding:14px 24px;background:${bg};color:${text};
                border:2px solid ${border};border-radius:10px;text-decoration:none;font-weight:600;
                font-size:14px;font-family:Arial,sans-serif;">
        ${escapeHtml(opt.label)}
      </a>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0F6E56;padding:24px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">UIIE — Inspección</h1>
            <p style="margin:4px 0 0;color:#EF9F27;font-size:12px;font-weight:600;letter-spacing:1px;">UIIE-CRE-021</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 16px;">
            <p style="margin:0 0 8px;color:#6B7280;font-size:13px;">Hola ${escapeHtml(d.inspector_nombre)},</p>
            <h2 style="margin:0 0 16px;color:#111827;font-size:18px;line-height:1.4;">
              Necesitamos tu confirmación sobre el folio ${escapeHtml(d.folio)}
            </h2>
            <p style="margin:0 0 8px;color:#6B7280;font-size:13px;">Cliente: <strong>${escapeHtml(d.cliente)}</strong></p>
            <div style="background:#fef3e3;border-left:4px solid #EF9F27;padding:14px 18px;margin:16px 0;border-radius:6px;">
              <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">Hallazgo detectado:</p>
              <p style="margin:6px 0 0;color:#78350f;font-size:13px;">${escapeHtml(d.hallazgo)}</p>
            </div>
            <p style="margin:24px 0 8px;color:#374151;font-size:15px;line-height:1.5;">
              ${escapeHtml(d.pregunta)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            ${botonesHTML}
            <p style="margin:24px 0 0;color:#9ca3af;font-size:11px;">
              Solicitado por ${escapeHtml(d.auditor)}. Tu respuesta queda registrada
              y notifica de regreso al equipo de revisión.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
