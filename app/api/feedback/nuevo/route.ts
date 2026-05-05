import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const TIPOS = ['bug', 'mejora', 'pregunta', 'otro'] as const

/**
 * POST /api/feedback/nuevo
 *
 * Multipart con:
 *   tipo:        'bug' | 'mejora' | 'pregunta' | 'otro'
 *   titulo:      string (1-200)
 *   descripcion: string (opcional, larga)
 *   url_pagina:  string (opcional, URL desde donde se reporta)
 *   user_agent:  string (opcional)
 *   prioridad:   1-5 (opcional, default 3)
 *   screenshot[]: File (0..N imágenes/PDFs)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const tipo        = (formData.get('tipo') as string)?.trim() || 'bug'
  const titulo      = (formData.get('titulo') as string)?.trim() || ''
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  const url_pagina  = (formData.get('url_pagina') as string)?.trim() || null
  const user_agent  = (formData.get('user_agent') as string)?.trim() || null
  const prioridadRaw = formData.get('prioridad') as string | null
  const prioridad = prioridadRaw ? Math.max(1, Math.min(5, parseInt(prioridadRaw, 10) || 3)) : 3

  if (!TIPOS.includes(tipo as any)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  if (!titulo || titulo.length > 200) {
    return NextResponse.json({ error: 'El título es obligatorio (máx 200 caracteres)' }, { status: 400 })
  }

  // ── Subir screenshots al bucket documentos ──────────────────────────────
  const svc = await createServiceClient()
  const screenshots: { path: string; nombre: string; size: number }[] = []
  const files = formData.getAll('screenshot').filter(f => f instanceof File) as File[]

  for (const file of files) {
    if (file.size === 0) continue
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: `${file.name} excede 10 MB` }, { status: 413 })
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: `${file.name} debe ser imagen o PDF` }, { status: 400 })
    }
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `feedback/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buf  = Buffer.from(await file.arrayBuffer())
    const { error } = await svc.storage.from('documentos').upload(path, buf, {
      contentType: file.type, upsert: false,
    })
    if (error) {
      return NextResponse.json({ error: `No se pudo subir ${file.name}: ${error.message}` }, { status: 500 })
    }
    screenshots.push({ path, nombre: file.name, size: file.size })
  }

  // ── Insertar feedback ───────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      usuario_id: user.id,
      tipo,
      titulo,
      descripcion,
      url_pagina,
      user_agent,
      prioridad,
      screenshots,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ id: data.id, ok: true })
}
