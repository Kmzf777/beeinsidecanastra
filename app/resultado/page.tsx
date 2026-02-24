'use client';

// app/resultado/page.tsx
// Story 4.2: Final Result Dashboard — contribution margin per product + operational result

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePeriod } from '@/lib/context/period-context';
import type { CalculationResult } from '@/lib/calculations/contribution-margin';
import { ResultSummaryCards } from '@/components/layout/ResultSummaryCards';
import { ProductResultTable } from '@/components/layout/ProductResultTable';
import { exportToCsv } from '@/lib/export/csv';

type PageState = 'loading' | 'error' | 'empty' | 'ready';

interface PaidAccountInput {
  descricao: string;
  valor: number;
}

export default function ResultadoPage() {
  const { selectedPeriod } = usePeriod();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    setPageState('loading');
    setErrorMessage(null);

    try {
      const [nfRes, cpRes] = await Promise.all([
        fetch(
          `/api/bling/notas-fiscais?month=${selectedPeriod.month}&year=${selectedPeriod.year}`,
        ),
        fetch(
          `/api/bling/contas-pagas?month=${selectedPeriod.month}&year=${selectedPeriod.year}`,
        ),
      ]);

      if (!nfRes.ok || !cpRes.ok) throw new Error('Erro ao buscar dados do período');

      const [nfData, cpData] = await Promise.all([nfRes.json(), cpRes.json()]);

      const products: { nomeProduto: string; quantidade: number; valorUnitario: number }[] =
        nfData.products ?? [];

      if (products.length === 0) {
        setPageState('empty');
        return;
      }

      const paidAccounts: PaidAccountInput[] = (cpData.accounts ?? []).map(
        (a: { descricao: string; valor: number }) => ({
          descricao: a.descricao,
          valor: a.valor,
        }),
      );

      const calcRes = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedPeriod.month,
          year: selectedPeriod.year,
          products,
          paidAccounts,
        }),
      });

      if (!calcRes.ok) {
        const data = await calcRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao calcular resultado');
      }

      const calcData: CalculationResult = await calcRes.json();
      setResult(calcData);
      setPageState('ready');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro ao calcular. Tente novamente.',
      );
      setPageState('error');
    }
  }, [selectedPeriod]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(selectedPeriod.year, selectedPeriod.month - 1),
  );
  const periodLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${selectedPeriod.year}`;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Beeinside</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{periodLabel}</span>
            {pageState === 'ready' && (
              <button
                onClick={() => result && exportToCsv(result, periodLabel)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Resultado — {periodLabel}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Margem de contribuição por produto e resultado operacional do período.
          </p>
        </div>

        {pageState === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-zinc-500" role="status">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
              aria-hidden="true"
            />
            Calculando resultado…
          </div>
        )}

        {pageState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4" role="alert">
            <p className="text-sm font-medium text-red-700">
              {errorMessage ?? 'Não foi possível calcular o resultado.'}
            </p>
            <button
              onClick={calculate}
              className="mt-3 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {pageState === 'empty' && (
          <div
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-6 text-center"
            role="status"
          >
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

        {pageState === 'ready' && result && (
          <div className="space-y-8">
            <ResultSummaryCards summary={result.summary} />
            <ProductResultTable products={result.products} />

            <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4">
              <span className="text-xs text-zinc-400">Editar:</span>
              <button
                onClick={() => router.push('/passo-1')}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                CMV
              </button>
              <button
                onClick={() => router.push('/passo-2')}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                Despesas
              </button>
              <button
                onClick={() => router.push('/passo-3')}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                Alíquota
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
