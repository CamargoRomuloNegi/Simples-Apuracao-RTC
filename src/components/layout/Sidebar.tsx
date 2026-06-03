/**
 * @file Sidebar.tsx
 * @description Navegação lateral fixa da aplicação.
 * Sprint 3: Integrar com estado do store (contador de documentos, etc.)
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, FileSearch, BarChart2, AlertTriangle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',          label: 'Upload',       icon: Upload,       description: 'Carregar XMLs' },
  { href: '/explorer',  label: 'Documentos',   icon: FileSearch,   description: 'Explorar lote' },
  { href: '/analysis',  label: 'Apuração RTC', icon: BarChart2,    description: 'IBS/CBS' },
  { href: '/reports',   label: 'Conformidade', icon: AlertTriangle, description: 'Inconformidades' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col bg-slate-900 text-white shrink-0"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <FileText className="text-blue-400 shrink-0" size={22} />
        <div>
          <p className="text-sm font-bold leading-tight">Apuração RTC</p>
          <p className="text-xs text-slate-400 leading-tight">Reforma Tributária</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon size={18} className="shrink-0" />
              <div>
                <p className="font-medium leading-tight">{item.label}</p>
                <p className={cn('text-xs leading-tight', isActive ? 'text-blue-200' : 'text-slate-500')}>
                  {item.description}
                </p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 leading-relaxed">
          🔒 Processamento local
          <br />Nenhum dado é enviado a servidores.
        </p>
        <p className="text-xs text-slate-600 mt-2">v0.1.0 — Sprint 0</p>
      </div>
    </aside>
  )
}
