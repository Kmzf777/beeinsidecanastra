'use client';

import { useState, useMemo } from 'react';
import type { PaidAccount } from '@/types';

export type CategoryType = 'Despesa' | 'Custo de Produto' | 'Ignorar';

interface CategoryOption {
  value: CategoryType;
  label: string;
  activeClass: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'Despesa',
    label: 'Despesa',
    activeClass: 'bg-amber-100 text-amber-800 border-amber-400 font-semibold',
  },
  {
    value: 'Custo de Produto',
    label: 'Custo',
    activeClass: 'bg-sky-100 text-sky-800 border-sky-400 font-semibold',
  },
  {
    value: 'Ignorar',
    label: 'Ignorar',
    activeClass: 'bg-zinc-200 text-zinc-700 border-zinc-400 font-semibold',
  },
];

const normalize = (s: string) => s.trim().toLowerCase();

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

interface Props {
  accounts: PaidAccount[];
  /** Keyed by normalize(description) — pre-populated from Supabase suggestions */
  initialCategories: Record<string, CategoryType>;
  onSaveAndContinue: (
    categorizations: { description: string; category: CategoryType }[]
  ) => Promise<void>;
}

export function PaidAccountsList({ accounts, initialCategories, onSaveAndContinue }: Props) {
  const [categories, setCategories] = useState<Record<string, CategoryType>>(() => {
    const init: Record<string, CategoryType> = {};
    for (const account of accounts) {
      const suggestion = initialCategories[normalize(account.descricao)];
      init[account.id] = suggestion ?? 'Ignorar';
    }
    return init;
  });
  const [saving, setSaving] = useState(false);

  const totalDespesas = useMemo(
    () =>
      accounts
        .filter((a) => categories[a.id] === 'Despesa')
        .reduce((sum, a) => sum + a.valor, 0),
    [accounts, categories]
  );

  const totalCusto = useMemo(
    () =>
      accounts
        .filter((a) => categories[a.id] === 'Custo de Produto')
        .reduce((sum, a) => sum + a.valor, 0),
    [accounts, categories]
  );

  function handleCategoryChange(accountId: string, category: CategoryType) {
    setCategories((prev) => ({ ...prev, [accountId]: category }));
  }

  async function handleSave() {
    const categorizations = accounts
      .filter((a) => categories[a.id] === 'Despesa' || categories[a.id] === 'Custo de Produto')
      .map((a) => ({ description: a.descricao, category: categories[a.id] }));

    setSaving(true);
    try {
      await onSaveAndContinue(categorizations);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4" aria-label="Resumo de categorias">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
            Total Despesas
          </p>
          <p
            className="mt-1 text-xl font-semibold text-amber-900"
            aria-live="polite"
            aria-label={`Total despesas: ${formatBRL(totalDespesas)}`}
          >
            {formatBRL(totalDespesas)}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-600">
            Total Custo de Produto
          </p>
          <p
            className="mt-1 text-xl font-semibold text-sky-900"
            aria-live="polite"
            aria-label={`Total custo de produto: ${formatBRL(totalCusto)}`}
          >
            {formatBRL(totalCusto)}
          </p>
          <p className="mt-0.5 text-xs text-sky-500">
            Informativo — não afeta o resultado operacional nesta versão
          </p>
        </div>
      </div>

      {/* Accounts table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Valor (R$)</th>
              <th className="px-4 py-3 text-right">Data de Pagamento</th>
              <th className="px-4 py-3 text-center">Fornecedor</th>
              <th className="px-4 py-3 text-center">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const current = categories[account.id] ?? 'Ignorar';
              return (
                <tr
                  key={account.id}
                  className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">{account.descricao}</td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {formatBRL(account.valor)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {formatDate(account.dataPagamento)}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500">
                    {account.fornecedor || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      role="radiogroup"
                      aria-label={`Categoria para ${account.descricao}`}
                      className="flex items-center justify-center gap-1"
                    >
                      {CATEGORY_OPTIONS.map((opt) => {
                        const isSelected = current === opt.value;
                        return (
                          <button
                            key={opt.value}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={opt.value}
                            onClick={() => handleCategoryChange(account.id, opt.value)}
                            className={[
                              'rounded-md border px-2.5 py-1 text-xs transition-colors',
                              isSelected
                                ? opt.activeClass
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50',
                            ].join(' ')}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          className="flex h-10 items-center gap-2 rounded-md bg-amber-400 px-6 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent"
                aria-hidden="true"
              />
              Salvando…
            </>
          ) : (
            'Salvar e Continuar'
          )}
        </button>
      </div>
    </div>
  );
}
