/**
 * @file auth/callback/route.ts
 * @description Callback handler para fluxos OAuth do Supabase.
 *
 * Reservado para uso futuro (login com Google, GitHub etc.).
 * No fluxo atual (email/senha), esta rota não é chamada.
 * Mantida para extensibilidade sem quebrar a arquitetura.
 */
import { createServerClient }  from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import { cookies }             from 'next/headers'
import type { NextRequest }    from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const redirectTo  = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase    = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()             { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Erro no callback — redirecionar para login
  return NextResponse.redirect(`${origin}/login?error=callback`)
}
