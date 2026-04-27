import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Auth check with user client (respects JWT)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Role check — inspector, auxiliar, admin, inspector_responsable all allowed
    const { data: u } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    const rolesPermitidos = ['admin', 'inspector_responsable', 'inspector', 'auxiliar']
    if (!u || !rolesPermitidos.includes(u.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Use service client for storage + DB writes (bypasses RLS)
    const db = await createServiceClient()

    const formData = await req.formData()

    const id = formData.get('id') as string | null
    const marca = (formData.get('marca') as string)?.trim()
    const modelo = (formData.get('modelo') as string)?.trim()
    const potencia_kw = formData.get('potencia_kw') as string
    const fase = formData.get('fase') as string
    const tipo = formData.get('tipo') as string
    const eficiencia = formData.get('eficiencia') as string
    const tension_ac = formData.get('tension_ac') as string
    const corriente_max = formData.get('corriente_max') as string
    const certificacion = formData.get('certificacion') as string
    const justificacion_ieee1547 = (formData.get('justificacion_ieee1547') as string)?.trim() || null
    const activo = formData.get('activo') === 'true'

    const fichaTecnicaFile = formData.get('ficha_tecnica') as File | null
    const certificadoFile = formData.get('certificado') as File | null

    if (!marca || !modelo || !potencia_kw || !fase || !tipo || !certificacion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: marca, modelo, potencia_kw, fase, tipo, certificacion' },
        { status: 400 }
      )
    }

    // Determina el ID a usar para las rutas de Storage
    const storageId = id ?? crypto.randomUUID()

    // Sube ficha técnica si se proporcionó
    let ficha_tecnica_url: string | null = null
    if (fichaTecnicaFile && fichaTecnicaFile.size > 0) {
      const path = `inversores/${storageId}-ficha.pdf`
      const { error: uploadError } = await db.storage
        .from('catalogos')
        .upload(path, fichaTecnicaFile, {
          contentType: 'application/pdf',
          upsert: true,
        })
      if (uploadError) throw new Error(`Error al subir ficha técnica: ${uploadError.message}`)
      ficha_tecnica_url = path
    }

    // Sube certificado si se proporcionó
    let certificado_url: string | null = null
    if (certificadoFile && certificadoFile.size > 0) {
      const path = `inversores/${storageId}-cert.pdf`
      const { error: uploadError } = await db.storage
        .from('catalogos')
        .upload(path, certificadoFile, {
          contentType: 'application/pdf',
          upsert: true,
        })
      if (uploadError) throw new Error(`Error al subir certificado: ${uploadError.message}`)
      certificado_url = path
    }

    const payload: Record<string, any> = {
      marca,
      modelo,
      potencia_kw: potencia_kw ? parseFloat(potencia_kw) : null,
      fase,
      tipo,
      eficiencia: eficiencia ? parseFloat(eficiencia) : null,
      tension_ac: tension_ac ? parseFloat(tension_ac) : null,
      corriente_max: corriente_max ? parseFloat(corriente_max) : null,
      certificacion,
      justificacion_ieee1547,
      activo,
    }

    if (ficha_tecnica_url) payload.ficha_tecnica_url = ficha_tecnica_url
    if (certificado_url) payload.certificado_url = certificado_url

    if (id) {
      // UPDATE
      const { data, error } = await db
        .from('inversores')
        .update(payload)
        .eq('id', id)
        .select('id, marca, modelo')
        .single()

      if (error) throw error

      return NextResponse.json({ id: data.id, marca: data.marca, modelo: data.modelo })
    } else {
      // INSERT
      const { data, error } = await db
        .from('inversores')
        .insert(payload)
        .select('id, marca, modelo')
        .single()

      if (error) throw error

      // Si los archivos se subieron con storageId temporal y el id real es diferente, renombrar
      if ((ficha_tecnica_url || certificado_url) && data.id !== storageId) {
        if (ficha_tecnica_url) {
          const newPath = `inversores/${data.id}-ficha.pdf`
          await db.storage.from('catalogos').move(ficha_tecnica_url, newPath)
          await db.from('inversores').update({ ficha_tecnica_url: newPath }).eq('id', data.id)
        }
        if (certificado_url) {
          const newPath = `inversores/${data.id}-cert.pdf`
          await db.storage.from('catalogos').move(certificado_url, newPath)
          await db.from('inversores').update({ certificado_url: newPath }).eq('id', data.id)
        }
      }

      return NextResponse.json(
        { id: data.id, marca: data.marca, modelo: data.modelo },
        { status: 201 }
      )
    }
  } catch (err: any) {
    console.error('[POST /api/inversores/guardar]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
