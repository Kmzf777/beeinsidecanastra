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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

export function PeriodSelector() {
  const { selectedPeriod, setSelectedPeriod } = usePeriod();

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Seletor de período">
      <label htmlFor="period-month" className="sr-only">
        Mês
      </label>
      <select
        id="period-month"
        value={selectedPeriod.month}
        onChange={(e) =>
          setSelectedPeriod({ ...selectedPeriod, month: Number(e.target.value) })
        }
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      <label htmlFor="period-year" className="sr-only">
        Ano
      </label>
      <select
        id="period-year"
        value={selectedPeriod.year}
        onChange={(e) =>
          setSelectedPeriod({ ...selectedPeriod, year: Number(e.target.value) })
        }
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
