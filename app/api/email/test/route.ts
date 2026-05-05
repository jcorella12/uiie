import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/email/test
 *
 * Envía un email de prueba a la cuenta del usuario logueado.
 * Solo admin / inspector_responsable.
 *
 * Útil para validar que RESEND_API_KEY está bien configurada y que
 * el dominio remitente está verificado en Resend.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('usuarios').select('rol, nombre, apellidos').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'inspector_responsable'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const to = (body.to as string)?.trim() || user.email
  if (!to) return NextResponse.json({ error: 'No se pudo determinar el destinatario' }, { status: 400 })

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0F6E56;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Test de email — Resend</h1>
            <p style="margin:4px 0 0;color:#EF9F27;font-size:11px;font-weight:600;letter-spacing:1px;">CIAE · UIIE-CRE-021</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:15px;color:#374151;">Hola ${profile.nombre ?? ''},</p>
            <p style="margin:0 0 12px;font-size:14px;color:#374151;">
              Si recibiste este correo, la integración de <strong>Resend</strong> está funcionando correctamente.
            </p>
            <ul style="font-size:13px;color:#6B7280;padding-left:20px;line-height:1.7;">
              <li>API key: <code>OK</code></li>
              <li>Dominio remitente: <code>${process.env.RESEND_FROM ?? 'onboarding@resend.dev'}</code></li>
              <li>Enviado: ${new Date().toLocaleString('es-MX')}</li>
            </ul>
            <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">
              Endpoint: <code>POST /api/email/test</code> — solo admin / inspector_responsable.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await sendEmail({
      to,
      subject: '✅ Test de Resend desde la app UIIE',
      html,
      text: 'Si recibiste este correo, Resend está funcionando.',
    })
    return NextResponse.json({ ok: true, sent_to: to })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error al enviar' }, { status: 500 })
  }
}
