import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/expedientes/contactar-cliente
 *
 * El inspector / inspector_responsable / admin manda un mensaje al
 * cliente sobre el expediente. El sistema:
 *  1. Inserta registro en expediente_mensajes_cliente (trazabilidad)
 *  2. Envía email vía Resend desde la cuenta de la app (RESEND_FROM)
 *     con el branding UIIE
 *  3. Marca el mensaje como pendiente para que el cliente lo vea con
 *     badge destacado en su portal
 *
 * Body: { expediente_id, mensaje (>=5 chars), asunto? }
 *
 * Permisos: admin / inspector_responsable cualquier expediente;
 *           inspector / auxiliar solo si es dueño o ejecutor.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.uiie.com.mx'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase
      .from('usuarios')
      .select('rol, nombre, apellidos')
      .eq('id', user.id)
      .single()
    const rol = u?.rol ?? ''
    if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json().catch(() => null) as
      | { expediente_id?: string; mensaje?: string; asunto?: string }
      | null
    if (!body?.expediente_id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })
    const mensaje = body.mensaje?.trim() ?? ''
    if (mensaje.length < 5) {
      return NextResponse.json({ error: 'El mensaje debe tener al menos 5 caracteres' }, { status: 400 })
    }
    if (mensaje.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede exceder 5000 caracteres' }, { status: 400 })
    }

    const db = await createServiceClient()

    // Cargar expediente + cliente
    const { data: exp } = await db
      .from('expedientes')
      .select(`
        id, numero_folio, inspector_id, inspector_ejecutor_id,
        cliente_id, nombre_cliente_final,
        cliente:clientes(id, nombre, email, usuario_id, atiende_correo, firmante_correo)
      `)
      .eq('id', body.expediente_id)
      .single()

    if (!exp) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })

    // Permisos por rol
    const esAdminORespResp = ['admin', 'inspector_responsable'].includes(rol)
    const esDueno = exp.inspector_id === user.id || exp.inspector_ejecutor_id === user.id
    if (!esAdminORespResp && !esDueno) {
      return NextResponse.json(
        { error: 'No tienes permisos sobre este expediente. Solo el inspector dueño o admin pueden contactar al cliente.' },
        { status: 403 },
      )
    }

    // Email destinatario: prioridad cliente.email > atiende_correo > firmante_correo
    const cli = exp.cliente as any
    const destinoEmail: string | null =
      cli?.email?.trim() ||
      cli?.atiende_correo?.trim() ||
      cli?.firmante_correo?.trim() ||
      null

    if (!destinoEmail) {
      return NextResponse.json(
        { error: 'El cliente no tiene email registrado. Captúralo en su perfil para poder contactarlo.' },
        { status: 422 },
      )
    }

    const asunto = (body.asunto?.trim() || `Mensaje sobre tu expediente ${exp.numero_folio}`).slice(0, 200)

    // 1. Insertar registro (antes del envío para que sobreviva si email falla)
    const { data: msj, error: insErr } = await db
      .from('expediente_mensajes_cliente')
      .insert({
        expediente_id:   exp.id,
        enviado_por:     user.id,
        enviado_por_rol: rol,
        cliente_id:      cli?.id ?? null,
        cliente_email:   destinoEmail,
        asunto,
        mensaje,
      })
      .select('id')
      .single()

    if (insErr || !msj) {
      console.error('[contactar-cliente] insert error:', insErr?.message)
      return NextResponse.json({ error: 'Error al registrar el mensaje' }, { status: 500 })
    }

    // 2. Construir email branded UIIE
    const remitenteNombre = `${u?.nombre ?? ''} ${u?.apellidos ?? ''}`.trim() || 'Equipo UIIE'
    const clienteNombreParaEmail = cli?.nombre ?? exp.nombre_cliente_final ?? 'Cliente'
    const html = renderEmail({
      cliente_nombre:    clienteNombreParaEmail,
      remitente_nombre:  remitenteNombre,
      remitente_rol:     rol,
      folio:             exp.numero_folio ?? '—',
      asunto,
      mensaje,
      portal_url:        `${APP_URL}/dashboard/cliente`,
    })

    // 3. Enviar — si falla, queda registrado en email_error pero el mensaje
    // sigue visible en el portal del cliente
    try {
      await sendEmail({
        to:      destinoEmail,
        subject: `[UIIE ${exp.numero_folio ?? ''}] ${asunto}`,
        html,
        text: `Hola ${clienteNombreParaEmail},\n\n${mensaje}\n\n— ${remitenteNombre}\nUIIE — Inteligencia en Ahorro de Energía S.A. de C.V.`,
      })
      await db
        .from('expediente_mensajes_cliente')
        .update({ email_enviado_at: new Date().toISOString() })
        .eq('id', msj.id)
    } catch (emailErr: any) {
      console.error('[contactar-cliente] email error:', emailErr?.message)
      await db
        .from('expediente_mensajes_cliente')
        .update({ email_error: String(emailErr?.message ?? 'desconocido').slice(0, 500) })
        .eq('id', msj.id)
      return NextResponse.json({
        ok: true,
        mensaje_id: msj.id,
        warning: `Mensaje guardado en el portal del cliente, pero falló el email: ${emailErr?.message}`,
      })
    }

    return NextResponse.json({
      ok: true,
      mensaje_id: msj.id,
      destinatario: destinoEmail,
    })
  } catch (err: any) {
    console.error('[POST /api/expedientes/contactar-cliente]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

// ─── Email template ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderEmail(d: {
  cliente_nombre:   string
  remitente_nombre: string
  remitente_rol:    string
  folio:            string
  asunto:           string
  mensaje:          string
  portal_url:       string
}): string {
  const verde   = '#0F6E56'
  const naranja = '#EF9F27'
  // Mensaje preservando saltos de línea
  const mensajeHtml = escapeHtml(d.mensaje).replace(/\n/g, '<br>')
  const rolLabel =
    d.remitente_rol === 'admin' ? 'Administración'
    : d.remitente_rol === 'inspector_responsable' ? 'Inspector Responsable'
    : 'Inspector'

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${verde};padding:24px 40px;text-align:left;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">UIIE — Inspección</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
              Sobre tu expediente <strong style="color:#fff;">${escapeHtml(d.folio)}</strong>
            </p>
            <p style="margin:2px 0 0;color:${naranja};font-size:11px;font-weight:600;letter-spacing:1px;">UIIE-CRE-021</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 8px;">
            <p style="margin:0 0 6px;color:#6B7280;font-size:13px;">Hola ${escapeHtml(d.cliente_nombre)},</p>
            <p style="margin:0 0 18px;color:#374151;font-size:14px;">
              Tienes un nuevo mensaje de tu equipo de inspección sobre el folio
              <strong>${escapeHtml(d.folio)}</strong>:
            </p>
            <div style="background:#fef9f0;border-left:4px solid ${naranja};padding:18px 20px;border-radius:6px;">
              <p style="margin:0 0 8px;color:#374151;font-size:13px;font-weight:700;">
                ${escapeHtml(d.asunto)}
              </p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.55;">${mensajeHtml}</p>
            </div>
            <p style="margin:24px 0 6px;color:#374151;font-size:13px;">
              — ${escapeHtml(d.remitente_nombre)}<br>
              <span style="color:#9ca3af;font-size:11px;">${escapeHtml(rolLabel)} · UIIE</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 40px 32px;text-align:center;">
            <a href="${d.portal_url}"
               style="display:inline-block;padding:12px 24px;background:${verde};color:#fff;border-radius:10px;
                      text-decoration:none;font-weight:600;font-size:14px;">
              Abrir mi portal
            </a>
            <p style="margin:18px 0 0;color:#9ca3af;font-size:11px;">
              Puedes responder este correo o entrar a tu portal para ver el mensaje
              y subir documentos.
            </p>
          </td>
        </tr>
        <tr><td style="background:#f9fafb;padding:14px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            UIIE-CRE-021 · Inteligencia en Ahorro de Energía S.A. de C.V.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
