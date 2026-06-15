/**
 * @file /api/ai/route.ts
 * @description Route Handler principal do módulo de IA — chama o Gemini com streaming.
 *
 * SEGURANÇA:
 *   - GEMINI_API_KEY lida de process.env (servidor) — nunca exposta ao browser
 *   - Payload validado: tamanho máximo 15KB, pergunta sanitizada
 *   - Origem verificada: apenas domínio do Vercel em produção
 *   - Erros tratados: nunca vaza a chave na mensagem de erro
 *
 * STREAMING:
 *   Retorna ReadableStream — texto aparece progressivamente no browser.
 *   O Gemini envia chunks de texto; repassamos diretamente ao cliente.
 *
 * TRATAMENTO DE ERROS:
 *   429 (Rate Limit)  → mensagem amigável com instrução de aguardar
 *   503 (Chave ausente) → instrução para o operador configurar a chave
 *   500 (Erro Gemini)  → mensagem genérica sem expor detalhes internos
 */
import { NextRequest, NextResponse } from 'next/server'
import type { AiRequestPayload } from '@/domain/models/AiTypes'
import { GEMINI_MODELS }          from '@/domain/models/AiTypes'

// ---------------------------------------------------------------------------
// SYSTEM PROMPT — instrução base ao Gemini
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Você é um consultor tributário especializado na Reforma Tributária do Consumo brasileira (IBS e CBS, instituídos pela LC 214/2025). 

Analise os dados de apuração fornecidos e responda de forma técnica, objetiva e estruturada. Use Markdown para formatar sua resposta (negrito, listas, subtítulos quando necessário).

REGRAS:
- Responda apenas com base nos dados fornecidos no contexto
- Não invente valores, percentuais ou datas não presentes no contexto
- Use reais (R$) com 2 casas decimais e percentuais com 2 casas decimais
- Seja conciso e direto — foque no que é relevante para a pergunta
- Quando identificar riscos ou oportunidades, aponte-os claramente`

// ---------------------------------------------------------------------------
// VERIFICAÇÃO DE ORIGEM
// ---------------------------------------------------------------------------

function isOriginAllowed(request: NextRequest): boolean {
  // Em desenvolvimento local: aceitar qualquer origem
  if (!process.env.VERCEL_URL) return true

  const origin  = request.headers.get('origin')  ?? ''
  const referer = request.headers.get('referer') ?? ''
  const allowed = `https://${process.env.VERCEL_URL}`

  return origin.startsWith(allowed) || referer.startsWith(allowed)
}

// ---------------------------------------------------------------------------
// VALIDAÇÃO DO PAYLOAD
// ---------------------------------------------------------------------------

function validatePayload(body: unknown): { valid: true; data: AiRequestPayload } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Payload inválido' }
  }

  const p = body as Record<string, unknown>

  // Pergunta
  if (typeof p.question !== 'string' || p.question.trim().length === 0) {
    return { valid: false, error: 'Pergunta não pode ser vazia' }
  }
  if (p.question.length > 500) {
    return { valid: false, error: 'Pergunta excede 500 caracteres' }
  }

  // Modelo
  if (!p.model || !Object.keys(GEMINI_MODELS).includes(p.model as string)) {
    return { valid: false, error: 'Modelo inválido' }
  }

  // Tokens
  const maxTokens = Number(p.maxTokens)
  if (!maxTokens || maxTokens < 256 || maxTokens > 4096) {
    return { valid: false, error: 'maxTokens deve estar entre 256 e 4096' }
  }

  // Contexto
  if (!p.context || typeof p.context !== 'object') {
    return { valid: false, error: 'Contexto ausente' }
  }

  return {
    valid: true,
    data: {
      question:  p.question.trim(),
      context:   p.context as AiRequestPayload['context'],
      model:     p.model   as AiRequestPayload['model'],
      maxTokens,
    },
  }
}

// ---------------------------------------------------------------------------
// ROUTE HANDLER — POST
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {

  // 1. Verificar origem
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  // 2. Verificar chave de API
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Módulo de IA não configurado. O operador do sistema deve adicionar GEMINI_API_KEY nas variáveis de ambiente do Vercel.' },
      { status: 503 }
    )
  }

  // 3. Verificar tamanho do payload (max 15KB)
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 15_000) {
    return NextResponse.json({ error: 'Payload muito grande' }, { status: 413 })
  }

  // 4. Ler e validar o body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const validation = validatePayload(body)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { question, context, model, maxTokens } = validation.data

  // 5. Construir o prompt
  const userPrompt = `Contexto da apuração (dados agregados — sem identificação de empresas):
${JSON.stringify(context, null, 2)}

Pergunta: ${question}`

  // 6. Chamar Gemini com streaming
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(geminiEndpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature:     0.3,   // mais determinístico para análise fiscal
          topP:            0.8,
        },
      }),
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao conectar ao Gemini. Verifique sua conexão.' },
      { status: 502 }
    )
  }

  // 7. Tratar erros do Gemini
  if (!geminiResponse.ok) {
    if (geminiResponse.status === 429) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. O plano gratuito do Gemini permite 15 requisições por minuto. Aguarde alguns segundos e tente novamente.' },
        { status: 429 }
      )
    }
    if (geminiResponse.status === 400) {
      return NextResponse.json(
        { error: 'Requisição inválida ao Gemini. Tente reformular a pergunta.' },
        { status: 400 }
      )
    }
    if (geminiResponse.status === 403) {
      return NextResponse.json(
        { error: 'Chave de API inválida ou sem permissão para o modelo selecionado.' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: `Erro do serviço Gemini (${geminiResponse.status}). Tente novamente.` },
      { status: 502 }
    )
  }

  // 8. Repassar o stream SSE ao cliente como texto plano progressivo
  const geminiBody = geminiResponse.body
  if (!geminiBody) {
    return NextResponse.json({ error: 'Resposta vazia do Gemini' }, { status: 502 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader  = geminiBody.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // O Gemini retorna SSE: linhas "data: {...json...}"
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr || jsonStr === '[DONE]') continue

            try {
              const parsed = JSON.parse(jsonStr)
              const text   = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(new TextEncoder().encode(text))
              }
            } catch {
              // Chunk parcial ou malformado — ignorar
            }
          }
        }
      } catch {
        // Erro de leitura do stream — encerrar graciosamente
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
