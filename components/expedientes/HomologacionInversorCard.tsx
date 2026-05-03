'use client'
import { useEffect, useState } from 'react'
import { ShieldCheck, FileText, Loader2 } from 'lucide-react'

type Homologacion = {
  marca:              string
  oficio_cne_numero:  string | null
  oficio_cne_fecha:   string | null
  oficio_cne_nombre:  string | null
  carta_marca_fecha:  string | null
  carta_marca_nombre: string | null
  redaccion_lista:    string | null
  redaccion_acta:     string | null
}

/**
 * Muestra la redacción CRE-compliant cuando el inversor del expediente tiene
 * homologación oficial vigente (p.ej. Huawei → oficio CNE F00.06.UE/225/2026).
 * El inspector puede copiar la redacción al portapapeles para pegarla en la
 * lista de verificación o en el acta. Los PDFs respaldatorios se incluyen
 * automáticamente en el ZIP del expediente.
 */
export default function HomologacionInversorCard({ marca }: { marca: string | null | undefined }) {
  const [data, setData]       = useState<Homologacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState<'lista' | 'acta' | null>(null)

  useEffect(() => {
    if (!marca) { setData(null); return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/inversores/homologacion?marca=${encodeURIComponent(marca)}`)
      .then(r => r.json())
      .then(j => { if (!cancelled) setData(j.homologacion ?? null) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [marca])

  if (!marca || loading || !data) return null

  const copy = async (texto: string, tipo: 'lista' | 'acta') => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(tipo)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-emerald-700" />
        <h3 className="font-semibold text-emerald-900">
          Homologación {data.marca} reconocida por la CNE
        </h3>
      </div>

      <p className="text-sm text-emerald-900/80">
        Esta marca de inversor cuenta con un oficio oficial de la CNE que reconoce el
        cumplimiento de la <strong>RES/142/2017</strong> mediante reportes alternos a UL 1741.
        Los archivos se incluyen automáticamente en el ZIP del expediente.
      </p>

      <ul className="text-xs text-emerald-900/80 space-y-1">
        {data.oficio_cne_numero && (
          <li className="flex items-center gap-2">
            <FileText size={14} />
            <span>Oficio <strong>{data.oficio_cne_numero}</strong>{data.oficio_cne_fecha && ` · ${data.oficio_cne_fecha}`}</span>
          </li>
        )}
        {data.carta_marca_fecha && (
          <li className="flex items-center gap-2">
            <FileText size={14} />
            <span>Carta de clarificación del fabricante · {data.carta_marca_fecha}</span>
          </li>
        )}
      </ul>

      {data.redaccion_lista && (
        <details className="rounded border border-emerald-200 bg-white">
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-emerald-900 flex items-center justify-between">
            <span>Redacción para la lista de verificación</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); copy(data.redaccion_lista!, 'lista') }}
              className="text-xs text-emerald-700 hover:underline"
            >
              {copied === 'lista' ? '✓ Copiado' : 'Copiar'}
            </button>
          </summary>
          <div className="px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap border-t border-emerald-100">
            {data.redaccion_lista}
          </div>
        </details>
      )}

      {data.redaccion_acta && (
        <details className="rounded border border-emerald-200 bg-white">
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-emerald-900 flex items-center justify-between">
            <span>Redacción para el acta de inspección</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); copy(data.redaccion_acta!, 'acta') }}
              className="text-xs text-emerald-700 hover:underline"
            >
              {copied === 'acta' ? '✓ Copiado' : 'Copiar'}
            </button>
          </summary>
          <div className="px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap border-t border-emerald-100">
            {data.redaccion_acta}
          </div>
        </details>
      )}
    </div>
  )
}
