'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PeriodSelector } from '@/components/ui/period-selector';
import { PeriodBadge } from '@/components/ui/period-badge';
import { usePeriod } from '@/lib/context/period-context';

async function getConnectedAccounts(): Promise<number[]> {
  const results = await Promise.all(
    [1, 2].map((account) =>
      fetch(`/api/auth/bling/status?account=${account}`)
        .then((res) => res.json())
        .then((data) => (data.connected ? account : null))
        .catch(() => null)
    )
  );
  return results.filter((n): n is number => n !== null);
}

export default function Dashboard() {
  usePeriod(); // ensure context is available
  const router = useRouter();
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    getConnectedAccounts().then((accounts) => setHasAccounts(accounts.length > 0));
  }, []);

  function handleFetch() {
    router.push('/passo-1');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Beeinside</span>
          </div>
          <PeriodBadge />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Selecione o período e busque os dados para análise.
          </p>
        </div>

        <section
          aria-labelledby="period-section-title"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-6"
        >
          <h2 id="period-section-title" className="mb-4 text-sm font-medium text-zinc-700">
            Período de análise
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-500">Mês / Ano</span>
              <PeriodSelector />
            </div>

            <button
              onClick={handleFetch}
              disabled={!hasAccounts}
              aria-label={
                !hasAccounts
                  ? 'Buscar Dados — conecte uma conta Bling para habilitar'
                  : 'Buscar Dados'
              }
              className="flex h-10 items-center gap-2 rounded-md bg-amber-400 px-5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buscar Dados
            </button>
          </div>

          {!hasAccounts && (
            <p className="mt-3 text-xs text-zinc-400" role="status">
              Conecte ao menos uma conta Bling para habilitar a busca.
            </p>
          )}

        </section>
      </main>
    </div>
  );
}
