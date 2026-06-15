/**
 * @file middleware.ts
 * @description Middleware de autenticação — protege todas as rotas da aplicação.
 *
 * FLUXO:
 *   1. Toda requisição passa pelo middleware antes de chegar às páginas
 *   2. O middleware verifica se há sessão válida via Supabase SSR (cookies)
 *   3. Sem sessão → redireciona para /login
 *   4. Com sessão → deixa passar e atualiza o cookie de sessão (refresh automático)
 *
 * ROTAS PÚBLICAS (não exigem autenticação):
 *   /login            — tela de login
 *   /auth/callback    — callback OAuth (reservado para uso futuro)
 *   /_next/*          — assets estáticos do Next.js
 *   /favicon.ico      — ícone
 *
 * SEGURANÇA:
 *   Usa getUser() (verifica com o servidor Supabase) em vez de getSession()
 *   (que lê apenas o cookie local). Isso garante que tokens revogados
 *   sejam detectados corretamente.
 */
import { createServerClient }  from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Aplicar cookies na request (para encadeamento)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Criar nova response com os cookies atualizados
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: usar getUser() e não getSession()
  // getUser() valida o token com o servidor Supabase — mais seguro
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas — não exigem autenticação
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  if (!user && !isPublic) {
    // Sem sessão e rota protegida → redirecionar para login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Guardar a rota original para redirecionar após login
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    // Já autenticado e tentando acessar /login → redirecionar para home
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
