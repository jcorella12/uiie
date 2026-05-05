import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/clientes/ines — agrega una INE al cliente
 *   FormData: cliente_id, etiqueta, file_frente?, file_reverso?, ocr fields
 *
 * DELETE /api/clientes/ines — quita una INE
 *   Body: { id }
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const cliente_id    = (formData.get('cliente_id') as string)?.trim()
  const etiqueta      = (formData.get('etiqueta') as string)?.trim() || 'INE'
  const nombre_completo = (formData.get('nombre_completo') as string)?.trim() || null
  const numero_ine    = (formData.get('numero_ine') as string)?.trim() || null
  const curp          = (formData.get('curp') as string)?.trim() || null
  const clave_elector = (formData.get('clave_elector') as string)?.trim() || null
  const vigencia      = (formData.get('vigencia') as string)?.trim() || null
  const domicilio     = (formData.get('domicilio') as string)?.trim() || null
  const notas         = (formData.get('notas') as string)?.trim() || null

  if (!cliente_id) {
    return NextResponse.json({ error: 'Falta cliente_id' }, { status: 400 })
  }

  // Verificar permisos via RLS leyendo el cliente
  const { data: cli } = await supabase.from('clientes').select('id').eq('id', cliente_id).maybeSingle()
  if (!cli) return NextResponse.json({ error: 'Cliente no accesible' }, { status: 403 })

  // Subir archivos a storage
  const svc = await createServiceClient()
  const paths: { ine_url_frente?: string; ine_url_reverso?: string } = {}

  for (const lado of ['frente', 'reverso'] as const) {
    const f = formData.get(`file_${lado}`) as File | null
    if (!f || f.size === 0) continue
    if (f.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: `${f.name} excede 10 MB` }, { status: 413 })
    }
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      return NextResponse.json({ error: `${f.name} debe ser imagen o PDF` }, { status: 400 })
    }
    const ext = f.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `cliente_ines/${cliente_id}/${Date.now()}-${lado}.${ext}`
    const buf  = Buffer.from(await f.arrayBuffer())
    const { error } = await svc.storage.from('documentos').upload(path, buf, {
      contentType: f.type, upsert: false,
    })
    if (error) {
      return NextResponse.json({ error: `No se pudo subir: ${error.message}` }, { status: 500 })
    }
    paths[`ine_url_${lado}`] = path
  }

  const { data, error } = await supabase
    .from('cliente_ines')
    .insert({
      cliente_id,
      etiqueta,
      nombre_completo,
      numero_ine,
      curp,
      clave_elector,
      vigencia,
      domicilio,
      notas,
      creado_por: user.id,
      ...paths,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  // Cargar para borrar archivos de storage
  const { data: row } = await supabase
    .from('cliente_ines').select('ine_url_frente, ine_url_reverso').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'No accesible' }, { status: 403 })

  const svc = await createServiceClient()
  const paths = [row.ine_url_frente, row.ine_url_reverso].filter(Boolean) as string[]
  if (paths.length > 0) {
    await svc.storage.from('documentos').remove(paths)
  }

  const { error } = await supabase.from('cliente_ines').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
