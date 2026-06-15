/**
 * @file middleware.ts
 * @description Middleware de autenticação — protege todas as rotas.
 *
 * DESIGN DEFENSIVO:
 *   - Verifica variáveis de ambiente explicitamente
 *   - getUser() envolvido em try/catch — qualquer falha redireciona para /login
 *   - Fail-safe: em caso de dúvida, bloquear (não liberar)
 *   - Sem lógica entre createServerClient e getUser() (recomendação Supabase)
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

// Rotas que não exigem autenticação
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login')       ||
    pathname.startsWith('/auth/')       ||
    pathname.startsWith('/_next/')      ||
    pathname.startsWith('/favicon')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Rotas públicas — deixar passar sempre ─────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  // ── 2. Verificar variáveis de ambiente ───────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Variáveis não configuradas → bloquear acesso
    console.error('[middleware] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── 3. Criar cliente Supabase com cookies da requisição ──────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // ── 4. Verificar sessão — FAIL-SAFE ──────────────────────────────────────
  // Qualquer erro (timeout, rede, token inválido) → redirecionar para /login
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error('[middleware] Erro ao verificar sessão:', err)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ── 5. Sem usuário autenticado → /login ──────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preservar rota original para redirecionar após login
    if (pathname !== '/') {
      url.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(url)
  }

  // ── 6. Autenticado → retornar response com cookies atualizados ───────────
  return supabaseResponse
}

export const config = {
  /*
   * Aplicar middleware a TODAS as rotas exceto assets estáticos.
   * É importante incluir '/' (raiz) e todas as rotas da aplicação.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
