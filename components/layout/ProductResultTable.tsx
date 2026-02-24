// components/layout/ProductResultTable.tsx
// Story 4.2: Detailed product contribution margin table

import type { ProductCalculation } from '@/lib/calculations/contribution-margin';

interface Props {
  products: ProductCalculation[];
}

const fmt = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const fmtQty = (value: number): string =>
  new Intl.NumberFormat('pt-BR').format(value);

export function computeFooterTotals(products: ProductCalculation[]) {
  return products.reduce(
    (acc, p) => ({
      quantidade: acc.quantidade + p.quantidade,
      totalImpostos: acc.totalImpostos + p.impostoPorUnidade * p.quantidade,
      mcTotal: acc.mcTotal + p.mcTotal,
    }),
    { quantidade: 0, totalImpostos: 0, mcTotal: 0 },
  );
}

export function ProductResultTable({ products }: Props) {
  const sorted = [...products].sort((a, b) => b.mcTotal - a.mcTotal);
  const totals = computeFooterTotals(sorted);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
              Produto
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              Qtd
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              Preço Médio
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              Imposto
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              CMV Unit.
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              MC Unit.
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
              MC Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const isNegative = p.mcTotal < 0;
            return (
              <tr
                key={`${p.nomeProduto}-${i}`}
                className={['border-b border-zinc-100', isNegative ? 'bg-red-50' : 'bg-white'].join(
                  ' ',
                )}
                data-negative={isNegative || undefined}
              >
                <td
                  className={[
                    'px-4 py-3',
                    isNegative ? 'font-medium text-red-700' : 'text-zinc-900',
                  ].join(' ')}
                >
                  {p.nomeProduto}
                  {isNegative && (
                    <span className="ml-2 text-xs text-red-500" aria-label="MC negativa">
                      ⚠
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-zinc-600">{fmtQty(p.quantidade)}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{fmt(p.precoVenda)}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{fmt(p.impostoPorUnidade)}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{fmt(p.cmvUnitario)}</td>
                <td
                  className={[
                    'px-4 py-3 text-right',
                    p.mcUnitaria < 0 ? 'text-red-600' : 'text-zinc-600',
                  ].join(' ')}
                >
                  {fmt(p.mcUnitaria)}
                </td>
                <td
                  className={[
                    'px-4 py-3 text-right font-medium',
                    isNegative ? 'text-red-600' : 'text-zinc-900',
                  ].join(' ')}
                >
                  {fmt(p.mcTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-200 bg-zinc-50">
            <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total
            </td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">
              {fmtQty(totals.quantidade)}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">
              {fmt(totals.totalImpostos)}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td
              className={[
                'px-4 py-3 text-right text-sm font-bold',
                totals.mcTotal < 0 ? 'text-red-600' : 'text-zinc-900',
              ].join(' ')}
            >
              {fmt(totals.mcTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
