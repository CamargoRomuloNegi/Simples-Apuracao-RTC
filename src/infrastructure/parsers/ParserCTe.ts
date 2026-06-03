/**
 * @file ParserCTe.ts
 * @description Parser para CT-e (Conhecimento de Transporte Eletrônico) — Modelo 57, Leiaute 3.00.
 *
 * STATUS: Skeleton (Sprint 0).
 * Implementação completa: Sprint 1.
 *
 * REFERÊNCIA DE MAPEAMENTO: docs/SPEC_XML_MAPPING_v2.md — Parte 3
 *
 * ESTRUTURA XML esperada:
 *   cteProc > CTe > infCte  (com protocolo)
 *   CTe > infCte            (avulso)
 *
 * PARTICULARIDADE CRÍTICA:
 * Tributos (ICMS, IBS/CBS) estão no nível do DOCUMENTO (infCte.imp),
 * não por item. Os Comp[] são apenas decomposição do valor do frete.
 * O item[0] recebe os tributos do documento; demais itens ficam vazios.
 * A UI deve exibir aviso explicativo sobre este comportamento.
 *
 * CAMPOS RTC:
 *   infCte.imp.IBSCBS.gIBSCBS (nível documento → atribuído ao item[0])
 */

import { XMLParser } from 'fast-xml-parser'
import type { IXmlParser } from './IXmlParser'
import type { ParseResult } from '@/domain/models/FiscalDocument'

const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  isArray: (name: string) => name === 'Comp' || name === 'infNFe',
} as const

export class ParserCTe implements IXmlParser {
  private readonly xmlParser = new XMLParser(XML_PARSER_CONFIG)

  parse(xmlString: string, filename: string): ParseResult {
    // TODO Sprint 1: Implementar
    // 1. Navegar até infCte
    // 2. Extrair cabeçalho: access_key, CFOP, finCTe → purpose
    // 3. Extrair emit (issuer), rem (sender), dest (receiver)
    // 4. Extrair vPrest.vTPrest → total_value
    // 5. Extrair Comp[] → items[] (sem tributos exceto item[0])
    // 6. Extrair imp.ICMS + imp.IBSCBS → atribuir ao item[0]
    // 7. Extrair referenced_keys de infCTeNorm.infDoc.infNFe[].chave

    return {
      document: null,
      success: false,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          category: 'PARSE',
          source: filename,
          message: 'Parser CT-e ainda não implementado (Sprint 1).',
        },
      ],
    }
  }
}
