import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!perfil || !['admin', 'inspector_responsable', 'inspector', 'auxiliar', 'cliente'].includes(perfil.rol)) {
      return NextResponse.json({ error: 'Sin permiso para gestionar participantes' }, { status: 403 })
    }

    const body = await req.json()
    const {
      id,
      nombre,
      apellidos,
      empresa,
      email,
      telefono,
      rol,
      curp,
      numero_ine,
      clave_elector,
      domicilio,
      colonia,
      cp,
      ciudad,
      estado,
      activo,
      // OCR pre-llenado desde scan
      ocr_nombre,
      ocr_curp,
      ocr_clave_elector,
      ocr_vigencia,
      ocr_domicilio,
      ocr_numero_ine,
    } = body

    if (!nombre || !apellidos) {
      return NextResponse.json(
        { error: 'Nombre y apellidos son requeridos' },
        { status: 400 }
      )
    }

    const rolesValidos = ['testigo', 'representante', 'firmante', 'atiende', 'otro']

    const payload: Record<string, any> = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      empresa: empresa?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      telefono: telefono?.trim() || null,
      rol: rolesValidos.includes(rol) ? rol : 'testigo',
      curp: curp?.trim().toUpperCase() || null,
      numero_ine: numero_ine?.trim() || null,
      clave_elector: clave_elector?.trim() || null,
      domicilio: domicilio?.trim() || null,
      colonia: colonia?.trim() || null,
      cp: cp?.trim() || null,
      ciudad: ciudad?.trim() || null,
      estado: estado?.trim() || null,
      // OCR data si viene del scan previo
      ...(ocr_nombre        ? { ocr_nombre:        ocr_nombre.trim() }                : {}),
      ...(ocr_curp          ? { ocr_curp:          ocr_curp.trim().toUpperCase() }    : {}),
      ...(ocr_clave_elector ? { ocr_clave_elector: ocr_clave_elector.trim() }         : {}),
      ...(ocr_vigencia      ? { ocr_vigencia:      ocr_vigencia.trim() }              : {}),
      ...(ocr_domicilio     ? { ocr_domicilio:     ocr_domicilio.trim() }             : {}),
      ...(ocr_numero_ine    ? { ocr_numero_ine:    ocr_numero_ine.trim() }            : {}),
    }

    if (id) {
      // UPDATE
      payload.activo = activo ?? true
      const { data, error } = await supabase
        .from('testigos')
        .update(payload)
        .eq('id', id)
        .select('id, nombre, apellidos')
        .single()

      if (error) throw error

      return NextResponse.json({ id: data.id, nombre: `${data.nombre} ${data.apellidos}` })
    } else {
      // INSERT — pero antes deduplicar por número de INE
      // Evita la duplicación reportada en Prueba 01 ("Ignacio Cruz Miguel" aparecía 3x).
      if (payload.numero_ine) {
        const { data: existente } = await supabase
          .from('testigos')
          .select('id, nombre, apellidos, telefono, email')
          .eq('numero_ine', payload.numero_ine)
          .eq('activo', true)
          .maybeSingle()
        if (existente) {
          // Mejorar el registro existente con los nuevos datos no nulos (sin sobreescribir)
          const mejoras: Record<string, any> = {}
          if (payload.telefono && !existente.telefono) mejoras.telefono = payload.telefono
          if (payload.email    && !existente.email)    mejoras.email    = payload.email
          if (Object.keys(mejoras).length > 0) {
            await supabase.from('testigos').update(mejoras).eq('id', existente.id)
          }
          return NextResponse.json({
            id: existente.id,
            nombre: `${existente.nombre} ${existente.apellidos ?? ''}`.trim(),
            existing: true,
          })
        }
      }
      payload.activo = true
      payload.creado_por = user.id
      const { data, error } = await supabase
        .from('testigos')
        .insert(payload)
        .select('id, nombre, apellidos')
        .single()

      if (error) throw error

      return NextResponse.json({ id: data.id, nombre: `${data.nombre} ${data.apellidos}` }, { status: 201 })
    }
  } catch (err: any) {
    console.error('[POST /api/testigos/guardar]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
