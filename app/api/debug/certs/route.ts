import { NextResponse } from 'next/server'

// Endpoint de debug — deshabilitado en producción
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Solo disponible en desarrollo' })
}
