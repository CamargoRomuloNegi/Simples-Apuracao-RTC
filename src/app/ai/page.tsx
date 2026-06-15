/**
 * @file ai/page.tsx  (rota "/ai")
 * @description Módulo de IA — consulta ao Gemini sobre a apuração RTC.
 *
 * FLUXO:
 *   1. Sem documentos → EmptyState
 *   2. Sem chave configurada → aviso com link para Settings
 *   3. Com documentos + chave → painel de contexto + chat
 *
 * STREAMING: o texto da resposta aparece progressivamente via ReadableStream.
 * Cada pergunta é independente (sem histórico de contexto enviado ao Gemini).
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Settings, AlertCircle }            from 'lucide-react'
import Link                                  from 'next/link'
import { useFiscalStore }   from '@/application/store/useFiscalStore'
import { useAiStore }       from '@/application/store/useAiStore'
import { buildAiContext }   from '@/application/services/AiContextService'
import { AiContextPanel }   from '@/components/ai/AiContextPanel'
import { AiChatInput }      from '@/components/ai/AiChatInput'
import { AiResponsePanel }  from '@/components/ai/AiResponsePanel'
import { AiHistoryPanel }   from '@/components/ai/AiHistoryPanel'
import { EmptyState }       from '@/components/ui/EmptyState'
import type { AiTurn, AiContext } from '@/domain/models/AiTypes'

export default function AiPage() {
  const documents = useFiscalStore(s => s.documents)
  const {
    model, maxTokens,
    history, isLoading, error,
    addTurn, clearHistory, setLoading, setError,
  } = useAiStore()

  const [streamText,      setStreamText]      = useState('')
  const [currentTurn,     setCurrentTurn]     = useState<AiTurn | null>(null)
  const [apiConfigured,   setApiConfigured]   = useState<boolean | null>(null)
  const [aiContext,       setAiContext]        = useState<AiContext | null>(null)

  // Reidratar store (skipHydration)
  useEffect(() => {
    useAiStore.persist.rehydrate()
  }, [])

  // Verificar status da API
  useEffect(() => {
    fetch('/api/ai/status')
      .then(r => r.json())
      .then((d: { configured: boolean }) => setApiConfigured(d.configured))
      .catch(() => setApiConfigured(false))
  }, [])

  // Construir contexto quando documentos mudam
  useEffect(() => {
    if (documents.length > 0) {
      setAiContext(buildAiContext(documents))
    } else {
      setAiContext(null)
    }
  }, [documents])

  // ---------------------------------------------------------------------------
  // ENVIAR PERGUNTA
  // ---------------------------------------------------------------------------

  const handleQuestion = useCallback(async (question: string) => {
    if (!aiContext || isLoading) return

    setLoading(true)
    setError(null)
    setStreamText('')
    setCurrentTurn(null)

    const turnId    = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    try {
      const response = await fetch('/api/ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, context: aiContext, model, maxTokens }),
      })

      if (!response.ok) {
        const err = await response.json() as { error?: string }
        throw new Error(err.error ?? `Erro ${response.status}`)
      }

      // Ler stream progressivamente
      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      let   fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamText(fullText)
      }

      // Estimativa de tokens (chars / 4 — aproximação para PT-BR)
      const estimatedTokens = Math.ceil(fullText.length / 4)

      const turn: AiTurn = {
        id: turnId, question, answer: fullText,
        model, tokens: estimatedTokens, timestamp,
      }
      setCurrentTurn(turn)
      addTurn(turn)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }, [aiContext, isLoading, model, maxTokens, addTurn, setLoading, setError])

  // ---------------------------------------------------------------------------
  // ESTADOS DE GUARDA
  // ---------------------------------------------------------------------------

  if (documents.length === 0) {
    return (
      <EmptyState
        variant="upload"
        title="Nenhum documento carregado"
        description="Carregue XMLs fiscais na tela de Upload antes de usar o módulo de IA."
      />
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Consultor de IA
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Análise da apuração IBS/CBS com Gemini — {documents.length.toLocaleString('pt-BR')} documentos carregados
          </p>
        </div>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', cursor: 'pointer' }}>
            <Settings size={13} style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Configurações</span>
          </div>
        </Link>
      </div>

      {/* Aviso: API não configurada */}
      {apiConfigured === false && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-warn)', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
              Módulo de IA não configurado
            </p>
            <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5 }}>
              A chave GEMINI_API_KEY não foi encontrada. Consulte a tela de{' '}
              <Link href="/settings" style={{ color: '#b45309', fontWeight: 600 }}>Configurações</Link>{' '}
              para instruções de como ativar o módulo.
            </p>
          </div>
        </div>
      )}

      {/* Painel de contexto */}
      {aiContext && <AiContextPanel context={aiContext} />}

      {/* Chat */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Input */}
        <AiChatInput
          onSubmit={handleQuestion}
          isLoading={isLoading}
          disabled={apiConfigured === false || !aiContext}
        />

        {/* Resposta atual */}
        <AiResponsePanel
          turn={currentTurn}
          isLoading={isLoading}
          streamText={streamText}
          error={error}
        />
      </div>

      {/* Histórico */}
      {history.length > 0 && (
        <AiHistoryPanel
          history={history}
          onClear={clearHistory}
        />
      )}

      {/* Aviso de privacidade compacto */}
      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
        ⚠️ Apenas dados agregados são enviados ao Gemini — sem CNPJs ou nomes de empresas.
        No plano gratuito, o Google pode usar os dados para melhorar seus modelos.
        <Link href="/settings" style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>Ver aviso completo</Link>
      </p>
    </div>
  )
}
