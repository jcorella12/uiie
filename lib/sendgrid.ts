import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = 'folios@iisac.mx'
const FROM_NAME = 'CIAE — UIIE-CRE-021'

export interface FolioAsignadoEmailData {
  toEmail: string
  toName: string
  inspectorNombre: string
  clienteNombre: string
  numeroFolio: string
  kwp: number
  fechaEstimada: string
  ciudad: string
}

export async function sendFolioAsignadoEmail(data: FolioAsignadoEmailData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[SendGrid] API key not configured — skipping email.')
    return
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0F6E56;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">CIAE</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Inteligencia en Ahorro de Energía S.A. de C.V.</p>
            <p style="margin:4px 0 0;color:#EF9F27;font-size:12px;font-weight:600;letter-spacing:1px;">UIIE-CRE-021</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Folio de Inspección Asignado</h2>
            <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">Estimado/a ${data.inspectorNombre},</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;">Se ha asignado un folio para la inspección del siguiente proyecto:</p>

            <!-- Folio badge -->
            <div style="background:#e8f4f1;border:2px solid #0F6E56;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
              <p style="margin:0;color:#0F6E56;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Número de Folio</p>
              <p style="margin:8px 0 0;color:#0F6E56;font-size:28px;font-weight:700;font-family:monospace;">${data.numeroFolio}</p>
            </div>

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;">
                  <span style="color:#6B7280;font-size:13px;">Cliente</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${data.clienteNombre}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;">
                  <span style="color:#6B7280;font-size:13px;">Ciudad</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                  <span style="color:#111827;font-size:13px;">${data.ciudad}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;">
                  <span style="color:#6B7280;font-size:13px;">Potencia</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                  <span style="color:#111827;font-size:13px;">${data.kwp} kWp</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="color:#6B7280;font-size:13px;">Fecha Estimada</span>
                </td>
                <td style="padding:8px 0;text-align:right;">
                  <span style="color:#111827;font-size:13px;">${data.fechaEstimada}</span>
                </td>
              </tr>
            </table>

            <p style="color:#374151;font-size:14px;line-height:1.6;">
              Por favor inicia el expediente en el sistema y prepara la documentación requerida para la inspección.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;border-top:1px solid #E5E7EB;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              © 2025 Inteligencia en Ahorro de Energía S.A. de C.V. · Folio de autorización UIIE-CRE-021<br>
              Este correo fue generado automáticamente. No responder.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sgMail.send({
    to: { email: data.toEmail, name: data.toName },
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Folio Asignado: ${data.numeroFolio} — ${data.clienteNombre}`,
    html,
    text: `Folio asignado: ${data.numeroFolio}\nCliente: ${data.clienteNombre}\nkWp: ${data.kwp}\nCiudad: ${data.ciudad}\nFecha estimada: ${data.fechaEstimada}`,
  })
}
