/**
 * @file login/page.tsx  (rota "/login")
 * @description Tela de autenticação — email e senha via Supabase Auth.
 *
 * NOTA TÉCNICA: useSearchParams() requer Suspense boundary no Next.js 15
 * para static rendering. O componente LoginForm é envolvido em Suspense
 * no componente raiz LoginPage para evitar erro de prerender.
 */
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1729 0%, #1e293b 100%)',
    }}>
      <div style={{ width: '420px', height: '360px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }} />
    </div>
  )
}
