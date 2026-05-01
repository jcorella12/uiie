import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const publicRoutes = ['/login', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))

  // Not logged in → send to login
  if (!user && !isPublic && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in on root or login → redirect to role dashboard
  if (user && (pathname === '/' || pathname === '/login')) {
    const meta = user.user_metadata as any
    const rol = meta?.rol ?? 'inspector'

    const url = request.nextUrl.clone()
    if (rol === 'inspector_responsable') url.pathname = '/dashboard'
    else if (rol === 'admin') url.pathname = '/dashboard/admin'
    else if (rol === 'cliente') url.pathname = '/dashboard/cliente'
    else url.pathname = '/dashboard/inspector'

    return NextResponse.redirect(url)
  }

  // Protección de rutas por rol (usando JWT metadata — el layout hace la verificación DB definitiva)
  if (user) {
    const meta = user.user_metadata as any
    const rol: string = meta?.rol ?? 'inspector'
    const url = request.nextUrl.clone()

    // Rutas exclusivas de admin — bloquear a inspectores y clientes
    const esAdmin = ['admin', 'inspector_responsable'].includes(rol)
    if (!esAdmin && (
      pathname.startsWith('/dashboard/admin') ||
      pathname.startsWith('/dashboard/conciliacion') ||
      pathname.startsWith('/dashboard/reporte-trimestral') ||
      pathname.startsWith('/dashboard/inspectores') ||
      pathname.startsWith('/dashboard/ai-costos')
    )) {
      url.pathname = rol === 'cliente' ? '/dashboard/cliente' : '/dashboard/inspector'
      return NextResponse.redirect(url)
    }

    // Rutas de inspector — bloquear a clientes
    if (rol === 'cliente' && pathname.startsWith('/dashboard/inspector')) {
      url.pathname = '/dashboard/cliente'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
