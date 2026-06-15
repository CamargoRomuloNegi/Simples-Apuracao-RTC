/**
 * @file /api/ai/route.ts
 * @description Route Handler — gera o Dossiê Tributário RTC via Gemini.
 *
 * MUDANÇA Sprint 4 v2: não há mais perguntas livres.
 * A IA recebe os dados agregados e produz um relatório estruturado completo.
 *
 * BUG CORRIGIDO: SSE buffering — o Gemini envia múltiplos eventos por chunk TCP.
 * O buffer acumula fragmentos até encontrar o delimitador \n\n antes de parsear.
 *
 * SEGURANÇA:
 *   - Chave lida de process.env (nunca exposta ao browser)
 *   - Origem verificada em produção
 *   - Payload validado (tamanho, tipos)
 *   - Erros tratados sem vazar detalhes internos
 */
import { NextRequest, NextResponse } from 'next/server'
import type { AiContext }             from '@/domain/models/AiTypes'
import { GEMINI_MODELS }              from '@/domain/models/AiTypes'
import type { GeminiModel }           from '@/domain/models/AiTypes'

// ---------------------------------------------------------------------------
// PROMPT DO DOSSIÊ — estrutura baseada na abordagem de alta qualidade
// ---------------------------------------------------------------------------
//
// DESIGN: dados formatados como texto legível (não JSON) + papel bem definido
// para a IA + seções explícitas com instruções de conteúdo + restrições claras.
// Essa combinação produz dossiês técnicos de qualidade profissional.

function buildReportPrompt(context: AiContext): string {
  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const byType = context.byDocType
    .map(t =>
      `  - ${t.tipo}: ${t.count} documentos | Crédito IBS/CBS: R$ ${brl(t.credito)} | Débito IBS/CBS: R$ ${brl(t.debito)}`
    )
    .join('\n')

  const cfops = context.topCfops
    .map((cfop, i) =>
      `  ${i + 1}. CFOP ${cfop.cfop} — Crédito: R$ ${brl(cfop.credito)} | Débito: R$ ${brl(cfop.debito)}`
    )
    .join('\n')

  const temporal = context.temporal
    .map(t =>
      `  - ${t.label}: Crédito R$ ${brl(t.credito)} | Débito R$ ${brl(t.debito)} | Saldo R$ ${brl(t.saldo)}`
    )
    .join('\n')

  const posicao  = context.ibscbs.saldo >= 0 ? 'CREDORA' : 'DEVEDORA'
  const saldoAbs = Math.abs(context.ibscbs.saldo)

  const dados = [
    `Período analisado: ${context.period}`,
    `Total de documentos: ${context.totalDocs.toLocaleString('pt-BR')}`,
    `Volume de entradas: R$ ${brl(context.volumes.inbound)}`,
    `Volume de saídas:   R$ ${brl(context.volumes.outbound)}`,
    `Volume total:       R$ ${brl(context.volumes.total)}`,
    '',
    `Crédito IBS/CBS: R$ ${brl(context.ibscbs.credito)} (${context.ibscbs.creditRate.toFixed(2)}% das entradas)`,
    `Débito IBS/CBS:  R$ ${brl(context.ibscbs.debito)} (${context.ibscbs.debitRate.toFixed(2)}% das saídas)`,
    `Saldo líquido:   R$ ${brl(saldoAbs)} — Posição ${posicao} (${Math.abs(context.ibscbs.balanceRate).toFixed(2)}% das saídas)`,
    '',
    'Regime tributário dos emitentes:',
    `  - Regime Normal (RPA): ${context.byRegime.rpa} documentos`,
    `  - Simples Nacional: ${context.byRegime.simples} documentos`,
    `  - MEI: ${context.byRegime.mei} documentos`,
    `  - Documentos RPA sem IBS/CBS em 2026 (inconformes): ${context.inconformes}`,
    '',
    'Por tipo de documento:',
    byType,
    '',
    'Top CFOPs por volume de IBS/CBS:',
    cfops,
    '',
    'Evolução mensal:',
    temporal,
  ].join('\n')

  const secoes = [
    '1. **Sumário Executivo** — panorama do período, posição credora/devedora, volume de operações e principal diagnóstico.',
    '2. **Posição RTC** — tabela de créditos, débitos e saldo com análise dos índices percentuais e sua interpretação fiscal. Referencie o cronograma de transição da LC 214/2025.',
    '3. **Conformidade** — qualidade da carteira de fornecedores, risco de créditos perdidos (classifique: alto/médio/baixo) e impacto financeiro estimado.',
    '4. **Por Tipo de Documento** — tabela com participação percentual de cada espécie (NF-e, CT-e etc.) e IBS/CBS gerado por tipo.',
    '5. **Por CFOP** — análise dos principais CFOPs: natureza da operação, se é fonte de crédito ou débito e atenção especial a regimes diferenciados.',
    '6. **Evolução Temporal** — médias mensais de documentos, faturamento e IBS/CBS; tendência e regularidade do período.',
    '7. **Recomendações** — ações prioritárias (Alta/Média/Baixa) com impacto financeiro estimado e prazo de execução.',
    '8. **Conclusão** — diagnóstico consolidado e perspectiva fiscal estratégica para os próximos períodos.',
  ].join('\n')

  return `Atue como contador especialista, tributarista experiente e conhecedor profundo dos impactos da Reforma Tributária do Consumo (RTC) — IBS e CBS instituídos pela LC 214/2025.

Com base exclusivamente nos dados estatísticos a seguir, elabore um DOSSIÊ TÉCNICO TRIBUTÁRIO completo e profissional nas seções abaixo:

${secoes}

---

DADOS ESTATÍSTICOS BASE (use apenas estes — não extrapole nem invente):

${dados}

---

INSTRUÇÕES DE FORMATAÇÃO E TOM:
- Markdown com tabelas (use | col | col |), negrito, listas hierárquicas e subtítulos ## para cada seção
- Valores monetários em padrão brasileiro: R$ 1.234,56
- Percentuais com 2 casas decimais
- Tom técnico e assertivo, adequado para diretores e contadores
- Não exiba cálculos intermediários nem equações — apresente resultados e interpretações
- Não cite dados além do fornecido neste prompt`
}


// ---------------------------------------------------------------------------
// VERIFICAÇÃO DE ORIGEM
// ---------------------------------------------------------------------------
//
// VERCEL_URL contém a URL da *deployment* específica (preview ou produção),
// que muda a cada deploy. Não é confiável para comparar com a origin real.
// VERCEL_PROJECT_PRODUCTION_URL é a URL canônica de produção — mais adequada.
//
// Para o beta, aceitamos qualquer origem que seja:
//   - localhost (desenvolvimento)
//   - *.vercel.app (produção / preview Vercel)
//   - O domínio de produção configurado (NEXT_PUBLIC_APP_URL, opcional)
//
// O risco de abuse é mitigado pelo rate limiting do próprio Gemini na chave.
// CSRF token completo está planejado para v2.0.

function isOriginAllowed(request: NextRequest): boolean {
  const origin  = request.headers.get('origin')  ?? ''
  const referer = request.headers.get('referer') ?? ''
  const source  = origin || referer

  // Sem origin/referer (ex: chamadas diretas sem browser) — aceitar em dev
  if (!source) {
    return !process.env.VERCEL_URL // true em local, false em produção
  }

  // Desenvolvimento local
  if (source.includes('localhost') || source.includes('127.0.0.1')) return true

  // Qualquer subdomínio Vercel do projeto (produção e previews)
  if (source.includes('.vercel.app')) return true

  // Domínio customizado opcional (configurado pelo operador)
  const customDomain = process.env.NEXT_PUBLIC_APP_URL
  if (customDomain && source.startsWith(customDomain)) return true

  return false
}

// ---------------------------------------------------------------------------
// ROUTE HANDLER — POST
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Origem
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 })
  }

  // 2. Chave de API
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Módulo de IA não configurado. Adicione GEMINI_API_KEY nas variáveis de ambiente do Vercel.' },
      { status: 503 }
    )
  }

  // 3. Tamanho do payload
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 20_000) {
    return NextResponse.json({ error: 'Payload muito grande' }, { status: 413 })
  }

  // 4. Ler e validar body
  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const p = body as Record<string, unknown>

  const model = p.model as GeminiModel
  if (!model || !Object.keys(GEMINI_MODELS).includes(model)) {
    return NextResponse.json({ error: 'Modelo inválido' }, { status: 400 })
  }

  // maxTokens é apenas informativo — o dossiê usa o máximo do modelo.
  // Free Tier do Gemini limita RPM (15/min), não o tamanho de cada resposta.
  // Travar tokens artificialmente degrada a qualidade sem proteger nada.
  const _maxTokensHint = Number(p.maxTokens ?? 8192) // ignorado na prática
  void _maxTokensHint // suprime warning de variável não usada

  if (!p.context || typeof p.context !== 'object') {
    return NextResponse.json({ error: 'Contexto ausente' }, { status: 400 })
  }

  const context = p.context as AiContext
  const prompt  = buildReportPrompt(context)

  // 5. Chamar Gemini com streaming
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  let geminiRes: Response
  try {
    geminiRes = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 65536, // limite máximo do Gemini 3.5 Flash — dossiê completo sem truncamento
          temperature:     0.2,  // determinístico para análise fiscal
          topP:            0.8,
        },
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao conectar ao Gemini. Verifique sua conexão.' }, { status: 502 })
  }

  // 6. Erros do Gemini
  if (!geminiRes.ok) {
    if (geminiRes.status === 429) {
      return NextResponse.json({
        error: 'Limite de requisições atingido. O plano gratuito permite 15 requisições/minuto. Aguarde e tente novamente.'
      }, { status: 429 })
    }
    if (geminiRes.status === 403) {
      return NextResponse.json({ error: 'Chave de API inválida ou sem permissão para este modelo.' }, { status: 403 })
    }
    return NextResponse.json({ error: `Erro do Gemini (${geminiRes.status}). Tente novamente.` }, { status: 502 })
  }

  if (!geminiRes.body) {
    return NextResponse.json({ error: 'Resposta vazia do Gemini' }, { status: 502 })
  }

  // 7. Streaming com buffer SSE correto
  // BUG ORIGINAL: split('\n') perdia chunks que chegavam fragmentados via TCP.
  // FIX: acumula no buffer e processa apenas eventos SSE completos (\n\n).
  const geminiBody = geminiRes.body

  const stream = new ReadableStream({
    async start(controller) {
      const reader  = geminiBody.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Processar apenas eventos SSE completos (delimitados por \n\n)
          const events = buffer.split('\n\n')
          // O último elemento pode ser um evento incompleto — manter no buffer
          buffer = events.pop() ?? ''

          for (const event of events) {
            for (const line of event.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (!jsonStr || jsonStr === '[DONE]') continue

              try {
                const parsed = JSON.parse(jsonStr) as {
                  candidates?: Array<{
                    content?: { parts?: Array<{ text?: string }> }
                  }>
                }
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  controller.enqueue(new TextEncoder().encode(text))
                }
              } catch {
                // Fragmento incompleto — ignorar
              }
            }
          }
        }

        // Processar buffer restante
        if (buffer.trim()) {
          for (const line of buffer.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const parsed = JSON.parse(line.slice(6).trim()) as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
              }
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) controller.enqueue(new TextEncoder().encode(text))
            } catch { /* ignorar */ }
          }
        }
      } catch {
        // Erro de leitura — encerrar graciosamente
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':           'text/plain; charset=utf-8',
      'Cache-Control':          'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
