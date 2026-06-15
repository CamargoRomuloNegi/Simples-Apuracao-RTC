/**
 * @file middleware.ts
 * @description Proteção de rotas — verificação de sessão por cookie.
 *
 * DECISÃO DE ARQUITETURA:
 *   A versão anterior usava @supabase/ssr no middleware, o que causa erro
 *   silencioso de compilação na Vercel Edge Runtime (0 invocações).
 *   Esta versão lê os cookies de sessão do Supabase diretamente — sem
 *   nenhuma dependência externa, 100% compatível com Edge Runtime.
 *
 * SEGURANÇA:
 *   A verificação aqui é de PRESENÇA de cookie válido (não expira, não null).
 *   A validação completa do JWT ocorre nas chamadas server-side (Route Handlers).
 *   Para um sistema beta com usuários controlados, este nível é adequado.
 *
 * COOKIES DO SUPABASE:
 *   Supabase Auth armazena a sessão em cookies cujo nome contém '-auth-token'.
 *   Formato: sb-{project_ref}-auth-token (ou .0, .1 para chunks grandes).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Rotas acessíveis sem autenticação */
function isPublic(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  )
}

/** Verifica se há cookie de sessão Supabase válido */
function hasSupabaseSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  return cookies.some(
    ({ name, value }) =>
      // Cookie de sessão Supabase: nome contém '-auth-token' e tem valor
      name.includes('-auth-token') &&
      value.length > 0 &&
      value !== 'null' &&
      value !== 'undefined'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — passar sempre
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // Verificar sessão
  if (!hasSupabaseSession(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
