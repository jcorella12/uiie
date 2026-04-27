'use client'

// Read-only display of technical data for the client portal

interface TechData {
  kwp?: number | null
  num_paneles?: number | null
  potencia_panel_wp?: number | null
  inversor_marca?: string | null
  inversor_modelo?: string | null
  num_inversores?: number | null
  tipo_conexion?: string | null
  tipo_central?: string | null
  numero_medidor?: string | null
  capacidad_subestacion_kva?: number | null
  tiene_i1_i2?: boolean
  tiene_interruptor_exclusivo?: boolean
  tiene_ccfp?: boolean
  tiene_proteccion_respaldo?: boolean
  direccion_proyecto?: string | null
  colonia?: string | null
  municipio?: string | null
  ciudad?: string | null
  codigo_postal?: string | null
  estado_mx?: string | null
}

const CONEXION_LABELS: Record<string, string> = {
  generacion_distribuida: 'Generación Distribuida',
  net_metering: 'Net Metering',
  autoconsumo: 'Autoconsumo',
  isla: 'Sistema Aislado',
  interconectado: 'Interconectado',
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

export default function ClienteInfoTecnica({ data }: { data: TechData }) {
  const hasInstall = data.kwp || data.num_paneles || data.inversor_marca || data.numero_medidor
  const hasAddress = data.direccion_proyecto || data.municipio || data.ciudad

  if (!hasInstall && !hasAddress) return null

  return (
    <div className="card space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Datos Técnicos Registrados</h2>
      <p className="text-xs text-gray-500">
        Esta información fue registrada por el inspector. Si hay discrepancias, comunícate con él.
      </p>

      {hasAddress && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ubicación del proyecto</p>
          <div className="divide-y divide-gray-50">
            <Row label="Dirección"     value={data.direccion_proyecto} />
            <Row label="Colonia"       value={data.colonia} />
            <Row label="Municipio"     value={data.municipio} />
            <Row label="Ciudad"        value={data.ciudad} />
            <Row label="C.P."          value={data.codigo_postal} />
            <Row label="Estado"        value={data.estado_mx} />
          </div>
        </>
      )}

      {hasInstall && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3">Instalación fotovoltaica</p>
          <div className="divide-y divide-gray-50">
            <Row label="Potencia total"   value={data.kwp ? `${data.kwp} kWp` : undefined} />
            <Row label="Núm. paneles"     value={data.num_paneles} />
            <Row label="Potencia / panel" value={data.potencia_panel_wp ? `${data.potencia_panel_wp} Wp` : undefined} />
            <Row label="Inversor"         value={[data.inversor_marca, data.inversor_modelo].filter(Boolean).join(' ')} />
            <Row label="Núm. inversores"  value={data.num_inversores} />
            <Row label="Tipo de conexión" value={data.tipo_conexion ? CONEXION_LABELS[data.tipo_conexion] ?? data.tipo_conexion : undefined} />
            <Row label="Número de medidor CFE" value={data.numero_medidor} />
          </div>
        </>
      )}

      {data.capacidad_subestacion_kva != null && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3">Subestación</p>
          <div className="divide-y divide-gray-50">
            <Row label="Capacidad del transformador" value={`${data.capacidad_subestacion_kva} kVA`} />
          </div>
        </>
      )}

      {(data.tiene_i1_i2 || data.tiene_interruptor_exclusivo || data.tiene_ccfp || data.tiene_proteccion_respaldo) && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3">Protecciones</p>
          <div className="flex flex-wrap gap-2">
            {data.tiene_i1_i2 && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">✓ I1/I2</span>}
            {data.tiene_interruptor_exclusivo && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">✓ Interruptor exclusivo</span>}
            {data.tiene_ccfp && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">✓ CCFP</span>}
            {data.tiene_proteccion_respaldo && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">✓ Prot. respaldo</span>}
          </div>
        </>
      )}
    </div>
  )
}
