import { NextResponse } from 'next/server'

export async function GET() {
  // Solo disponible en entorno de desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({
    has_key: !!process.env.ANTHROPIC_API_KEY,
    key_length: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    key_prefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'undefined',
    node_env: process.env.NODE_ENV,
  })
}
