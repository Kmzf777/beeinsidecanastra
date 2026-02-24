'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeriod } from '@/lib/context/period-context';
import { ProductCMVTable } from '@/components/cmv/ProductCMVTable';
import type { ProductSale } from '@/types';

type PageState = 'loading' | 'error' | 'empty' | 'ready';

export default function Passo1Page() {
  const { selectedPeriod } = usePeriod();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [products, setProducts] = useState<ProductSale[]>([]);
  const [initialCmvs, setInitialCmvs] = useState<Record<string, number>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPageState('loading');
      setSaveError(null);

      try {
        const nfRes = await fetch(
          `/api/bling/notas-fiscais?month=${selectedPeriod.month}&year=${selectedPeriod.year}`
        );
        if (!nfRes.ok) throw new Error('NF fetch failed');

        const nfData = await nfRes.json();
        const prods: ProductSale[] = nfData.products ?? [];

        if (prods.length === 0) {
          if (!cancelled) setPageState('empty');
          return;
        }

        const cmvParams = prods
          .map((p) => `products[]=${encodeURIComponent(p.nomeProduto)}`)
          .join('&');
        const cmvRes = await fetch(`/api/cmv?${cmvParams}`);
        const cmvData = cmvRes.ok ? await cmvRes.json() : { cmvs: {} };

        if (!cancelled) {
          setProducts(prods);
          setInitialCmvs(cmvData.cmvs ?? {});
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
    cmvs: { productName: string; cmvUnitario: number }[]
  ) {
    setSaveError(null);
    const res = await fetch('/api/cmv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmvs }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Erro ao salvar CMVs');
    }

    router.push('/passo-2');
  }

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(selectedPeriod.year, selectedPeriod.month - 1)
  );
  const periodLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${selectedPeriod.year}`;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Beeinside</span>
          </div>
          <span className="text-sm text-zinc-400">{periodLabel}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Passo 1 de 3</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            CMV por Produto
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informe o custo unitário de cada produto vendido em {periodLabel.toLowerCase()}.
          </p>
        </div>

        {pageState === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-zinc-500" role="status">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
              aria-hidden="true"
            />
            Carregando produtos…
          </div>
        )}

        {pageState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4" role="alert">
            <p className="text-sm font-medium text-red-700">
              Não foi possível carregar os dados de vendas.
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
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-6 text-center" role="status">
            <p className="text-sm text-zinc-500">
              Nenhum produto encontrado para {periodLabel.toLowerCase()}.
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
            <ProductCMVTable
              products={products}
              initialCmvs={initialCmvs}
              onSaveAndContinue={async (cmvs) => {
                try {
                  await handleSaveAndContinue(cmvs);
                } catch (err) {
                  setSaveError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.');
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
