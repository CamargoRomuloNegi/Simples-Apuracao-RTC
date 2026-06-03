/**
 * @file Header.tsx
 * @description Cabeçalho superior da aplicação.
 * Sprint 3: Integrar contador de documentos e CNPJ analisado do store.
 */

'use client'

import { Building2, Trash2 } from 'lucide-react'

export function Header() {
  // Sprint 3: conectar ao useFiscalStore
  // const { documents, analyzedCnpjRoot, clearAll } = useFiscalStore()

  return (
    <header
      className="flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0"
      style={{ height: 'var(--header-height)' }}
    >
      {/* Empresa analisada */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2 size={16} className="text-slate-400" />
        <span className="text-slate-400">Empresa analisada:</span>
        <span className="font-medium text-slate-700">
          {/* Sprint 3: exibir CNPJ formatado ou "Não detectado" */}
          Não detectado
        </span>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        {/* Contador de documentos — Sprint 3 */}
        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          0 documentos
        </span>

        {/* Botão limpar sessão */}
        <button
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          title="Limpar todos os documentos da sessão"
          onClick={() => {/* Sprint 3: clearAll() */}}
        >
          <Trash2 size={14} />
          Limpar sessão
        </button>
      </div>
    </header>
  )
}
