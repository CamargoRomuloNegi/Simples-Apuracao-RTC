/**
 * @file ParserNFSe.ts
 * @description Parser para NFS-e Nacional (SNNFSe/DPS) — padrão gov.br/nfse.
 *
 * STATUS: Skeleton (Sprint 0).
 * Implementação completa: Sprint 1.
 *
 * REFERÊNCIA DE MAPEAMENTO: docs/SPEC_XML_MAPPING_v2.md — Parte 4
 *
 * PADRÃO SUPORTADO: Exclusivamente o padrão nacional SNNFSe (sped.fazenda.gov.br/nfse).
 * Padrão ABRASF municipal → rejeitado no DocumentDetector (retorna UNKNOWN).
 *
 * ESTRUTURA XML:
 *   NFSe (namespace sped.fazenda.gov.br/nfse)
 *     └── infNFSe
 *           └── DPS > infDPS
 *                 ├── prest    → issuer
 *                 ├── toma     → receiver
 *                 ├── serv     → item.description, item.cfop (cTribNac)
 *                 └── valores
 *                       ├── vServPrest     → total_value
 *                       ├── trib.tribMun   → ISS
 *                       └── trib.tribFed   → IBSCBS (IBS/CBS da Reforma)
 *
 * ATENÇÃO — namespace XML:
 * O XMLParser deve ser configurado com removeNSPrefix: true para ignorar
 * prefixos de namespace como "nfse:" nos nomes dos nós.
 *
 * ACCESS KEY:
 * NFS-e não tem chave SEFAZ de 44 dígitos.
 * Chave composta: infNFSe[@Id] com prefixo "NFSe" removido.
 * Fallback: "{CNPJ_prestador}_{nNFSe}"
 */

import { XMLParser } from 'fast-xml-parser'
import type { IXmlParser } from './IXmlParser'
import type { ParseResult } from '@/domain/models/FiscalDocument'

const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  /** Remove prefixos de namespace (ex: "nfse:NFSe" → "NFSe") */
  removeNSPrefix: true,
} as const

export class ParserNFSe implements IXmlParser {
  private readonly xmlParser = new XMLParser(XML_PARSER_CONFIG)

  parse(xmlString: string, filename: string): ParseResult {
    // TODO Sprint 1: Implementar
    // 1. Parse XML com removeNSPrefix: true
    // 2. Navegar até infNFSe.DPS.infDPS
    // 3. Extrair access_key de infNFSe[@Id] ou compor fallback
    // 4. Extrair prest → issuer (incluindo regTrib.opSimpNac → tax_regime)
    // 5. Extrair toma → receiver (pode ser CPF ou CNPJ)
    // 6. Extrair serv.xDescServ, serv.cServ.cTribNac → item único
    // 7. Extrair valores.vServPrest.vServ → total_value + item.gross_value
    // 8. Extrair valores.trib.tribMun.tribISSQN → taxes_current.iss_*
    // 9. Extrair valores.trib.tribFed.IBSCBS → item.rtc (IBS/CBS)
    // 10. Extrair valores.trib.tribFed.retTrib → ir_value, csll_value, inss_value
    // 11. municipality_code de serv.locPrest.cLocPrestacao

    return {
      document: null,
      success: false,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          category: 'PARSE',
          source: filename,
          message: 'Parser NFS-e Nacional ainda não implementado (Sprint 1).',
        },
      ],
    }
  }
}
