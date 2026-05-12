/**
 * Script one-shot para generar un Informe de Inspección de un expediente real
 * y guardarlo en /tmp para revisarlo. No forma parte del runtime de la app.
 *
 * Uso:
 *   npx tsx scripts/generar-informe-ejemplo.ts <expediente_id>
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Cargar .env.local manualmente (sin depender de dotenv)
function loadEnv(filename: string) {
  try {
    const txt = fs.readFileSync(filename, 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue
      const [, k, v] = m
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, '')
    }
  } catch { /* opcional */ }
}
loadEnv(path.join(process.cwd(), '.env.local'))
loadEnv(path.join(process.cwd(), '.env'))
import { construirInformeData } from '../lib/informe-inspeccion-loader'
import { generarInformeInspeccionDocx } from '../lib/docx/InformeInspeccionDocx'

async function main() {
  const expedienteId = process.argv[2]
  if (!expedienteId) {
    console.error('Uso: npx tsx scripts/generar-informe-ejemplo.ts <expediente_id>')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const db = createClient(url, key, { auth: { persistSession: false } })

  console.log(`Cargando expediente ${expedienteId}…`)
  const datos = await construirInformeData(db as any, expedienteId)
  if (!datos) {
    console.error('Expediente no encontrado.')
    process.exit(1)
  }

  console.log(`Folio: ${datos.folio}`)
  console.log(`Cliente: ${datos.cliente_nombre}`)
  console.log(`Inversores: ${datos.inversores.length} modelo(s)`)
  console.log(`Documentos: ${datos.documentos_inspeccionados.length}`)
  console.log(`Testigos: ${datos.testigos.length}`)

  console.log('Generando docx…')
  const buffer = await generarInformeInspeccionDocx(datos)

  const outDir = '/tmp'
  const outPath = path.join(outDir, `Informe-Inspeccion-${datos.folio}.docx`)
  fs.writeFileSync(outPath, buffer)
  console.log(`\n✓ Guardado en: ${outPath}`)
  console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`)
}

main().catch((e) => { console.error(e); process.exit(1) })
