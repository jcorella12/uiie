import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/ai'
import { registrarCostoIA } from '@/lib/ai/cost'

// ─── Prompt OCR especializado para importación masiva ─────────────────────────
// Extrae nombre Y apellidos por separado para poder guardarlos en la tabla
const PROMPT_INE_BULK = `Eres un sistema OCR especializado en Credenciales para Votar (INE/IFE) mexicanas.
Este archivo puede ser un PDF con una o ambas caras, o una imagen de un lado de la credencial.

Extrae todos los datos disponibles y responde ÚNICAMENTE con este JSON (sin markdown):

{
  "nombre": "SOLO los nombres de pila (sin apellidos), ej: 'JUAN PABLO'",
  "apellido_paterno": "primer apellido, ej: 'GARCIA'",
  "apellido_materno": "segundo apellido, ej: 'LOPEZ'",
  "curp": "CURP de 18 caracteres en mayúsculas, o null",
  "clave_elector": "clave de elector alfanumérica, o null",
  "vigencia": "año de vigencia (4 dígitos), o null",
  "domicilio_calle": "calle y número del campo DOMICILIO (ej: 'AV DE ANZA 900'), o null",
  "domicilio_colonia": "colonia sin prefijo COL/FRACC (ej: 'PITIC'), o null",
  "domicilio_cp": "código postal 5 dígitos, o null",
  "domicilio_municipio": "municipio o ciudad (ej: 'HERMOSILLO'), o null",
  "domicilio_estado": "estado completo (ej: 'SONORA'), o null",
  "numero_ine": "~12 dígitos del MRZ en reverso: primera línea después de '<<' (ej: '043907064679'), o null"
}

NOTAS IMPORTANTES:
- En el frente de la INE el nombre se muestra típicamente como: APELLIDO_PAT APELLIDO_MAT NOMBRE(S)
  o bien en secciones separadas. Sepáralos correctamente.
- Si solo ves un apellido, ponlo en apellido_paterno y deja apellido_materno null.
- El número INE está en el REVERSO en la primera línea del MRZ: patrón IDMEX...<< seguido de ~12 dígitos.
- Si el archivo solo muestra un lado, extrae lo que haya y deja el resto en null.`

// ─── Helper: normalizar estado mexicano ──────────────────────────────────────
const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','México','Michoacán','Morelos','Nayarit',
  'Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí',
  'Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]
const ABREV: Record<string, string> = {
  'AGS':'Aguascalientes','AGS.':'Aguascalientes',
  'BC':'Baja California','B.C.':'Baja California',
  'BCS':'Baja California Sur','B.C.S.':'Baja California Sur',
  'CAMP':'Campeche','CAMP.':'Campeche',
  'CHIS':'Chiapas','CHIS.':'Chiapas',
  'CHIH':'Chihuahua','CHIH.':'Chihuahua',
  'CDMX':'Ciudad de México','D.F.':'Ciudad de México','DF':'Ciudad de México',
  'COAH':'Coahuila','COAH.':'Coahuila',
  'COL':'Colima','COL.':'Colima',
  'DGO':'Durango','DGO.':'Durango',
  'GTO':'Guanajuato','GTO.':'Guanajuato',
  'GRO':'Guerrero','GRO.':'Guerrero',
  'HGO':'Hidalgo','HGO.':'Hidalgo',
  'JAL':'Jalisco','JAL.':'Jalisco',
  'MEX':'México','MEX.':'México','EDO MEX':'México','EDOMEX':'México',
  'MICH':'Michoacán','MICH.':'Michoacán',
  'MOR':'Morelos','MOR.':'Morelos',
  'NAY':'Nayarit','NAY.':'Nayarit',
  'NL':'Nuevo León','N.L.':'Nuevo León',
  'OAX':'Oaxaca','OAX.':'Oaxaca',
  'PUE':'Puebla','PUE.':'Puebla',
  'QRO':'Querétaro','QRO.':'Querétaro',
  'QROO':'Quintana Roo','Q.ROO':'Quintana Roo',
  'SLP':'San Luis Potosí','S.L.P.':'San Luis Potosí',
  'SIN':'Sinaloa','SIN.':'Sinaloa',
  'SON':'Sonora','SON.':'Sonora',
  'TAB':'Tabasco','TAB.':'Tabasco',
  'TAMPS':'Tamaulipas','TAMPS.':'Tamaulipas',
  'TLAX':'Tlaxcala','TLAX.':'Tlaxcala',
  'VER':'Veracruz','VER.':'Veracruz',
  'YUC':'Yucatán','YUC.':'Yucatán',
  'ZAC':'Zacatecas','ZAC.':'Zacatecas',
}
function normalizarEstado(raw: string | null | undefined): string {
  if (!raw) return ''
  const limpio = raw.trim().replace(/\.$/, '')
  const exacto = ESTADOS_MX.find(e => e.toLowerCase() === limpio.toLowerCase())
  if (exacto) return exacto
  const abrev = ABREV[limpio.toUpperCase()]
  if (abrev) return abrev
  const parcial = ESTADOS_MX.find(e =>
    e.toLowerCase().includes(limpio.toLowerCase()) ||
    limpio.toLowerCase().includes(e.toLowerCase())
  )
  return parcial ?? limpio
}

// ─── POST /api/testigos/importar-ines ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    let { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
      if (token) {
        const { data } = await supabase.auth.getUser(token)
        user = data.user
      }
    }
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: perfil } = await supabase
      .from('usuarios').select('rol').eq('id', user.id).single()
    if (!['admin', 'inspector_responsable', 'inspector', 'auxiliar', 'cliente'].includes(perfil?.rol ?? '')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const formData = await req.formData()
    // Puede venir como ines[] (múltiples) o ine (uno solo)
    const archivos = formData.getAll('ines') as File[]
    if (!archivos.length) {
      return NextResponse.json({ error: 'No se recibieron archivos INE' }, { status: 400 })
    }

    // expediente_id opcional: si viene, el archivo se persiste también como
    // `documento_expediente` (tipo='ine_participante') aunque después el
    // inspector no complete el paso "Guardar testigo". Antes los archivos
    // quedaban huérfanos en storage tras el OCR.
    const expedienteId = (formData.get('expediente_id') as string | null)?.trim() || null

    const resultados: Array<{
      archivo: string
      ok: boolean
      error?: string
      datos?: Record<string, any>
    }> = []

    for (const archivo of archivos) {
      const isPDF = archivo.type === 'application/pdf'
      const isImg = archivo.type.startsWith('image/')

      if (!isPDF && !isImg) {
        resultados.push({ archivo: archivo.name, ok: false, error: 'Tipo de archivo no soportado' })
        continue
      }

      try {
        const buffer = Buffer.from(await archivo.arrayBuffer())
        const base64 = buffer.toString('base64')

        let messageContent: any[]

        if (isPDF) {
          messageContent = [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: PROMPT_INE_BULK },
          ]
        } else {
          messageContent = [
            {
              type: 'image',
              source: { type: 'base64', media_type: archivo.type as any, data: base64 },
            },
            { type: 'text', text: PROMPT_INE_BULK },
          ]
        }

        let anthropic
        try { anthropic = getAnthropicClient() }
        catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
        const MODELO = CLAUDE_MODELS.OCR
        const message = await anthropic.messages.create({
          model: MODELO,
          max_tokens: 512,
          messages: [{ role: 'user', content: messageContent }],
        })

        // Registrar costo (uno por cada INE procesada)
        try {
          const dbAdmin = await createServiceClient()
          const { data: { user: usrCost } } = await supabase.auth.getUser()
          await registrarCostoIA({
            supabase:     dbAdmin,
            usuarioId:    usrCost?.id ?? null,
            expedienteId: null,
            endpoint:     'testigos/importar-ines',
            modelo:       MODELO,
            usage:        message.usage,
            detalle:      { archivo: archivo.name },
          })
        } catch {}

        const raw = (message.content[0] as any)?.text ?? ''
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

        // Construir apellidos combinados
        const apellidos = [parsed.apellido_paterno, parsed.apellido_materno]
          .filter(Boolean).join(' ').trim() || null

        if (!parsed.nombre && !apellidos) {
          resultados.push({ archivo: archivo.name, ok: false, error: 'No se pudo extraer nombre de la INE' })
          continue
        }

        // Título-case para presentar mejor
        const toTitle = (s: string | null) =>
          s ? s.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null

        const estadoNorm = normalizarEstado(parsed.domicilio_estado)

        // ── Subir archivo a Storage como respaldo ────────────────────────────
        let storageKey: string | null = null
        try {
          const ext = isPDF ? 'pdf' : (archivo.name.split('.').pop()?.toLowerCase() ?? 'jpg')
          const storageId = crypto.randomUUID()
          const storagePath = `ocr/testigo/bulk-import/${storageId}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(storagePath, buffer, { contentType: archivo.type, upsert: false })
          if (!uploadError) storageKey = storagePath
        } catch {
          // no fatal si falla el upload; los datos OCR siguen siendo válidos
        }

        // ── Persistir como documento del expediente (si vino expediente_id) ──
        // Sin esto, cada vez que se sube una INE para OCR el archivo quedaba
        // flotando en storage sin referencia. Ahora queda atado al expediente
        // como tipo `ine_participante`, así el ZIP del respaldo lo incluye en
        // "6. IDENTIFICACIONES" aunque el inspector no complete el flujo de
        // "Guardar testigo".
        if (storageKey && expedienteId) {
          try {
            const dbAdmin = await createServiceClient()
            const nombreCompleto = [parsed.nombre, apellidos].filter(Boolean).join(' ').trim() || archivo.name
            await dbAdmin.from('documentos_expediente').insert({
              expediente_id:       expedienteId,
              nombre:              `INE - ${nombreCompleto}`,
              tipo:                'ine_participante',
              storage_path:        storageKey,
              mime_type:           archivo.type || null,
              tamano_bytes:        archivo.size || null,
              subido_por_cliente:  false,
            })
          } catch (e: any) {
            // no fatal — el OCR ya tuvo éxito; solo se pierde el respaldo
            // automático en documentos_expediente.
            console.warn('[importar-ines] No se pudo persistir como documento:', e?.message)
          }
        }

        resultados.push({
          archivo: archivo.name,
          ok: true,
          datos: {
            nombre:        toTitle(parsed.nombre)               ?? '',
            apellidos:     toTitle(apellidos)                   ?? '',
            curp:          parsed.curp                          ?? null,
            clave_elector: parsed.clave_elector                 ?? null,
            numero_ine:    parsed.numero_ine                    ?? null,
            domicilio:     parsed.domicilio_calle               ?? null,
            colonia:       parsed.domicilio_colonia             ?? null,
            cp:            parsed.domicilio_cp                  ?? null,
            ciudad:        toTitle(parsed.domicilio_municipio)  ?? null,
            estado:        estadoNorm || null,
            _archivo:      archivo.name,
            _storageKey:   storageKey,   // ruta en Storage para vincular al testigo
          },
        })
      } catch (e: any) {
        resultados.push({ archivo: archivo.name, ok: false, error: `Error OCR: ${e?.message ?? 'desconocido'}` })
      }
    }

    const exitosos = resultados.filter(r => r.ok && r.datos)
    const fallidos = resultados.filter(r => !r.ok)

    return NextResponse.json({
      participantes: exitosos.map(r => r.datos),
      fallidos: fallidos.map(r => ({ archivo: r.archivo, error: r.error })),
      total: exitosos.length,
    })

  } catch (err: any) {
    console.error('[POST /api/testigos/importar-ines]', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}
