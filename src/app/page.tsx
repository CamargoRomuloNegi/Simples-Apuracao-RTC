/**
 * @file page.tsx (raiz — rota "/")
 * @description Página de Upload — ponto de entrada do usuário.
 * Sprint 3: Implementar UploadZone completo.
 */

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Simples Apuração RTC</h1>
        <p className="mt-2 text-slate-500">
          Apuração assistida de IBS/CBS — Reforma Tributária do Consumo
        </p>
      </div>

      {/* Placeholder — Sprint 3 implementa UploadZone */}
      <div className="w-full max-w-2xl border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-white">
        <p className="text-slate-400 text-sm">
          UploadZone — Sprint 3
        </p>
      </div>

      <p className="text-xs text-slate-400">
        🔒 Seus dados são processados exclusivamente no seu navegador. Nenhum arquivo é enviado a servidores.
      </p>
    </div>
  )
}
