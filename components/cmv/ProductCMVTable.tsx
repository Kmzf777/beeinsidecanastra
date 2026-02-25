'use client';

import { useState } from 'react';
import type { ProductSale } from '@/types';

interface Props {
  products: ProductSale[];
  initialCmvs: Record<string, number>;
  onSaveAndContinue: (cmvs: { productName: string; cmvUnitario: number }[]) => Promise<void>;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function validateCmv(rawValue: string): string {
  if (!rawValue || rawValue.trim() === '') return '';
  const num = parseFloat(rawValue);
  if (isNaN(num) || num === 0) return 'CMV não pode ser zero';
  return '';
}

export function ProductCMVTable({ products, initialCmvs, onSaveAndContinue }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of products) {
      const saved = initialCmvs[p.nomeProduto];
      init[p.nomeProduto] = saved !== undefined && saved !== 0 ? String(saved) : '';
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const pendingCount = products.filter((p) => {
    const v = values[p.nomeProduto];
    return !v || v.trim() === '' || parseFloat(v) === 0 || isNaN(parseFloat(v));
  }).length;

  function handleChange(product: ProductSale, rawValue: string) {
    setValues((prev) => ({ ...prev, [product.nomeProduto]: rawValue }));
    const err = validateCmv(rawValue);
    setErrors((prev) => ({ ...prev, [product.nomeProduto]: err }));
  }

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    for (const p of products) {
      const v = values[p.nomeProduto] ?? '';
      if (v) {
        const err = validateCmv(v);
        if (err) newErrors[p.nomeProduto] = err;
      }
    }

    if (Object.values(newErrors).some((e) => e !== '')) {
      setErrors(newErrors);
      return;
    }

    const cmvs = products
      .filter((p) => {
        const v = values[p.nomeProduto];
        return v && v.trim() !== '' && !isNaN(parseFloat(v)) && parseFloat(v) !== 0;
      })
      .map((p) => ({
        productName: p.nomeProduto,
        cmvUnitario: parseFloat(values[p.nomeProduto]),
      }));

    setSaving(true);
    try {
      await onSaveAndContinue(cmvs);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {pendingCount > 0 && (
        <p
          className="mb-3 text-sm font-medium text-amber-600"
          role="status"
          aria-live="polite"
        >
          {pendingCount} produto{pendingCount !== 1 ? 's' : ''} sem CMV
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-right">Qtd Vendida</th>
              <th className="px-4 py-3 text-right">Preço Médio (R$)</th>
              <th className="px-4 py-3 text-right">CMV Unitário (R$)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isPending = !values[product.nomeProduto] || values[product.nomeProduto].trim() === '' || parseFloat(values[product.nomeProduto]) === 0 || isNaN(parseFloat(values[product.nomeProduto]));
              const error = errors[product.nomeProduto];

              return (
                <tr
                  key={product.nomeProduto}
                  className={[
                    'border-b border-zinc-100 last:border-0 transition-colors',
                    isPending ? 'border-l-2 border-l-amber-400 bg-amber-50/40' : '',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">{product.nomeProduto}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{product.quantidade}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {formatBRL(product.valorUnitario)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={values[product.nomeProduto] ?? ''}
                        onChange={(e) => handleChange(product, e.target.value)}
                        aria-label={`CMV de ${product.nomeProduto}`}
                        aria-describedby={error ? `err-${product.nomeProduto}` : undefined}
                        aria-invalid={!!error}
                        className={[
                          'w-32 rounded-md border px-3 py-1.5 text-right text-sm text-zinc-900',
                          'outline-none transition-colors',
                          'focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30',
                          error
                            ? 'border-red-400 bg-red-50'
                            : 'border-zinc-200 bg-white',
                        ].join(' ')}
                      />
                      {error && (
                        <span
                          id={`err-${product.nomeProduto}`}
                          role="alert"
                          className="text-xs text-red-500"
                        >
                          {error}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
