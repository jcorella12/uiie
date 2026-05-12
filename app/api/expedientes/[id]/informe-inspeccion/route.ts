/**
 * GET /api/expedientes/[id]/informe-inspeccion
 *
 * Descarga el Informe de Inspección (.docx) de un expediente. Es el documento
 * narrativo que las DACG exigen junto con el Acta y la Lista de Verificación.
 * También se incluye automáticamente dentro del ZIP del expediente (carpeta
 * "9. INFORME DE INSPECCIÓN") — este endpoint sirve para previsualizarlo
 * sin tener que generar todo el paquete.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generarInformeInspeccionDocx } from '@/lib/docx/InformeInspeccionDocx'
import { construirInformeData } from '@/lib/informe-inspeccion-loader'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!u || !rolesPermitidos.includes(u.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // ── Cargar y construir datos ────────────────────────────────────────────────
  const db = await createServiceClient()
  const datos = await construirInformeData(db, params.id)
  if (!datos) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // ── Generar docx ────────────────────────────────────────────────────────────
  const buffer = await generarInformeInspeccionDocx(datos)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Informe-Inspeccion-${datos.folio}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
