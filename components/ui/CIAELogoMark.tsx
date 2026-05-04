interface CIAELogoMarkProps {
  /** Tamaño del símbolo en px. Default 32 */
  size?: number
  /**
   * Si está sobre fondo oscuro (sidebar) — envuelve el símbolo en un
   * contenedor blanco para que el verde y naranja se sigan leyendo bien.
   */
  onDark?: boolean
  /** className extra para el wrapper */
  className?: string
}

/**
 * Símbolo del logo CIAE (Centro de Inteligencia en Ahorro de Energía):
 * el anillo entrelazado en verde de marca y naranja de marca.
 *
 * Renderizado como SVG inline para escalar perfectamente y mantener
 * los colores exactos en cualquier tamaño.
 *
 * Para usar el LOGO COMPLETO con texto debajo, importar /logo-ciae.png
 * directamente con next/image (apropiado para login a tamaño grande).
 *
 * Uso:
 * ```tsx
 * <CIAELogoMark size={40} />              // sobre fondo claro
 * <CIAELogoMark size={32} onDark />       // sobre fondo verde del sidebar
 * ```
 */
export function CIAELogoMark({ size = 32, onDark = false, className = '' }: CIAELogoMarkProps) {
  const ring = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CIAE"
    >
      {/* Anillo naranja al fondo, ligeramente arriba-derecha y con leve rotación */}
      <ellipse
        cx="52"
        cy="46"
        rx="32"
        ry="30"
        stroke="#EF9F27"
        strokeWidth="11"
        strokeLinecap="round"
        transform="rotate(-12 52 46)"
        fill="none"
      />
      {/* Anillo verde al frente, ligeramente abajo-izquierda */}
      <ellipse
        cx="48"
        cy="54"
        rx="32"
        ry="30"
        stroke="#0F6E56"
        strokeWidth="11"
        strokeLinecap="round"
        transform="rotate(-12 48 54)"
        fill="none"
      />
    </svg>
  )

  if (onDark) {
    // Envolver en un contenedor blanco con padding mínimo
    // para que los colores de marca contrasten contra el fondo verde oscuro.
    const containerSize = Math.round(size * 1.3) // ~30% más para el padding
    return (
      <div
        className={`bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: containerSize, height: containerSize }}
      >
        {ring}
      </div>
    )
  }

  return <div className={`flex-shrink-0 ${className}`}>{ring}</div>
}
