// /lib/calculations/contribution-margin.ts
// Story 4.1: Motor de Cálculo de Margem de Contribuição

export interface ProductCalculation {
  nomeProduto: string;
  quantidade: number;
  precoVenda: number;
  impostoPorUnidade: number; // precoVenda × aliquota/100
  cmvUnitario: number;
  mcUnitaria: number;        // precoVenda − imposto − cmvUnitario
  mcTotal: number;           // mcUnitaria × quantidade
}

export interface CalculationInput {
  products: Array<{
    nomeProduto: string;
    quantidade: number;
    valorUnitario: number;
    cmvUnitario: number;
  }>;
  aliquota: number;   // 0-100 (%)
  despesas: number[]; // valores das contas categorizadas como "Despesa"
}

export interface CalculationResult {
  products: ProductCalculation[];
  summary: {
    totalReceita: number;
    totalImpostos: number;
    totalCMV: number;
    totalMC: number;
    totalDespesas: number;
    resultadoOperacional: number; // totalMC − totalDespesas
  };
  calculatedAt: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Pure function — no side effects.
 * Computes contribution margin per product and total operational result.
 *
 * Formulas (PRD FR8 and FR9):
 *   impostoPorUnidade = precoVenda × (aliquota / 100)
 *   mcUnitaria        = precoVenda − impostoPorUnidade − cmvUnitario
 *   mcTotal           = mcUnitaria × quantidade
 *
 *   totalReceita      = Σ(precoVenda × quantidade)
 *   totalImpostos     = Σ(impostoPorUnidade × quantidade)
 *   totalCMV          = Σ(cmvUnitario × quantidade)
 *   totalMC           = Σ(mcTotal)
 *   totalDespesas     = Σ(despesas)
 *   resultadoOp       = totalMC − totalDespesas
 */
export function calculateContributionMargin(
  input: CalculationInput
): CalculationResult {
  const productCalcs: ProductCalculation[] = input.products.map((p) => {
    const impostoPorUnidade = round2(p.valorUnitario * (input.aliquota / 100));
    const mcUnitaria = round2(p.valorUnitario - impostoPorUnidade - p.cmvUnitario);
    const mcTotal = round2(mcUnitaria * p.quantidade);

    return {
      nomeProduto: p.nomeProduto,
      quantidade: p.quantidade,
      precoVenda: p.valorUnitario,
      impostoPorUnidade,
      cmvUnitario: p.cmvUnitario,
      mcUnitaria,
      mcTotal,
    };
  });

  const totalReceita = round2(
    input.products.reduce((acc, p) => acc + p.valorUnitario * p.quantidade, 0)
  );
  const totalImpostos = round2(
    productCalcs.reduce((acc, p) => acc + p.impostoPorUnidade * p.quantidade, 0)
  );
  const totalCMV = round2(
    input.products.reduce((acc, p) => acc + p.cmvUnitario * p.quantidade, 0)
  );
  const totalMC = round2(productCalcs.reduce((acc, p) => acc + p.mcTotal, 0));
  const totalDespesas = round2(input.despesas.reduce((acc, d) => acc + d, 0));
  const resultadoOperacional = round2(totalMC - totalDespesas);

  return {
    products: productCalcs,
    summary: {
      totalReceita,
      totalImpostos,
      totalCMV,
      totalMC,
      totalDespesas,
      resultadoOperacional,
    },
    calculatedAt: new Date().toISOString(),
  };
}
