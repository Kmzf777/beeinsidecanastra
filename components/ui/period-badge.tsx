'use client';

import { usePeriod } from '@/lib/context/period-context';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function PeriodBadge() {
  const { selectedPeriod } = usePeriod();
  const label = `${MONTHS[selectedPeriod.month - 1]} ${selectedPeriod.year}`;

  return (
    <span
      aria-label={`Período selecionado: ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      {label}
    </span>
  );
}
