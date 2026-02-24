// __tests__/components/ResultDashboard.test.tsx
// Story 4.2: Unit tests for Result Dashboard components

import { render, screen } from '@testing-library/react';
import { ResultSummaryCards, formatCurrency } from '@/components/layout/ResultSummaryCards';
import { ProductResultTable, computeFooterTotals } from '@/components/layout/ProductResultTable';
import type { ProductCalculation } from '@/lib/calculations/contribution-margin';
import type { CalculationResult } from '@/lib/calculations/contribution-margin';

// ─── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats positive value in BRL', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/1\.234,56/);
    expect(result).toMatch(/R\$/);
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0,00/);
  });

  it('formats negative value in BRL', () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/500,00/);
    // Negative sign may appear as minus or parentheses depending on locale
    expect(formatCurrency(-500)).not.toBe(formatCurrency(500));
  });

  it('handles large numbers with thousand separators', () => {
    const result = formatCurrency(10000);
    expect(result).toMatch(/10\.000,00/);
  });
});

// ─── computeFooterTotals ──────────────────────────────────────────────────────

describe('computeFooterTotals', () => {
  const products: ProductCalculation[] = [
    {
      nomeProduto: 'Produto A',
      quantidade: 10,
      precoVenda: 100,
      impostoPorUnidade: 6,
      cmvUnitario: 40,
      mcUnitaria: 54,
      mcTotal: 540,
    },
    {
      nomeProduto: 'Produto B',
      quantidade: 5,
      precoVenda: 20,
      impostoPorUnidade: 1.2,
      cmvUnitario: 25,
      mcUnitaria: -6.2,
      mcTotal: -31,
    },
  ];

  it('sums quantidade correctly', () => {
    const totals = computeFooterTotals(products);
    expect(totals.quantidade).toBe(15);
  });

  it('sums totalImpostos (imposto × qtd) correctly', () => {
    const totals = computeFooterTotals(products);
    // Produto A: 6 × 10 = 60, Produto B: 1.2 × 5 = 6 → total = 66
    expect(totals.totalImpostos).toBeCloseTo(66, 2);
  });

  it('sums mcTotal correctly', () => {
    const totals = computeFooterTotals(products);
    // 540 + (-31) = 509
    expect(totals.mcTotal).toBeCloseTo(509, 2);
  });

  it('returns zeros for empty array', () => {
    const totals = computeFooterTotals([]);
    expect(totals.quantidade).toBe(0);
    expect(totals.totalImpostos).toBe(0);
    expect(totals.mcTotal).toBe(0);
  });
});

// ─── ProductResultTable ────────────────────────────────────────────────────────

describe('ProductResultTable', () => {
  const products: ProductCalculation[] = [
    {
      nomeProduto: 'Produto Positivo',
      quantidade: 10,
      precoVenda: 100,
      impostoPorUnidade: 6,
      cmvUnitario: 40,
      mcUnitaria: 54,
      mcTotal: 540,
    },
    {
      nomeProduto: 'Produto Negativo',
      quantidade: 5,
      precoVenda: 20,
      impostoPorUnidade: 1.2,
      cmvUnitario: 25,
      mcUnitaria: -6.2,
      mcTotal: -31,
    },
  ];

  it('renders all product names', () => {
    render(<ProductResultTable products={products} />);
    expect(screen.getByText('Produto Positivo')).toBeInTheDocument();
    expect(screen.getByText('Produto Negativo')).toBeInTheDocument();
  });

  it('marks products with negative MC with data-negative attribute', () => {
    render(<ProductResultTable products={products} />);
    const negativeRows = document.querySelectorAll('[data-negative]');
    expect(negativeRows).toHaveLength(1);
  });

  it('shows warning icon for products with negative mcTotal', () => {
    render(<ProductResultTable products={products} />);
    expect(screen.getByLabelText('MC negativa')).toBeInTheDocument();
  });

  it('does not show warning icon for positive MC products', () => {
    render(<ProductResultTable products={[products[0]]} />);
    expect(screen.queryByLabelText('MC negativa')).not.toBeInTheDocument();
  });

  it('renders TOTAL footer row', () => {
    render(<ProductResultTable products={products} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('sorts products by mcTotal descending (highest first)', () => {
    render(<ProductResultTable products={products} />);
    const rows = screen.getAllByRole('row');
    // Row[0] = header, row[1] = first product (highest MC), row[2] = second, row[3] = footer
    expect(rows[1]).toHaveTextContent('Produto Positivo');
    expect(rows[2]).toHaveTextContent('Produto Negativo');
  });
});

// ─── ResultSummaryCards ────────────────────────────────────────────────────────

describe('ResultSummaryCards', () => {
  const positiveSummary: CalculationResult['summary'] = {
    totalReceita: 1000,
    totalImpostos: 60,
    totalCMV: 400,
    totalMC: 509,
    totalDespesas: 100,
    resultadoOperacional: 409,
  };

  const negativeSummary: CalculationResult['summary'] = {
    ...positiveSummary,
    resultadoOperacional: -50,
  };

  it('renders all 5 card labels', () => {
    render(<ResultSummaryCards summary={positiveSummary} />);
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Total de Impostos')).toBeInTheDocument();
    expect(screen.getByText('Total CMV')).toBeInTheDocument();
    expect(screen.getByText('Total Despesas')).toBeInTheDocument();
    expect(screen.getByText('Resultado Operacional')).toBeInTheDocument();
  });

  it('applies green color class when Resultado Operacional is positive', () => {
    render(<ResultSummaryCards summary={positiveSummary} />);
    const opCard = screen.getByText('Resultado Operacional');
    const valueEl = opCard.nextElementSibling;
    expect(valueEl?.className).toContain('text-green-600');
  });

  it('applies red color class when Resultado Operacional is negative', () => {
    render(<ResultSummaryCards summary={negativeSummary} />);
    const opCard = screen.getByText('Resultado Operacional');
    const valueEl = opCard.nextElementSibling;
    expect(valueEl?.className).toContain('text-red-600');
  });

  it('uses neutral color for non-dynamic cards', () => {
    render(<ResultSummaryCards summary={positiveSummary} />);
    const receitaCard = screen.getByText('Receita Total');
    const valueEl = receitaCard.nextElementSibling;
    expect(valueEl?.className).toContain('text-zinc-900');
  });
});
