import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Guarda un array de participantes ya procesados por la IA (segunda etapa de importación)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar'].includes(perfil?.rol ?? '')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await req.json()
    const participantes = body.participantes as any[]

    if (!Array.isArray(participantes) || participantes.length === 0) {
      return NextResponse.json({ error: 'Sin participantes' }, { status: 400 })
    }

    const rolesValidos = ['testigo', 'representante', 'firmante', 'atiende', 'otro']

    const rows = participantes
      .filter(p => p.nombre && p.apellidos)
      .map(p => ({
        nombre:          String(p.nombre).trim(),
        apellidos:       String(p.apellidos).trim(),
        empresa:         p.empresa?.trim() || null,
        email:           p.email?.trim().toLowerCase() || null,
        telefono:        p.telefono?.trim() || null,
        rol:             rolesValidos.includes(p.rol ?? '') ? p.rol : 'testigo',
        curp:            p.curp?.trim().toUpperCase() || null,
        numero_ine:      p.numero_ine?.trim() || null,
        clave_elector:   p.clave_elector?.trim() || null,
        domicilio:       p.domicilio?.trim() || null,
        colonia:         p.colonia?.trim() || null,
        cp:              p.cp?.trim() || null,
        ciudad:          p.ciudad?.trim() || null,
        estado:          p.estado?.trim() || null,
        activo:          true,
        creado_por:      user.id,
        // Archivo INE subido a Storage durante el OCR masivo
        ine_url_frente:  p._storageKey ?? null,
        ine_url_reverso: p._storageKey ?? null,  // mismo PDF tiene ambas caras
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay participantes válidos' }, { status: 400 })
    }

    const { data: insertados, error: insertError } = await supabase
      .from('testigos')
      .insert(rows)
      .select('id, nombre, apellidos')

    if (insertError) throw insertError

    return NextResponse.json({
      guardados: insertados?.length ?? 0,
      participantes: insertados,
    }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/testigos/importar-json]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
