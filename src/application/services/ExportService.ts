/**
 * @file ExportService.ts
 * @description Serviço de exportação dos dados analisados para Excel (XLSX).
 *
 * STATUS: Skeleton (Sprint 0).
 * Implementação completa: Sprint 5.
 *
 * ESTRUTURA DO EXCEL (2 abas):
 *
 * Aba 1 — "Documentos" (visão cabeçalho):
 *   Chave de Acesso, Tipo, Direção, Finalidade, Data Emissão,
 *   Emitente CNPJ, Emitente Nome, Destinatário CNPJ, Destinatário Nome,
 *   Regime, Valor Total, Status,
 *   [RTC] Base IBS/CBS, Total IBS, Total CBS, Saldo
 *
 * Aba 2 — "Itens (Analítico)" (desnormalizado — pronto para Pivot Table):
 *   Todos os campos do cabeçalho + por item:
 *   Nº Item, Descrição, CFOP, NCM, Valor Bruto, Desconto, Valor Líquido,
 *   [RTC] CST, cClassTrib, Base IBS/CBS, Alíq IBS UF, Valor IBS UF,
 *   Alíq IBS Mun, Valor IBS Mun, Valor IBS Total, Alíq CBS, Valor CBS,
 *   Impacto RTC (CRÉDITO/DÉBITO/NEUTRO)
 *
 * LGPD: A exportação é client-side. O arquivo é gerado no browser
 * e baixado diretamente pelo usuário. Nenhum dado transita por servidor.
 */

import type { FiscalDocument } from '@/domain/models/FiscalDocument'

/**
 * Gera e baixa o arquivo Excel com todos os documentos analisados.
 * Operação client-side (SheetJS) — nenhum dado vai para servidor.
 *
 * @param documents - Lista de documentos enriquecidos pelo TaxAnalyzerService
 * @param filename  - Nome do arquivo de saída (padrão: apuracao-rtc-{data}.xlsx)
 */
export async function exportToExcel(
  documents: FiscalDocument[],
  filename?: string,
): Promise<void> {
  // TODO Sprint 5: Implementar
  // 1. import('xlsx') — import dinâmico para não bloquear o bundle principal
  // 2. Construir array de linhas para Aba 1 (cabeçalho)
  // 3. Construir array de linhas para Aba 2 (analítico — desnormalizado por item)
  // 4. Criar workbook com 2 worksheets
  // 5. Aplicar formatação: cabeçalhos em negrito, colunas numéricas com 2 casas
  // 6. XLSX.writeFile() → download direto no browser

  void documents
  void filename
  throw new Error('ExportService.exportToExcel: não implementado (Sprint 5)')
}

/**
 * Formata um valor numérico para exibição no Excel (2 casas decimais).
 * Retorna string vazia para undefined/null (não polui as células).
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return ''
  return value.toFixed(2)
}

/**
 * Formata uma data ISO 8601 para o padrão brasileiro (DD/MM/YYYY HH:mm).
 */
export function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}
