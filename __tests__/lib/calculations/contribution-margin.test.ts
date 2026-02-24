import {
  calculateContributionMargin,
  type CalculationInput,
} from "@/lib/calculations/contribution-margin";

describe("calculateContributionMargin", () => {
  // Test 1 (AC4): Cálculo correto com valores reais
  // produto R$100, CMV R$40, alíquota 6%, qtd 10
  it("calculates correctly with real values", () => {
    const input: CalculationInput = {
      products: [
        { nomeProduto: "Camiseta", quantidade: 10, valorUnitario: 100, cmvUnitario: 40 },
      ],
      aliquota: 6,
      despesas: [200],
    };

    const result = calculateContributionMargin(input);
    const p = result.products[0];

    // impostoPorUnidade = 100 × 0.06 = 6
    expect(p.impostoPorUnidade).toBeCloseTo(6);
    // mcUnitaria = 100 − 6 − 40 = 54
    expect(p.mcUnitaria).toBeCloseTo(54);
    // mcTotal = 54 × 10 = 540
    expect(p.mcTotal).toBeCloseTo(540);

    expect(result.summary.totalReceita).toBeCloseTo(1000);   // 100 × 10
    expect(result.summary.totalImpostos).toBeCloseTo(60);    // 6 × 10
    expect(result.summary.totalCMV).toBeCloseTo(400);        // 40 × 10
    expect(result.summary.totalMC).toBeCloseTo(540);
    expect(result.summary.totalDespesas).toBeCloseTo(200);
    expect(result.summary.resultadoOperacional).toBeCloseTo(340); // 540 − 200
  });

  // Test 2 (AC4): Produto com CMV = 0 → MC = Qtd × (Preço − Imposto)
  it("handles product with CMV = 0 (e.g. services)", () => {
    const input: CalculationInput = {
      products: [
        { nomeProduto: "Consultoria", quantidade: 5, valorUnitario: 200, cmvUnitario: 0 },
      ],
      aliquota: 10,
      despesas: [],
    };

    const result = calculateContributionMargin(input);
    const p = result.products[0];

    // impostoPorUnidade = 200 × 0.10 = 20
    expect(p.impostoPorUnidade).toBeCloseTo(20);
    // mcUnitaria = 200 − 20 − 0 = 180
    expect(p.mcUnitaria).toBeCloseTo(180);
    // mcTotal = 180 × 5 = 900
    expect(p.mcTotal).toBeCloseTo(900);
    expect(result.summary.resultadoOperacional).toBeCloseTo(900);
  });

  // Test 3 (AC4): Alíquota = 0% → sem dedução de imposto
  it("handles aliquota = 0% (no tax deduction)", () => {
    const input: CalculationInput = {
      products: [
        { nomeProduto: "Produto Isento", quantidade: 3, valorUnitario: 150, cmvUnitario: 50 },
      ],
      aliquota: 0,
      despesas: [],
    };

    const result = calculateContributionMargin(input);
    const p = result.products[0];

    expect(p.impostoPorUnidade).toBeCloseTo(0);
    // mcUnitaria = 150 − 0 − 50 = 100
    expect(p.mcUnitaria).toBeCloseTo(100);
    expect(p.mcTotal).toBeCloseTo(300); // 100 × 3
    expect(result.summary.totalImpostos).toBeCloseTo(0);
  });

  // Test 4 (AC4): MC negativa (CMV > Preço após imposto) → resultado negativo esperado
  it("returns negative MC when CMV exceeds price after tax", () => {
    const input: CalculationInput = {
      products: [
        { nomeProduto: "Produto Prejuízo", quantidade: 4, valorUnitario: 50, cmvUnitario: 60 },
      ],
      aliquota: 5,
      despesas: [],
    };

    const result = calculateContributionMargin(input);
    const p = result.products[0];

    // impostoPorUnidade = 50 × 0.05 = 2.5
    // mcUnitaria = 50 − 2.5 − 60 = −12.5
    expect(p.mcUnitaria).toBeCloseTo(-12.5);
    expect(p.mcTotal).toBeCloseTo(-50); // −12.5 × 4
    expect(result.summary.resultadoOperacional).toBeLessThan(0);
  });

  // Test 5 (AC4): Lista vazia de produtos → ResultadoOperacional = 0 − Σ(Despesas)
  it("returns resultadoOperacional = 0 − despesas when products list is empty", () => {
    const input: CalculationInput = {
      products: [],
      aliquota: 8,
      despesas: [300, 150.5],
    };

    const result = calculateContributionMargin(input);

    expect(result.products).toHaveLength(0);
    expect(result.summary.totalReceita).toBeCloseTo(0);
    expect(result.summary.totalMC).toBeCloseTo(0);
    expect(result.summary.totalDespesas).toBeCloseTo(450.5);
    expect(result.summary.resultadoOperacional).toBeCloseTo(-450.5);
  });
});
