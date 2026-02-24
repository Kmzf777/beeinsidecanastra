// lib/export/csv.ts
// Story 4.2: CSV export utility with UTF-8 BOM for PT-BR Excel compatibility

import type { CalculationResult } from '@/lib/calculations/contribution-margin';

const fmtNum = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function exportToCsv(result: CalculationResult, periodLabel: string): void {
  const bom = '\uFEFF'; // UTF-8 BOM for Excel PT-BR
  const sep = ';';      // Semicolon separator for PT-BR locale

  const headers = [
    'Produto',
    'Qtd Vendida',
    'Preço Médio (R$)',
    'Imposto (R$)',
    'CMV Unit. (R$)',
    'MC Unit. (R$)',
    'MC Total (R$)',
  ];

  const sorted = [...result.products].sort((a, b) => b.mcTotal - a.mcTotal);

  const productRows = sorted.map((p) => [
    p.nomeProduto,
    String(p.quantidade),
    fmtNum(p.precoVenda),
    fmtNum(p.impostoPorUnidade),
    fmtNum(p.cmvUnitario),
    fmtNum(p.mcUnitaria),
    fmtNum(p.mcTotal),
  ]);

  const summaryRows: string[][] = [
    [],
    ['Resumo do Período'],
    ['Receita Total', '', '', '', '', '', fmtNum(result.summary.totalReceita)],
    ['Total de Impostos', '', '', '', '', '', fmtNum(result.summary.totalImpostos)],
    ['Total CMV', '', '', '', '', '', fmtNum(result.summary.totalCMV)],
    ['Total Despesas', '', '', '', '', '', fmtNum(result.summary.totalDespesas)],
    ['Resultado Operacional', '', '', '', '', '', fmtNum(result.summary.resultadoOperacional)],
  ];

  const csv =
    bom +
    [headers, ...productRows, ...summaryRows]
      .map((row) => row.join(sep))
      .join('\n');

  const slug = periodLabel.toLowerCase().replace(/\s+/g, '-');
  const filename = `resultado-${slug}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
