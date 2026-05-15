import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/cron/reporte-semanal
 *
 * Manda un resumen ejecutivo SEMANAL por correo a admins e inspectores
 * responsables. Programado en Vercel Cron a las 18:00 Hermosillo del
 * viernes (Sonora UTC-7 fijo) → 01:00 UTC del sábado.
 *
 * El reporte cubre la semana laboral en curso:
 *   Lunes 00:00 Hermosillo  →  momento del envío (≈ Viernes 18:00 Hermosillo).
 *
 * Contenido por sección:
 *   1. Solicitudes de folio creadas en la semana
 *   2. Folios asignados en la semana
 *   3. Certificados emitidos en la semana
 *   4. Top inspectores por actividad
 *   5. Resumen con totales + comparativa por día
 *
 * Auth: header Authorization Bearer CRON_SECRET o user-agent vercel-cron.
 *
 * Para correr manualmente:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://app.uiie.com.mx/api/cron/reporte-semanal
 */

// Sonora: UTC-7 fijo (no observa horario de verano desde 2022)
const HERMOSILLO_OFFSET_HOURS = -7

/** Devuelve el lunes 00:00 Hermosillo de la semana actual (en UTC). */
function startOfThisWeekHermosilloUTC(): Date {
  const now = new Date()
  const hermosilloMs = now.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000
  const h = new Date(hermosilloMs)
  // Day of week (Hermosillo): 0=Sun, 1=Mon, … 6=Sat
  const dow = h.getUTCDay()
  // Días para retroceder al lunes (si es domingo retrocede 6, si es lunes 0)
  const back = dow === 0 ? 6 : dow - 1
  // 00:00 Hermosillo del lunes en UTC = lunes 07:00 UTC (porque UTC = Hermosillo + 7h)
  return new Date(Date.UTC(
    h.getUTCFullYear(),
    h.getUTCMonth(),
    h.getUTCDate() - back,
    -HERMOSILLO_OFFSET_HOURS, 0, 0,
  ))
}

function fechaHermosilloLabel(d: Date = new Date()): string {
  const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
  return hermo.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'UTC',  // ya aplicamos el offset, evitamos que se aplique de nuevo
  })
}

function fechaCortaHermosillo(d: Date): string {
  const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
  return hermo.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

function diaSemanaHermosillo(iso: string): string {
  const d = new Date(iso)
  const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
  return hermo.toLocaleDateString('es-MX', {
    weekday: 'short', timeZone: 'UTC',
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
    const desdeUTC = startOfThisWeekHermosilloUTC()
    const desdeISO = desdeUTC.toISOString()
    const ahora    = new Date()

    // 1. Solicitudes creadas esta semana
    const { data: solicitudes } = await db
      .from('solicitudes_folio')
      .select(`
        id, cliente_nombre, propietario_nombre, kwp, ciudad, estado_mx, status, created_at,
        inspector:usuarios!inspector_id(nombre, apellidos)
      `)
      .gte('created_at', desdeISO)
      .order('created_at', { ascending: true })

    // 2. Folios asignados esta semana
    const { data: foliosAsig } = await db
      .from('folios_lista_control')
      .select(`
        id, numero_folio, fecha_asignacion,
        asignado:usuarios!asignado_a(nombre, apellidos)
      `)
      .gte('fecha_asignacion', desdeISO)
      .order('fecha_asignacion', { ascending: true })

    // Cliente inferido desde el expediente vinculado al folio
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

    // 3. Certificados emitidos esta semana — fecha_emision_certificado es DATE
    // Construimos lista de fechas YYYY-MM-DD entre lunes y hoy (en Hermosillo)
    const fechasSemana: string[] = []
    const cursor = new Date(desdeUTC)
    const finUTC = new Date(ahora.getTime())
    while (cursor.getTime() <= finUTC.getTime()) {
      const hermo = new Date(cursor.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
      const yyyy = hermo.getUTCFullYear()
      const mm   = String(hermo.getUTCMonth() + 1).padStart(2, '0')
      const dd   = String(hermo.getUTCDate()).padStart(2, '0')
      fechasSemana.push(`${yyyy}-${mm}-${dd}`)
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    const { data: certEmitidos } = await db
      .from('expedientes')
      .select(`
        id, numero_folio, numero_certificado, fecha_emision_certificado,
        nombre_cliente_final, ciudad, estado_mx,
        inspector:usuarios!inspector_id(nombre, apellidos),
        inspector_ejecutor:usuarios!inspector_ejecutor_id(nombre, apellidos),
        cliente:clientes(nombre)
      `)
      .in('fecha_emision_certificado', fechasSemana)
      .not('numero_certificado', 'is', null)
      .order('numero_certificado', { ascending: true })

    // 4. Top inspectores de la semana — combinamos solicitudes + certs por inspector
    const inspStats: Record<string, { nombre: string; sols: number; certs: number }> = {}
    const bumpInsp = (insp: any, k: 'sols' | 'certs') => {
      if (!insp) return
      const nombre = `${insp.nombre ?? ''} ${insp.apellidos ?? ''}`.trim()
      if (!nombre) return
      if (!inspStats[nombre]) inspStats[nombre] = { nombre, sols: 0, certs: 0 }
      inspStats[nombre][k]++
    }
    for (const s of solicitudes ?? []) bumpInsp(s.inspector, 'sols')
    for (const c of certEmitidos ?? []) bumpInsp((c as any).inspector_ejecutor ?? c.inspector, 'certs')
    const topInspectores = Object.values(inspStats)
      .sort((a, b) => (b.certs * 2 + b.sols) - (a.certs * 2 + a.sols))
      .slice(0, 8)

    // 5. Distribución por día (Lun-Vie)
    const porDia: Record<string, { sols: number; folios: number; certs: number }> = {}
    for (const fecha of fechasSemana) porDia[fecha] = { sols: 0, folios: 0, certs: 0 }

    for (const s of solicitudes ?? []) {
      const fecha = (() => {
        const d = new Date(s.created_at)
        const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
        return `${hermo.getUTCFullYear()}-${String(hermo.getUTCMonth()+1).padStart(2,'0')}-${String(hermo.getUTCDate()).padStart(2,'0')}`
      })()
      if (porDia[fecha]) porDia[fecha].sols++
    }
    for (const f of foliosAsig ?? []) {
      if (!f.fecha_asignacion) continue
      const d = new Date(f.fecha_asignacion)
      const hermo = new Date(d.getTime() + HERMOSILLO_OFFSET_HOURS * 3600 * 1000)
      const fecha = `${hermo.getUTCFullYear()}-${String(hermo.getUTCMonth()+1).padStart(2,'0')}-${String(hermo.getUTCDate()).padStart(2,'0')}`
      if (porDia[fecha]) porDia[fecha].folios++
    }
    for (const c of certEmitidos ?? []) {
      const fecha = String(c.fecha_emision_certificado ?? '').slice(0, 10)
      if (porDia[fecha]) porDia[fecha].certs++
    }

    // ── Destinatarios ───────────────────────────────────────────────────────
    const { data: destinatarios } = await db
      .from('usuarios')
      .select('email, nombre')
      .in('rol', ['admin', 'inspector_responsable'])
      .eq('activo', true)
      .not('email', 'is', null)

    let emails = (destinatarios ?? []).map(d => d.email).filter((e): e is string => !!e)

    // Filtro sandbox Resend (igual que en el reporte diario)
    const ownerOnly = process.env.RESEND_OWNER_EMAIL?.trim().toLowerCase()
    let filtradoSandbox = false
    if (ownerOnly) {
      const allowed = emails.filter(e => e.toLowerCase() === ownerOnly)
      emails = allowed.length > 0 ? allowed : [ownerOnly]
      filtradoSandbox = true
    }

    if (emails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no_recipients' })
    }

    const summary = {
      solicitudes:    (solicitudes ?? []).length,
      folios_asig:    (foliosAsig ?? []).length,
      certs_emitidos: (certEmitidos ?? []).length,
    }
    const sinActividad = summary.solicitudes === 0 && summary.folios_asig === 0 && summary.certs_emitidos === 0

    const html = renderEmail({
      lunesLabel:     fechaCortaHermosillo(desdeUTC),
      hoyLabel:       fechaHermosilloLabel(),
      hora_corte:     horaHermosilloLabel(ahora),
      summary,
      solicitudes:    solicitudes ?? [],
      folios_asig:    (foliosAsig ?? []).map(f => ({
                        ...f,
                        cliente_inferido: folioToCliente[f.id] ?? '—',
                      })),
      certs_emitidos: certEmitidos ?? [],
      por_dia:        fechasSemana.map(f => ({
                        fecha:      f,
                        diaCorto:   diaSemanaHermosillo(f + 'T12:00:00Z'),
                        fechaCorta: fechaCortaHermosillo(new Date(f + 'T12:00:00Z')),
                        ...porDia[f],
                      })),
      top_inspectores: topInspectores,
      sin_actividad:   sinActividad,
    })

    await sendEmail({
      to:      emails,
      subject: sinActividad
        ? `[UIIE] Resumen semanal — sin actividad`
        : `[UIIE] Resumen semanal — ${summary.solicitudes} solicitudes · ${summary.certs_emitidos} certs · ${summary.folios_asig} folios`,
      html,
      text: `Resumen semanal UIIE: ${summary.solicitudes} solicitudes, ${summary.folios_asig} folios asignados, ${summary.certs_emitidos} certificados emitidos. Detalles en el correo HTML.`,
    })

    return NextResponse.json({
      ok: true,
      sent: emails.length,
      summary,
      ventana: { desde: desdeISO, hasta: ahora.toISOString() },
      ...(filtradoSandbox ? { sandbox_filtered_to: emails } : {}),
    })
  } catch (err: any) {
    console.error('[cron/reporte-semanal]', err)
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
  lunesLabel:      string
  hoyLabel:        string
  hora_corte:      string
  summary:         { solicitudes: number; folios_asig: number; certs_emitidos: number }
  solicitudes:     any[]
  folios_asig:     any[]
  certs_emitidos:  any[]
  por_dia:         Array<{ fecha: string; diaCorto: string; fechaCorta: string; sols: number; folios: number; certs: number }>
  top_inspectores: Array<{ nombre: string; sols: number; certs: number }>
  sin_actividad:   boolean
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

  const seccionPorDia = `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:700;">📅 Distribución diaria</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#4b5563;">
        <tr style="background:#f9fafb;">
          <td style="padding:8px;font-weight:600;">Día</td>
          <td style="padding:8px;text-align:center;font-weight:600;">Solicitudes</td>
          <td style="padding:8px;text-align:center;font-weight:600;">Folios</td>
          <td style="padding:8px;text-align:center;font-weight:600;">Certificados</td>
        </tr>
        ${d.por_dia.map(p => `
          <tr style="border-top:1px solid #f3f4f6;">
            <td style="padding:8px;text-transform:capitalize;"><strong>${p.diaCorto}</strong> <span style="color:#9ca3af;">${p.fechaCorta}</span></td>
            <td style="padding:8px;text-align:center;color:${p.sols > 0 ? verde : '#d1d5db'};font-weight:${p.sols > 0 ? '600' : '400'};">${p.sols}</td>
            <td style="padding:8px;text-align:center;color:${p.folios > 0 ? naranja : '#d1d5db'};font-weight:${p.folios > 0 ? '600' : '400'};">${p.folios}</td>
            <td style="padding:8px;text-align:center;color:${p.certs > 0 ? '#2563eb' : '#d1d5db'};font-weight:${p.certs > 0 ? '600' : '400'};">${p.certs}</td>
          </tr>
        `).join('')}
      </table>
    </td></tr>
  `

  const seccionTopInsp = d.top_inspectores.length === 0 ? seccionVacia('🏅 Inspectores con actividad') : `
    <tr><td style="padding:14px 0;border-top:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:700;">🏅 Top inspectores de la semana</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;">
        ${d.top_inspectores.map((i, idx) => `
          <tr style="border-top:1px solid #f3f4f6;">
            <td style="padding:8px;width:30px;color:#9ca3af;">#${idx + 1}</td>
            <td style="padding:8px;"><strong style="color:#111827;">${escapeHtml(i.nombre)}</strong></td>
            <td style="padding:8px;text-align:right;color:${verde};font-weight:600;">${i.sols} sol.</td>
            <td style="padding:8px;text-align:right;color:#2563eb;font-weight:600;">${i.certs} cert.</td>
          </tr>
        `).join('')}
      </table>
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
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Resumen semanal</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;text-transform:capitalize;">
              Semana del ${escapeHtml(d.lunesLabel)} al viernes ${escapeHtml(d.hoyLabel)}
            </p>
            <p style="margin:2px 0 0;color:${naranja};font-size:11px;font-weight:600;letter-spacing:1px;">UIIE-CRE-021 · corte ${escapeHtml(d.hora_corte)} Hermosillo</p>
          </td>
        </tr>

        ${d.sin_actividad ? `
          <tr><td style="padding:40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:14px;">No hubo movimiento operativo esta semana.</p>
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
              ${seccionPorDia}
              ${seccionTopInsp}
              ${seccionSolicitudes}
              ${seccionFolios}
              ${seccionCerts}
            </table>
          </td></tr>
        `}

        <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
            Reporte semanal automático generado por UIIE · Viernes ${escapeHtml(d.hora_corte)} hora Hermosillo
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
