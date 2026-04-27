import { createServerClient } from '@supabase/ssr'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies set by middleware
          }
        },
      },
    }
  )
}

/**
 * Service-role client that TRULY bypasses RLS.
 *
 * Using @supabase/ssr's createServerClient with the service role key does NOT
 * bypass RLS — the user's auth cookie overrides the service role JWT.
 * Using the raw @supabase/supabase-js client without cookie handling sends the
 * service role key as the sole Authorization header, which bypasses RLS.
 */
export async function createServiceClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
