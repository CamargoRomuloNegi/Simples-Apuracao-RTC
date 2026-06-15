/**
 * @file Header.tsx
 * @description Cabeçalho da aplicação com informações do usuário e logout.
 *
 * Sprint 6: adicionado botão de logout que encerra a sessão Supabase
 * e redireciona para /login.
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { LogOut, User }        from 'lucide-react'
import { createClient }        from '@/lib/supabase/client'
import { useFiscalStore }      from '@/application/store/useFiscalStore'

export function Header() {
  const router    = useRouter()
  const documents = useFiscalStore(s => s.documents)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // Obter e-mail do usuário logado
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      gap: '16px',
    }}>

      {/* Status de documentos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {documents.length > 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 12px', background: 'var(--color-primary-light)',
            borderRadius: '20px', border: '1px solid #bfdbfe',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'var(--font-data)' }}>
              {documents.length.toLocaleString('pt-BR')} documentos carregados
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Nenhum documento carregado
          </span>
        )}
      </div>

      {/* Usuário e logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

        {/* E-mail do usuário */}
        {userEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--color-primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #bfdbfe',
            }}>
              <User size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span style={{
              fontSize: '0.78rem', color: 'var(--color-text-secondary)',
              maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userEmail}
            </span>
          </div>
        )}

        {/* Separador */}
        {userEmail && (
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
        )}

        {/* Botão de logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sair do sistema"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: loggingOut ? 'var(--color-bg)' : 'var(--color-surface)',
            color: loggingOut ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
            fontFamily: 'var(--font-ui)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (!loggingOut) {
              e.currentTarget.style.borderColor = '#fecaca'
              e.currentTarget.style.color       = 'var(--color-error)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color       = 'var(--color-text-secondary)'
          }}
        >
          <LogOut size={13} />
          {loggingOut ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </header>
  )
}
