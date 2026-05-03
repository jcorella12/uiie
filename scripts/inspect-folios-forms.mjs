import XLSX from 'xlsx'
const wb = XLSX.readFile('/Users/joaquincorella/Downloads/SOLICITUD DE FOLIOS PARA INSPECTORES (Respuestas).xlsx')
console.log('Sheets:', wb.SheetNames)

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name]
  console.log(`\n${'═'.repeat(80)}\n── ${name} ── ${ws['!ref'] ?? '(vacía)'}\n${'═'.repeat(80)}`)
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, blankrows: false })
  for (let i = 0; i < Math.min(json.length, 8); i++) {
    console.log(`  ${String(i+1).padStart(3)}: ${JSON.stringify(json[i])}`)
  }
  console.log(`  ... total filas: ${json.length}`)
}
