'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeriod } from '@/lib/context/period-context';
import { PaidAccountsList } from '@/components/categorias/PaidAccountsList';
import type { CategoryType } from '@/components/categorias/PaidAccountsList';
import type { PaidAccount } from '@/types';

type PageState = 'loading' | 'error' | 'empty' | 'ready';

const normalize = (s: string) => s.trim().toLowerCase();

export default function Passo2Page() {
  const { selectedPeriod } = usePeriod();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [accounts, setAccounts] = useState<PaidAccount[]>([]);
  const [initialCategories, setInitialCategories] = useState<Record<string, CategoryType>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPageState('loading');
      setSaveError(null);

      try {
        const cpRes = await fetch(
          `/api/bling/contas-pagas?month=${selectedPeriod.month}&year=${selectedPeriod.year}`
        );
        if (!cpRes.ok) throw new Error('contas-pagas fetch failed');

        const cpData = await cpRes.json();
        const loadedAccounts: PaidAccount[] = cpData.accounts ?? [];

        if (loadedAccounts.length === 0) {
          if (!cancelled) setPageState('empty');
          return;
        }

        // Fetch saved categories for all unique descriptions
        const descriptions = [...new Set(loadedAccounts.map((a) => normalize(a.descricao)))];
        const params = descriptions
          .map((d) => `descriptions[]=${encodeURIComponent(d)}`)
          .join('&');

        const catRes = await fetch(`/api/categories?${params}`);
        const catData = catRes.ok ? await catRes.json() : { categories: [] };

        const catMap: Record<string, CategoryType> = {};
        for (const cat of catData.categories ?? []) {
          catMap[cat.description] = cat.category as CategoryType;
        }

        if (!cancelled) {
          setAccounts(loadedAccounts);
          setInitialCategories(catMap);
          setPageState('ready');
        }
      } catch {
        if (!cancelled) setPageState('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedPeriod]);

  async function handleSaveAndContinue(
    categorizations: { description: string; category: CategoryType }[]
  ) {
    setSaveError(null);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categorizations }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Erro ao salvar categorizações');
    }

    router.push('/passo-3');
  }

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(selectedPeriod.year, selectedPeriod.month - 1)
  );
  const periodLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${selectedPeriod.year}`;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Beeinside</span>
          </div>
          <span className="text-sm text-zinc-400">{periodLabel}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Passo 2 de 3</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Categorização de Contas Pagas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Classifique cada conta paga de {periodLabel.toLowerCase()} como Despesa ou Custo de Produto.
          </p>
        </div>

        {pageState === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-zinc-500" role="status">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
              aria-hidden="true"
            />
            Carregando contas pagas…
          </div>
        )}

        {pageState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4" role="alert">
            <p className="text-sm font-medium text-red-700">
              Não foi possível carregar as contas pagas.
            </p>
            <p className="mt-1 text-sm text-red-500">
              Verifique se suas contas Bling estão conectadas e tente novamente.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
            >
              Voltar ao Dashboard
            </button>
          </div>
        )}

        {pageState === 'empty' && (
          <div
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-6 text-center"
            role="status"
          >
            <p className="text-sm text-zinc-500">
              Nenhuma conta paga encontrada para {periodLabel.toLowerCase()}.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Voltar ao Dashboard
            </button>
          </div>
        )}

        {pageState === 'ready' && (
          <>
            {saveError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}
            <PaidAccountsList
              accounts={accounts}
              initialCategories={initialCategories}
              onSaveAndContinue={async (categorizations) => {
                try {
                  await handleSaveAndContinue(categorizations);
                } catch (err) {
                  setSaveError(
                    err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
                  );
                  throw err;
                }
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
