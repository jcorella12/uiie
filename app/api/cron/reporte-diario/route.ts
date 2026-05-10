import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/cron/reporte-diario
 *
 * Manda un resumen ejecutivo diario por correo a admins e inspectores
 * responsables. Programado en Vercel Cron a las 18:00 Hermosillo
 * (Sonora UTC-7 fijo, sin horario de verano) → 01:00 UTC.
 *
 * El reporte cubre los eventos del día Hermosillo en curso:
 * 00:00 Hermosillo hasta el momento del envío (≈18:00 Hermosillo).
 *
 * Contenido:
 *   1. Solicitudes de folio creadas hoy (con inspector y kWp)
 *   2. Folios asignados hoy (con folio, cliente y a qué inspector)
 *   3. Certificados emitidos hoy (con folio, cliente, ciudad, inspector)
 *   4. Resumen con totales
 *
 * Auth: header Authorization Bearer CRON_SECRET o user-agent vercel-cron.
 *
 * Para correr manualmente:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://app.uiie.com.mx/api/cron/reporte-diario
 */

// Sonora: UTC-7 fijo (no observa horario de verano desde 2022)
const HERMOSILLO_OFFSET_HOURS = -7

function startOfTodayHermosilloUTC(): Date {
  const now = new Date()
  const hermosilloMs = now.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000
  const h = new Date(hermosilloMs)
  // 00:00 Hermosillo = 07:00 UTC del mismo día Hermosillo
  return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate(), -HERMOSILLO_OFFSET_HOURS, 0, 0))
}

function fechaHermosilloLabel(d: Date = new Date()): string {
  const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
  return hermo.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'UTC',  // ya aplicamos el offset, evitamos que se aplique de nuevo
  })
}

function horaHermosilloLabel(d: Date = new Date()): string {
  const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
  return hermo.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: true,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const esVercelCron = req.headers.get('user-agent')?.includes('vercel-cron')
  const tokenValido  = cronSecret && authHeader === `Bearer ${cronSecret}`
  if (!esVercelCron && !tokenValido) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const db = await createServiceClient()
    const desdeUTC = startOfTodayHermosilloUTC()
    const desdeISO = desdeUTC.toISOString()
    const ahora    = new Date()

    // 1. Solicitudes creadas hoy
    const { data: solicitudes } = await db
      .from('solicitudes_folio')
      .select(`
        id, cliente_nombre, propietario_nombre, kwp, ciudad, estado_mx, status, created_at,
        inspector:usuarios!inspector_id(nombre, apellidos)
      `)
      .gte('created_at', desdeISO)
      .order('created_at', { ascending: true })

    // 2. Folios asignados hoy (fecha_asignacion >= desde)
    const { data: foliosAsig } = await db
      .from('folios_lista_control')
      .select(`
        id, numero_folio, fecha_asignacion,
        asignado:usuarios!asignado_a(nombre, apellidos)
      `)
      .gte('fecha_asignacion', desdeISO)
      .order('fecha_asignacion', { ascending: true })

    // Para los folios asignados, traemos el cliente vía expedientes (si ya hay)
    const folioIds = (foliosAsig ?? []).map(f => f.id)
    let folioToCliente: Record<string, string> = {}
    if (folioIds.length > 0) {
      const { data: exps } = await db
        .from('expedientes')
        .select('folio_id, nombre_cliente_final, cliente:clientes(nombre)')
        .in('folio_id', folioIds)
      for (const e of (exps ?? []) as any[]) {
        if (e.folio_id) folioToCliente[e.folio_id] = e.nombre_cliente_final ?? e.cliente?.nombre ?? '—'
      }
    }

    // 3. Certificados emitidos hoy — desde expedientes (que es donde el flujo
    //    real registra). fecha_emision_certificado es DATE, comparamos con
    //    el día Hermosillo en curso.
    const fechaHoyHermo = new Date(desdeUTC.getTime() + 12 * 3600 * 1000)  // mediodía Hermosillo
    const yyyymmddHoy   = `${fechaHoyHermo.getUTCFullYear()}-${String(fechaHoyHermo.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaHoyHermo.getUTCDate()).padStart(2, '0')}`

    const { data: certEmitidos } = await db
      .from('expedientes')
      .select(`
        id, numero_folio, numero_certificado, fecha_emision_certificado,
        nombre_cliente_final, ciudad, estado_mx,
        inspector:usuarios!inspector_id(nombre, apellidos),
        inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos),
        cliente:clientes(nombre)
      `)
      .eq('fecha_emision_certificado', yyyymmddHoy)
      .not('numero_certificado', 'is', null)
      .order('numero_certificado', { ascending: true })

    // 4. Destinatarios del reporte: admin + inspector_responsable activos
    const { data: destinatarios } = await db
      .from('usuarios')
      .select('email, nombre')
      .in('rol', ['admin', 'inspector_responsable'])
      .eq('activo', true)
      .not('email', 'is', null)

    const emails = (destinatarios ?? []).map(d => d.email).filter((e): e is string => !!e)
    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_recipients' })
    }

    const summary = {
      solicitudes:     (solicitudes ?? []).length,
      folios_asig:     (foliosAsig ?? []).length,
      certs_emitidos:  (certEmitidos ?? []).length,
    }

    // Si no pasó NADA hoy, mandamos un email corto en lugar del completo
    const sinActividad = summary.solicitudes === 0 && summary.folios_asig === 0 && summary.certs_emitidos === 0

    const html = renderEmail({
      fecha:           fechaHermosilloLabel(),
      hora_corte:      horaHermosilloLabel(ahora),
      summary,
      solicitudes:     solicitudes ?? [],
      folios_asig:     (foliosAsig ?? []).map(f => ({
                         ...f,
                         cliente_inferido: folioToCliente[f.id] ?? '—',
                       })),
      certs_emitidos:  certEmitidos ?? [],
      sin_actividad:   sinActividad,
    })

    await sendEmail({
      to:      emails,
      subject: sinActividad
        ? `[UIIE] Sin actividad — ${fechaHermosilloLabel()}`
        : `[UIIE] Resumen del día — ${summary.solicitudes} solicitudes · ${summary.certs_emitidos} certs`,
      html,
      text: `Resumen UIIE ${fechaHermosilloLabel()}: ${summary.solicitudes} solicitudes, ${summary.folios_asig} folios asignados, ${summary.certs_emitidos} certificados emitidos. Detalles en el correo HTML.`,
    })

    return NextResponse.json({
      ok: true,
      sent: emails.length,
      summary,
      ventana: { desde: desdeISO, hasta: ahora.toISOString() },
    })
  } catch (err: any) {
    console.error('[cron/reporte-diario]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

// ─── Email template ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function inspectorName(i: any): string {
  if (!i) return '—'
  return `${i.nombre ?? ''} ${i.apellidos ?? ''}`.trim() || '—'
}

interface RenderProps {
  fecha:          string
  hora_corte:     string
  summary:        { solicitudes: number; folios_asig: number; certs_emitidos: number }
  solicitudes:    any[]
  folios_asig:    any[]
  certs_emitidos: any[]
  sin_actividad:  boolean
}

function renderEmail(d: RenderProps): string {
  const verde = '#0F6E56'
  const naranja = '#EF9F27'

  const seccionVacia = (titulo: string) => `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 6px;color:#374151;font-size:14px;font-weight:700;">${titulo}</h3>
      <p style="margin:0;color:#9ca3af;font-size:13px;font-style:italic;">— sin movimiento —</p>
    </td></tr>
  `

  const seccionSolicitudes = d.solicitudes.length === 0 ? seccionVacia('📋 Solicitudes de folio') : `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:700;">📋 Solicitudes de folio (${d.solicitudes.length})</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;">
        ${d.solicitudes.map(s => `
          <tr>
            <td style="padding:6px 0;">
              <strong style="color:#111827;">${escapeHtml(s.cliente_nombre ?? s.propietario_nombre ?? '—')}</strong>
              ${s.kwp ? ` · ${s.kwp} kWp` : ''}
              ${s.ciudad ? ` · ${escapeHtml(s.ciudad)}${s.estado_mx ? ', ' + escapeHtml(s.estado_mx) : ''}` : ''}
              <br><span style="font-size:11px;color:#6b7280;">Inspector: ${escapeHtml(inspectorName(s.inspector))}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </td></tr>
  `

  const seccionFolios = d.folios_asig.length === 0 ? seccionVacia('🎫 Folios asignados') : `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:700;">🎫 Folios asignados (${d.folios_asig.length})</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;">
        ${d.folios_asig.map(f => `
          <tr>
            <td style="padding:6px 0;">
              <span style="font-family:monospace;color:${verde};font-weight:600;">${escapeHtml(f.numero_folio)}</span>
              ${f.cliente_inferido && f.cliente_inferido !== '—' ? ` · ${escapeHtml(f.cliente_inferido)}` : ''}
              <br><span style="font-size:11px;color:#6b7280;">A: ${escapeHtml(inspectorName(f.asignado))}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </td></tr>
  `

  const seccionCerts = d.certs_emitidos.length === 0 ? seccionVacia('🏆 Certificados emitidos') : `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:700;">🏆 Certificados emitidos (${d.certs_emitidos.length})</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;">
        ${d.certs_emitidos.map((c: any) => `
          <tr>
            <td style="padding:6px 0;">
              <span style="font-family:monospace;color:${verde};font-weight:600;">${escapeHtml(c.numero_certificado ?? '')}</span>
              · folio <span style="font-family:monospace;color:#6b7280;">${escapeHtml(c.numero_folio ?? '')}</span>
              <br>
              <strong style="color:#111827;">${escapeHtml(c.nombre_cliente_final ?? c.cliente?.nombre ?? '—')}</strong>
              ${c.ciudad ? ` · ${escapeHtml(c.ciudad)}${c.estado_mx ? ', ' + escapeHtml(c.estado_mx) : ''}` : ''}
              <br><span style="font-size:11px;color:#6b7280;">Inspector: ${escapeHtml(inspectorName(c.inspector_ejecutor ?? c.inspector))}</span>
            </td>
          </tr>
        `).join('')}
      </table>
    </td></tr>
  `

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td>
      <table width="640" align="center" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${verde};padding:24px 40px;text-align:left;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Resumen del día</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:capitalize;">${escapeHtml(d.fecha)}</p>
            <p style="margin:2px 0 0;color:${naranja};font-size:11px;font-weight:600;letter-spacing:1px;">UIIE-CRE-021 · corte ${escapeHtml(d.hora_corte)} Hermosillo</p>
          </td>
        </tr>

        ${d.sin_actividad ? `
          <tr><td style="padding:40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:14px;">No hubo movimiento operativo hoy.</p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Sin solicitudes nuevas, sin folios asignados, sin certificados emitidos.</p>
          </td></tr>
        ` : `
          <tr><td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td style="width:33%;text-align:center;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
                  <p style="margin:0;color:#166534;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Solicitudes</p>
                  <p style="margin:6px 0 0;color:${verde};font-size:28px;font-weight:700;">${d.summary.solicitudes}</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33%;text-align:center;padding:12px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa;">
                  <p style="margin:0;color:#9a3412;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Folios asignados</p>
                  <p style="margin:6px 0 0;color:${naranja};font-size:28px;font-weight:700;">${d.summary.folios_asig}</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33%;text-align:center;padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                  <p style="margin:0;color:#1e40af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Certificados</p>
                  <p style="margin:6px 0 0;color:#2563eb;font-size:28px;font-weight:700;">${d.summary.certs_emitidos}</p>
                </td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${seccionSolicitudes}
              ${seccionFolios}
              ${seccionCerts}
            </table>
          </td></tr>
        `}

        <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
            Reporte automático generado por UIIE · ${escapeHtml(d.hora_corte)} hora Hermosillo
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
