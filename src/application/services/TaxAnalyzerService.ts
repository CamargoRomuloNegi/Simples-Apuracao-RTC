/**
 * @file TaxAnalyzerService.ts
 * @description Serviço de enriquecimento e análise tributária.
 *
 * STATUS: Skeleton (Sprint 0) — interfaces e contratos definidos.
 * Implementação completa: Sprint 2.
 *
 * RESPONSABILIDADES:
 * 1. Detectar o CNPJ raiz da empresa analisada (por frequência no lote)
 * 2. Enriquecer documentos com direction (INBOUND/OUTBOUND)
 * 3. Enriquecer itens com rtc_impact (CREDIT/DEBIT/NEUTRAL)
 * 4. Calcular sumário de apuração (créditos, débitos, saldo)
 *
 * REGRA CENTRAL:
 * O driver de crédito/débito é a DIREÇÃO (INBOUND/OUTBOUND).
 * O CFOP serve APENAS para filtrar operações não-comerciais (→ NEUTRAL).
 * Ver: docs/SPEC_BUSINESS_RULES.md — Seção 3 e 4.
 */

import type {
  FiscalDocument,
  DocumentDirection,
  RtcImpact,
} from '@/domain/models/FiscalDocument'

// ---------------------------------------------------------------------------
// TIPOS DE SAÍDA
// ---------------------------------------------------------------------------

/** Sumário consolidado da apuração IBS/CBS de um lote de documentos */
export interface ApuracaoSummary {
  /** Total de créditos de IBS/CBS (entradas com destaque) */
  totalCreditos: number
  /** Total de débitos de IBS/CBS (saídas tributadas) */
  totalDebitos: number
  /** Saldo = créditos - débitos (positivo = credor, negativo = devedor) */
  saldo: number
  /** Quantidade de documentos com IBS/CBS destacado */
  docsComIBSCBS: number
  /** Quantidade de documentos sem IBS/CBS (potencial inconformidade) */
  docsSemIBSCBS: number
  /** Quantidade de documentos de emitentes Simples Nacional (sem crédito) */
  docsSimples: number
}

/** Resultado da detecção automática de CNPJ raiz */
export interface CnpjRootDetectionResult {
  /** CNPJ raiz detectado (8 dígitos) — null se não detectado */
  cnpjRoot: string | null
  /** Frequência de aparição do CNPJ raiz detectado */
  frequency: number
  /** Total de documentos analisados */
  totalDocuments: number
}

// ---------------------------------------------------------------------------
// CFOP NÃO-COMERCIAIS (filtro de exclusão da análise de conformidade)
// ---------------------------------------------------------------------------

/**
 * Prefixos de CFOP que representam operações não-comerciais.
 * Documentos com esses CFOPs recebem rtc_impact = NEUTRAL automaticamente,
 * independente da direção.
 *
 * Fonte: SPEC_BUSINESS_RULES.md — Seção 5.3
 */
const NON_COMMERCIAL_CFOP_PREFIXES = [
  '5.91', '6.91', // Remessas para consignação
  '5.92', '6.92', // Retorno de consignação
  '5.93', '6.93', // Remessa para industrialização por conta de terceiros
  '5.94', '6.94', // Retorno de industrialização
  '5.91', '6.91', // Remessa para conserto/reparo
  '5.90', '6.90', // Outras remessas
  '5.99', '6.99', // Outras saídas não especificadas
  '7.',           // Exportações (imunes)
] as const

// ---------------------------------------------------------------------------
// FUNÇÕES EXPORTADAS
// ---------------------------------------------------------------------------

/**
 * Detecta automaticamente o CNPJ raiz da empresa analisada.
 * Conta frequência de CNPJs raiz entre emitentes e destinatários.
 * O CNPJ raiz com maior frequência é a empresa analisada.
 *
 * @param documents - Lista de documentos processados
 */
export function detectMainCnpjRoot(documents: FiscalDocument[]): CnpjRootDetectionResult {
  // TODO Sprint 2: Implementar
  // 1. Para cada documento, extrair CNPJ raiz de issuer.cnpj_cpf e receiver.cnpj_cpf
  // 2. CNPJ raiz = primeiros 8 dígitos (CNPJ) ou CPF completo (PF)
  // 3. Contar ocorrências de cada raiz
  // 4. Retornar a raiz com maior contagem
  return { cnpjRoot: null, frequency: 0, totalDocuments: documents.length }
}

/**
 * Enriquece um documento com direction e rtc_impact por item.
 * Operação imutável — retorna novo objeto sem modificar o original.
 *
 * @param document    - Documento a enriquecer
 * @param cnpjRoot    - CNPJ raiz da empresa analisada
 */
export function enrichDocument(document: FiscalDocument, cnpjRoot: string): FiscalDocument {
  // TODO Sprint 2: Implementar
  // 1. Comparar cnpjRoot com issuer.cnpj_cpf e receiver.cnpj_cpf
  // 2. Determinar direction (INBOUND/OUTBOUND/UNKNOWN)
  // 3. Para cada item, chamar enrichItem(item, direction)
  // 4. Retornar novo FiscalDocument com direction e items enriquecidos
  return document
}

/**
 * Enriquece um item com rtc_impact.
 * Regra: DIRECTION é o driver; CFOP apenas filtra operações não-comerciais.
 *
 * @param cfop      - CFOP do item (para filtro de exclusão)
 * @param direction - Direção inferida do documento
 */
export function determineRtcImpact(cfop: string, direction: DocumentDirection): RtcImpact {
  // TODO Sprint 2: Implementar
  // 1. Se CFOP está em NON_COMMERCIAL_CFOP_PREFIXES → NEUTRAL
  // 2. Se direction === INBOUND → CREDIT
  // 3. Se direction === OUTBOUND → DEBIT
  // 4. Se direction === UNKNOWN → NEUTRAL
  return 'NEUTRAL'
}

/**
 * Calcula o sumário consolidado de apuração IBS/CBS.
 *
 * @param documents - Lista de documentos enriquecidos
 */
export function calculateApuracao(documents: FiscalDocument[]): ApuracaoSummary {
  // TODO Sprint 2: Implementar
  // 1. Somar vIBS + vCBS de itens com rtc_impact === CREDIT → totalCreditos
  // 2. Somar vIBS + vCBS de itens com rtc_impact === DEBIT → totalDebitos
  // 3. saldo = totalCreditos - totalDebitos
  // 4. Contadores de conformidade

  return {
    totalCreditos: 0,
    totalDebitos: 0,
    saldo: 0,
    docsComIBSCBS: 0,
    docsSemIBSCBS: 0,
    docsSimples: 0,
  }
}
