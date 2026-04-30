import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()

  // List all tables in public schema
  let tables: any = null
  let tablesErr: any = null
  try {
    const res = await supabase.rpc('list_tables').select()
    tables = res.data
    tablesErr = res.error
  } catch {
    tablesErr = { message: 'rpc not available' }
  }

  // Try querying information_schema directly
  const { data: schemaInfo, error: schemaErr } = await (supabase as any)
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name')

  // Try known possible cert table names
  const tableNames = [
    'certificados_cre', 'certificados', 'cre_certificados',
    'cert_cre', 'folios_cre', 'certificaciones',
    'dictamenes', 'expedientes',
  ]
  const tableCounts: Record<string, any> = {}
  for (const t of tableNames) {
    const { count, error } = await supabase
      .from(t as any)
      .select('*', { count: 'exact', head: true })
    tableCounts[t] = error ? `ERROR: ${error.message}` : count
  }

  return NextResponse.json({
    serverDate: new Date().toISOString(),
    schemaInfo,
    schemaErr: schemaErr?.message,
    tableCounts,
  })
}
