/**
 * @file supabase/client.ts
 * @description Cliente Supabase para componentes 'use client'.
 *
 * Usa createBrowserClient do @supabase/ssr — gerencia sessão via cookies
 * de forma segura, compatível com SSR do Next.js 15.
 *
 * USO: chamar createClient() dentro de componentes ou hooks client-side.
 * Não instanciar fora de componentes React (evita estado compartilhado).
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
