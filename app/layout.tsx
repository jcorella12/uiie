import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CIAE — UIIE-CRE-021',
  description: 'Inteligencia en Ahorro de Energía S.A. de C.V. — Unidad de Inspección de la Industria Eléctrica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
