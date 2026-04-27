import { Check } from 'lucide-react'

const PASOS = [
  { key: 'borrador',   label: 'Borrador'    },
  { key: 'en_proceso', label: 'En proceso'  },
  { key: 'revision',   label: 'En revisión' },
  { key: 'aprobado',   label: 'Aprobado'    },
  { key: 'cerrado',    label: 'Certificado' },
]

const IDX: Record<string, number> = {
  borrador: 0, en_proceso: 1, revision: 2, aprobado: 3, cerrado: 4,
  rechazado: 2, // visually at revision step but flagged red
}

interface Props { status: string }

export function ExpedienteProgressBar({ status }: Props) {
  const isRechazado = status === 'rechazado'
  const currentIdx  = IDX[status] ?? 0

  return (
    <div className="w-full">
      {isRechazado && (
        <p className="text-xs text-red-600 font-medium mb-3 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Devuelto para correcciones — revisa las notas y reenvía a revisión
        </p>
      )}

      <div className="flex items-start">
        {PASOS.map((paso, i) => {
          const done      = i < currentIdx
          const active    = i === currentIdx
          const redActive = isRechazado && active
          const isLast    = i === PASOS.length - 1

          return (
            <div key={paso.key} className="flex items-start flex-1 min-w-0">
              {/* Circle + label */}
              <div className="flex flex-col items-center shrink-0 w-10">
                <div className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done                  ? 'bg-[#0F6E56] text-white'                           : '',
                  active && !redActive  ? 'bg-[#0F6E56] text-white ring-4 ring-[#0F6E56]/20'  : '',
                  redActive             ? 'bg-red-500 text-white ring-4 ring-red-200'          : '',
                  !done && !active      ? 'bg-gray-100 text-gray-400'                          : '',
                ].filter(Boolean).join(' ')}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                </div>
                <span className={[
                  'text-[10px] mt-1 text-center leading-tight',
                  active && !redActive  ? 'text-[#0F6E56] font-semibold' : '',
                  redActive             ? 'text-red-600 font-semibold'   : '',
                  done                  ? 'text-gray-500'                : '',
                  !done && !active      ? 'text-gray-300'                : '',
                ].filter(Boolean).join(' ')}>
                  {paso.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`h-0.5 flex-1 mt-3.5 mx-0.5 ${done ? 'bg-[#0F6E56]' : 'bg-gray-100'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
