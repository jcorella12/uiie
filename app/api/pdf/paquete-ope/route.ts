import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Documentos requeridos para el paquete OPE, en orden de aparición
const REQUERIDOS = [
  { tipo: 'acta',               label: 'Acta de Inspección firmada' },
  { tipo: 'lista_verificacion', label: 'Lista de Verificación firmada' },
  { tipo: 'dictamen',           label: 'Dictamen UVIE' },
  { tipo: 'resolutivo',         label: 'Resolutivo CFE' },
] as const

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).maybeSingle()
  const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
  if (!rolesPermitidos.includes(perfil?.rol ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get('expediente_id')
  if (!id) return NextResponse.json({ error: 'Falta expediente_id' }, { status: 400 })

  // Verificar que el expediente existe y el usuario tiene acceso (RLS lo filtra)
  const { data: exp, error: expError } = await supabase
    .from('expedientes')
    .select('id, numero_folio')
    .eq('id', id)
    .single()

  if (expError || !exp) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  // Cargar documentos del expediente
  const { data: documentos } = await supabase
    .from('documentos_expediente')
    .select('id, tipo, nombre, storage_path')
    .eq('expediente_id', id)

  const docs = documentos ?? []

  // Verificar que están los 4 requeridos
  const faltantes = REQUERIDOS.filter(r => !docs.some(d => d.tipo === r.tipo))

  if (faltantes.length > 0) {
    return NextResponse.json({
      error: 'Faltan documentos para generar el paquete OPE',
      faltantes: faltantes.map(f => f.label),
    }, { status: 422 })
  }

  // Combinar PDFs en orden: Acta → Lista → Dictamen → Resolutivo
  const { PDFDocument } = await import('pdf-lib')
  const mergedPdf = await PDFDocument.create()

  async function agregarDoc(tipo: string) {
    const doc = docs.find(d => d.tipo === tipo)
    if (!doc?.storage_path) return
    const { data: blob } = await supabase.storage
      .from('documentos')
      .download(doc.storage_path)
    if (!blob) return
    try {
      const pdf = await PDFDocument.load(await blob.arrayBuffer())
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(p => mergedPdf.addPage(p))
    } catch (err) {
      console.error(`[paquete-ope] No se pudo agregar ${tipo}:`, err)
    }
  }

  for (const r of REQUERIDOS) {
    await agregarDoc(r.tipo)
  }

  const paqueteBytes = await mergedPdf.save()
  const folio = exp.numero_folio ?? id

  return new NextResponse(Buffer.from(paqueteBytes) as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PaqueteOPE-${folio}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
