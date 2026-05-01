import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { registrarCostoIA } from '@/lib/ai/cost'

const anthropic = new Anthropic()

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestigoExtraido {
  nombre: string
  apellidos: string
  empresa?: string
  email?: string
  telefono?: string
  rol?: string
  curp?: string
  numero_ine?: string
  clave_elector?: string
  domicilio?: string
  colonia?: string
  cp?: string
  ciudad?: string
  estado?: string
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const PROMPT_CSV = `Eres un extractor de datos de participantes para un sistema de inspecciones de energía.
Se te proporciona el contenido de un archivo CSV o texto tabulado.

Extrae TODOS los participantes/personas que encuentres y devuelve un JSON con este formato exacto:
{
  "participantes": [
    {
      "nombre": "...",
      "apellidos": "...",
      "empresa": "...",
      "email": "...",
      "telefono": "...",
      "rol": "testigo|representante|firmante|atiende|otro",
      "curp": "...",
      "numero_ine": "...",
      "clave_elector": "...",
      "domicilio": "...",
      "colonia": "...",
      "cp": "...",
      "ciudad": "...",
      "estado": "..."
    }
  ],
  "total": 0,
  "errores": []
}

Reglas:
- nombre: SOLO el primer nombre (o nombres de pila). NUNCA incluyas apellidos aquí.
- apellidos: apellido paterno + materno.
- Si el archivo tiene columnas, úsalas directamente.
- Si el texto es libre (sin columnas claras), extrae lo que puedas.
- rol: si no está especificado usa "testigo".
- Omite campos que no puedas determinar (deja como null o no los incluyas).
- CURP: 18 caracteres alfanuméricos en mayúsculas.
- Si hay filas con errores claros (datos incompletos sin nombre), anótalos en "errores".
- IMPORTANTE: devuelve SOLO el JSON, sin markdown, sin explicaciones.`

// ─── Handler ──────────────────────────────────────────────────────────────────

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

    const formData = await req.formData()
    const archivo = formData.get('archivo') as File | null
    const textoLibre = formData.get('texto') as string | null
    const confirmar = formData.get('confirmar') === 'true'

    let contenidoTexto = ''

    if (archivo) {
      // Read text content (CSV, TXT, TSV)
      contenidoTexto = await archivo.text()
    } else if (textoLibre) {
      contenidoTexto = textoLibre
    } else {
      return NextResponse.json({ error: 'Se requiere un archivo o texto' }, { status: 400 })
    }

    if (!contenidoTexto.trim()) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    // ── Paso 1: Extracción con IA ──────────────────────────────────────────────
    const MODELO = 'claude-opus-4-5'
    const message = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${PROMPT_CSV}\n\n---CONTENIDO DEL ARCHIVO---\n${contenidoTexto.slice(0, 12000)}`,
        },
      ],
    })

    // Registrar costo
    const dbAdmin = await createServiceClient()
    const { data: { user: usrCost } } = await supabase.auth.getUser()
    await registrarCostoIA({
      supabase:     dbAdmin,
      usuarioId:    usrCost?.id ?? null,
      expedienteId: null,
      endpoint:     'testigos/importar',
      modelo:       MODELO,
      usage:        message.usage,
    })

    const raw = (message.content[0] as any)?.text ?? ''
    let parsed: { participantes: TestigoExtraido[]; total: number; errores: string[] }

    try {
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('[importar] parse error, raw:', raw.slice(0, 500))
      return NextResponse.json({ error: 'IA no devolvió JSON válido', raw: raw.slice(0, 500) }, { status: 500 })
    }

    const participantes = parsed.participantes ?? []

    // ── Paso 2: Si solo es preview, devolvemos los datos sin guardar ───────────
    if (!confirmar) {
      return NextResponse.json({
        preview: true,
        participantes,
        total: participantes.length,
        errores: parsed.errores ?? [],
      })
    }

    // ── Paso 3: Guardar en DB ──────────────────────────────────────────────────
    const rolesValidos = ['testigo', 'representante', 'firmante', 'atiende', 'otro']

    const rows = participantes
      .filter(p => p.nombre && p.apellidos)
      .map(p => ({
        nombre:        p.nombre.trim(),
        apellidos:     p.apellidos.trim(),
        empresa:       p.empresa?.trim() || null,
        email:         p.email?.trim().toLowerCase() || null,
        telefono:      p.telefono?.trim() || null,
        rol:           rolesValidos.includes(p.rol ?? '') ? p.rol : 'testigo',
        curp:          p.curp?.trim().toUpperCase() || null,
        numero_ine:    p.numero_ine?.trim() || null,
        clave_elector: p.clave_elector?.trim() || null,
        domicilio:     p.domicilio?.trim() || null,
        colonia:       p.colonia?.trim() || null,
        cp:            p.cp?.trim() || null,
        ciudad:        p.ciudad?.trim() || null,
        estado:        p.estado?.trim() || null,
        activo:        true,
        creado_por:    user.id,
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay participantes válidos para guardar' }, { status: 400 })
    }

    const { data: insertados, error: insertError } = await supabase
      .from('testigos')
      .insert(rows)
      .select('id, nombre, apellidos')

    if (insertError) throw insertError

    return NextResponse.json({
      guardados: insertados?.length ?? 0,
      participantes: insertados,
      errores: parsed.errores ?? [],
    }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/testigos/importar]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
