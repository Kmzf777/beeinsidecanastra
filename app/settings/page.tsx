import { Suspense } from "react";
import { BlingConnectionStatus } from "@/components/bling/BlingConnectionStatus";
import { SettingsErrorMessage } from "@/components/bling/SettingsErrorMessage";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-xl font-semibold text-zinc-900">
        Configurações
      </h1>

      <Suspense fallback={null}>
        <SettingsErrorMessage />
      </Suspense>

      <section className="rounded-xl border border-zinc-200 p-6">
        <h2 className="mb-4 text-base font-medium text-zinc-800">
          Integração Bling
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">Conta 1</span>
              <BlingConnectionStatus account={1} />
            </div>

            <a
              href="/api/auth/bling/connect?account=1"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-amber-300"
            >
              Conectar Conta 1
            </a>
          </div>

          <hr className="border-zinc-100" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">Conta 2</span>
              <BlingConnectionStatus account={2} />
            </div>

            <a
              href="/api/auth/bling/connect?account=2"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-amber-300"
            >
              Conectar Conta 2
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
