'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePeriod } from '@/lib/context/period-context';
import { AliquotaInput } from '@/components/aliquota/AliquotaInput';
import type { AliquotaPreviewProduct } from '@/components/aliquota/AliquotaInput';

function getPreviousMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

function parseAliquota(raw: string): number | null {
  const n = parseFloat(raw.replace(',', '.'));
  if (isNaN(n)) return null;
  return n;
}

export default function Passo3Page() {
  const { selectedPeriod } = usePeriod();
  const router = useRouter();

  const [aliquotaRaw, setAliquotaRaw] = useState('');
  const [previewProduct, setPreviewProduct] = useState<AliquotaPreviewProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const parsed = parseAliquota(aliquotaRaw);
  const isValid = parsed !== null && parsed >= 0 && parsed <= 100;

  // Load previous month's aliquota as suggestion
  useEffect(() => {
    const prev = getPreviousMonthYear(selectedPeriod.month, selectedPeriod.year);

    fetch(`/api/aliquota?month=${prev.month}&year=${prev.year}`)
      .then((res) => (res.ok ? res.json() : { aliquota: null }))
      .then((data) => {
        if (typeof data.aliquota === 'number') {
          setAliquotaRaw(String(data.aliquota));
        }
      })
      .catch(() => {});
  }, [selectedPeriod]);

  // Load first product for preview
  useEffect(() => {
    fetch(
      `/api/bling/notas-fiscais?month=${selectedPeriod.month}&year=${selectedPeriod.year}`
    )
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const first = data.products?.[0] ?? null;
        if (first) {
          setPreviewProduct({
            name: first.nomeProduto,
            price: first.valorUnitario,
          });
        }
      })
      .catch(() => {});
  }, [selectedPeriod]);

  const handleCalcular = useCallback(async () => {
    if (!isValid || parsed === null) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/aliquota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedPeriod.month,
          year: selectedPeriod.year,
          aliquota: parsed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao salvar alíquota');
      }

      router.push('/resultado');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, parsed, selectedPeriod, router]);

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
          <p className="text-xs font-medium uppercase tracking-wider text-amber-500">Passo 3 de 3</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Alíquota de Imposto
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informe a alíquota de imposto (%) a ser considerada para {periodLabel.toLowerCase()}.
          </p>
        </div>

        <div className="max-w-lg space-y-6">
          <AliquotaInput
            value={aliquotaRaw}
            onChange={setAliquotaRaw}
            previewProduct={previewProduct}
          />

          {saveError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              role="alert"
            >
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}

          <button
            onClick={handleCalcular}
            disabled={!isValid || isSaving}
            aria-disabled={!isValid || isSaving}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors',
              isValid && !isSaving
                ? 'bg-amber-400 text-zinc-900 hover:bg-amber-500'
                : 'cursor-not-allowed bg-zinc-100 text-zinc-400',
            ].join(' ')}
          >
            {isSaving && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-700"
                aria-hidden="true"
              />
            )}
            Calcular Resultado
          </button>
        </div>
      </main>
    </div>
  );
}
