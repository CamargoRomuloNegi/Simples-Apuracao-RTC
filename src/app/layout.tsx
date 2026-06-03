/**
 * @file layout.tsx
 * @description Layout raiz da aplicação Next.js (App Router).
 * Define estrutura visual: Sidebar fixa + Header + conteúdo principal.
 */

import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Simples Apuração RTC',
  description: 'Apuração assistida de IBS/CBS — Reforma Tributária do Consumo',
  robots: 'noindex, nofollow', // Aplicação de uso interno — não indexar
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar fixa à esquerda */}
          <Sidebar />

          {/* Área principal */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
