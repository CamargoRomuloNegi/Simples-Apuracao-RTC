/**
 * @file login/layout.tsx
 * @description Layout exclusivo para a tela de login.
 *
 * A tela de login não usa o RootLayout (sem Sidebar, sem Header).
 * Este layout minimalista renderiza apenas o conteúdo da página.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
