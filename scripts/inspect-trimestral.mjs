/**
 * Inspecciona el reporte trimestral para entender estructura.
 */
import XLSX from 'xlsx'
const wb = XLSX.readFile('/Users/joaquincorella/Downloads/ReporteTrimestral_Q1_2026 (1).xlsx')
console.log('Sheets:', wb.SheetNames)

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name]
  console.log(`\n${'═'.repeat(80)}`)
  console.log(`── HOJA: ${name} ── range ${ws['!ref'] ?? '(vacía)'}`)
  console.log('═'.repeat(80))

  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })
  // Imprime primeras 25 filas crudas
  for (let i = 0; i < Math.min(json.length, 25); i++) {
    const row = json[i]
    if (row && row.some(c => c !== null && c !== '')) {
      console.log(`  ${String(i+1).padStart(3)}: ${JSON.stringify(row)}`)
    } else {
      console.log(`  ${String(i+1).padStart(3)}: (fila vacía)`)
    }
  }
  if (json.length > 25) console.log(`  ... ${json.length - 25} filas más`)

  // Detectar merged cells (suelen marcar headers)
  if (ws['!merges']?.length) {
    console.log(`\n  Celdas combinadas: ${ws['!merges'].length}`)
    for (const m of ws['!merges'].slice(0, 10)) {
      const start = XLSX.utils.encode_cell(m.s)
      const end = XLSX.utils.encode_cell(m.e)
      const val = ws[start]?.v
      console.log(`    ${start}:${end}  →  ${JSON.stringify(val)}`)
    }
  }
}
