// components/layout/ResultSummaryCards.tsx
// Story 4.2: Summary cards for the final result dashboard

import type { CalculationResult } from '@/lib/calculations/contribution-margin';

interface Props {
  summary: CalculationResult['summary'];
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CARDS: { key: keyof CalculationResult['summary']; label: string; dynamic: boolean }[] = [
  { key: 'totalReceita', label: 'Receita Total', dynamic: false },
  { key: 'totalImpostos', label: 'Total de Impostos', dynamic: false },
  { key: 'totalCMV', label: 'Total CMV', dynamic: false },
  { key: 'totalDespesas', label: 'Total Despesas', dynamic: false },
  { key: 'resultadoOperacional', label: 'Resultado Operacional', dynamic: true },
];

export function ResultSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map(({ key, label, dynamic }) => {
        const value = summary[key];
        const isPositive = value >= 0;

        return (
          <div key={key} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p
              className={[
                'mt-1 text-lg font-bold tracking-tight',
                dynamic
                  ? isPositive
                    ? 'text-green-600'
                    : 'text-red-600'
                  : 'text-zinc-900',
              ].join(' ')}
            >
              {formatCurrency(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
