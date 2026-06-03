/**
 * @file ParserNFe.ts
 * @description Parser para NF-e (Nota Fiscal Eletrônica) — Modelo 55, Leiaute 4.00.
 *
 * STATUS: Skeleton (Sprint 0) — estrutura e contratos definidos.
 * Implementação completa: Sprint 1.
 *
 * REFERÊNCIA DE MAPEAMENTO: docs/SPEC_XML_MAPPING_v2.md — Parte 1
 *
 * ESTRUTURA XML esperada:
 *   nfeProc > NFe > infNFe  (com protocolo — mais comum)
 *   NFe > infNFe            (XML avulso)
 *
 * CAMPOS RTC (reforma):
 *   det.imposto.IBSCBS.gIBSCBS (por item)
 *   total.IBSCBSTot (cabeçalho)
 */

import { XMLParser } from 'fast-xml-parser'
import type { IXmlParser } from './IXmlParser'
import type { ParseResult } from '@/domain/models/FiscalDocument'

/** Configuração do fast-xml-parser para NF-e */
const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  /** Força array para det (itens), mesmo com 1 único item */
  isArray: (name: string) => name === 'det',
} as const

export class ParserNFe implements IXmlParser {
  private readonly xmlParser = new XMLParser(XML_PARSER_CONFIG)

  parse(xmlString: string, filename: string): ParseResult {
    // TODO Sprint 1: Implementar parsing completo
    // Passos:
    // 1. this.xmlParser.parse(xmlString) → JSON
    // 2. Navegar até infNFe (nfeProc.NFe.infNFe ou NFe.infNFe)
    // 3. Extrair cabeçalho: access_key, version, issue_date, purpose
    // 4. Extrair issuer (emit) e receiver (dest) via extractParticipant()
    // 5. Extrair tax_regime de emit.CRT
    // 6. Extrair totals de total.ICMSTot e total.IBSCBSTot
    // 7. Extrair items[] de infNFe.det[] via extractItem()
    // 8. Retornar FiscalDocument com status VALID ou PARTIAL

    return {
      document: null,
      success: false,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          category: 'PARSE',
          source: filename,
          message: 'Parser NF-e ainda não implementado (Sprint 1).',
        },
      ],
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS PRIVADOS (a implementar no Sprint 1)
  // ---------------------------------------------------------------------------

  // private extractParticipant(node: unknown, role: 'emit' | 'dest'): Participant { ... }
  // private extractTotals(totalNode: unknown): DocumentTotals { ... }
  // private extractItem(detNode: unknown): DocumentItem { ... }
  // private extractIcms(icmsNode: unknown): Partial<ItemTaxesCurrent> { ... }
  // private extractRtc(ibscbsNode: unknown): ItemTaxesRTC { ... }
  // private mapPurpose(finNFe: number | string): DocumentPurpose { ... }
  // private mapTaxRegime(crt: number | string): TaxRegime { ... }
  // private makeLog(level, category, source, message, detail?): ProcessingLog { ... }
}
