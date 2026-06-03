/**
 * @file ParserNFCe.ts
 * @description Parser para NFC-e (Nota Fiscal de Consumidor Eletrônica) — Modelo 65.
 *
 * STATUS: Skeleton (Sprint 0) — estrutura e contratos definidos.
 * Implementação completa: Sprint 1.
 *
 * REFERÊNCIA DE MAPEAMENTO: docs/SPEC_XML_MAPPING_v2.md — Parte 2
 *
 * DECISÃO DE DESIGN: NFC-e usa o MESMO XSD da NF-e (leiaute 4.00).
 * Esta classe estende ParserNFe e sobrescreve apenas os pontos de diferença:
 *   1. document_type = 'NFCE'
 *   2. receiver (dest) é opcional → fallback 'CONSUMIDOR FINAL'
 *   3. CFOPs sempre 5.xxx (validação informativa apenas)
 *   4. IPI nunca presente (ignorado silenciosamente)
 *
 * Benefício: máximo reuso, mínima duplicação de código.
 */

import type { IXmlParser } from './IXmlParser'
import type { ParseResult } from '@/domain/models/FiscalDocument'

export class ParserNFCe implements IXmlParser {
  parse(xmlString: string, filename: string): ParseResult {
    // TODO Sprint 1: Implementar extendendo ParserNFe
    // Diferenças a tratar:
    // 1. Setar document_type = 'NFCE'
    // 2. dest ausente → receiver = { cnpj_cpf: 'CONSUMIDOR_FINAL', name: 'CONSUMIDOR FINAL' }
    // 3. NFC-e é sempre OUTBOUND se o CNPJ analisado = emitente
    // 4. Não processar IPI (ausente por definição)

    return {
      document: null,
      success: false,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          category: 'PARSE',
          source: filename,
          message: 'Parser NFC-e ainda não implementado (Sprint 1).',
        },
      ],
    }
  }
}
