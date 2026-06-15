/**
 * @file supabase/server.ts
 * @description Cliente Supabase para uso server-side (middleware, RSC, Route Handlers).
 *
 * Usa createServerClient do @supabase/ssr com leitura/escrita de cookies
 * via Next.js cookies() API. Necessário para validar sessão no servidor.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()               { return cookieStore.getAll() },
        setAll(cookiesToSet)   {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignorado em Server Components — middleware cuida da atualização
          }
        },
      },
    },
  )
}
