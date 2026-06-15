/**
 * @file login/LoginForm.tsx
 * @description Formulário de login — componente client-side com useSearchParams.
 */
'use client'

import { useState, useEffect }        from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock, Mail, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Se já autenticado, redirecionar
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace(redirectTo)
    }
    check()
  }, [router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique e tente novamente.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('E-mail não confirmado. Contate o administrador.')
        } else if (authError.message.includes('Too many requests')) {
          setError('Muitas tentativas. Aguarde alguns minutos.')
        } else {
          setError('Erro ao autenticar. Tente novamente.')
        }
        return
      }

      router.push(redirectTo)
      router.refresh()

    } catch {
      setError('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', height: '44px',
    paddingLeft: '38px', paddingRight: '12px',
    border: `1px solid ${hasError ? '#fecaca' : '#e2e8f0'}`,
    borderRadius: '8px', fontSize: '0.9rem',
    color: '#0f172a', background: '#f8fafc',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1729 0%, #1e293b 100%)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Identidade */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: '#1d4ed8', marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(29,78,216,0.4)',
          }}>
            <FileText size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
            Simples Apuração RTC
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Reforma Tributária do Consumo — IBS/CBS
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            Acesso ao sistema
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '24px' }}>
            Use suas credenciais de acesso
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* E-mail */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required autoComplete="email"
                  disabled={loading}
                  style={inputStyle(!!error)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = error ? '#fecaca' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required autoComplete="current-password"
                  disabled={loading}
                  style={inputStyle(!!error)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = error ? '#fecaca' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%', height: '46px', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: loading || !email || !password ? '#94a3b8' : '#1d4ed8',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '0.92rem', fontWeight: 700, fontFamily: 'inherit',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: loading || !email || !password ? 'none' : '0 4px 14px rgba(29,78,216,0.35)',
              }}
            >
              {loading
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Autenticando…</>
                : 'Entrar'
              }
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#334155', lineHeight: 1.6 }}>
          Acesso restrito — credenciais fornecidas pelo administrador<br />
          🔒 Processamento fiscal local — dados não saem do dispositivo
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
