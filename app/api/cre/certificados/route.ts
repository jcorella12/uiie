import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — agregar un certificado CRE
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const {
      numero_certificado, titulo, url_cre, url_acuse, url_qr,
      resumen_acta, fecha_emision, expediente_id,
      storage_path_cert, storage_path_acuse,
    } = body

    // Número de certificado siempre requerido
    if (!numero_certificado?.trim()) {
      return NextResponse.json({ error: 'Número de certificado requerido' }, { status: 400 })
    }
    // Necesitamos AL MENOS uno: URL externa O archivo subido a storage
    if (!url_cre?.trim() && !storage_path_cert?.trim()) {
      return NextResponse.json({
        error: 'Adjunta el PDF del certificado o ingresa el UUID de la bóveda CRE'
      }, { status: 400 })
    }

    // Validar que las URLs sean HTTPS si vienen
    const urlsAValidar = [url_cre, url_acuse, url_qr].filter(Boolean) as string[]
    for (const u of urlsAValidar) {
      if (!u.startsWith('https://')) {
        return NextResponse.json({ error: 'Las URLs deben usar HTTPS' }, { status: 400 })
      }
    }

    const db = await createServiceClient()

    // Insertar y luego re-fetch con todos los joins para que la UI tenga
    // folio, inspector, cliente final, ciudad y estado desde el primer momento
    const { data: inserted, error } = await db
      .from('certificados_cre')
      .insert({
        numero_certificado: numero_certificado.trim(),
        titulo:             titulo?.trim()        || null,
        url_cre:            url_cre?.trim()       || null,
        url_acuse:          url_acuse?.trim()     || null,
        url_qr:             url_qr?.trim()        || null,
        storage_path_cert:  storage_path_cert?.trim()  || null,
        storage_path_acuse: storage_path_acuse?.trim() || null,
        resumen_acta:       resumen_acta?.trim()  || null,
        fecha_emision:      fecha_emision         || null,
        expediente_id:      expediente_id         || null,
        created_by:         user.id,
      })
      .select('id')
      .single()

    if (error) throw error

    // Re-fetch con joins completos (mismo select que el dashboard)
    const { data: certificado, error: fetchErr } = await db
      .from('certificados_cre')
      .select(`
        id, numero_certificado, titulo, url_cre, url_acuse, url_qr,
        resumen_acta, fecha_emision, created_at,
        expediente:expedientes(
          id, numero_folio, ciudad, estado_mx, nombre_cliente_final,
          inspector:usuarios!inspector_id(nombre, apellidos),
          cliente:clientes(nombre)
        )
      `)
      .eq('id', inserted.id)
      .single()

    if (fetchErr) throw fetchErr
    return NextResponse.json({ success: true, certificado })
  } catch (err: any) {
    console.error('[cre/certificados POST]', err)
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}

// DELETE — eliminar un certificado CRE
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (!u || !['admin', 'inspector_responsable'].includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el ID' }, { status: 400 })

    const db = await createServiceClient()
    const { error } = await db.from('certificados_cre').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 })
  }
}
