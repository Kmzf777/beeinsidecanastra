import { consolidateProducts } from "@/lib/calculations/consolidate-products";
import type { RawProductItem } from "@/lib/bling/notas-fiscais";

describe("consolidateProducts", () => {
  it("returns empty array for empty input", () => {
    expect(consolidateProducts([])).toEqual([]);
  });

  it("consolidates the same product from two accounts", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "Camiseta Branca", quantidade: 10, valorUnitario: 50, conta: 1 },
      { nomeProduto: "Camiseta Branca", quantidade: 5, valorUnitario: 60, conta: 2 },
    ];

    const result = consolidateProducts(items);

    expect(result).toHaveLength(1);
    expect(result[0].nomeProduto).toBe("Camiseta Branca");
    expect(result[0].quantidade).toBe(15);
    expect(result[0].valorTotal).toBeCloseTo(800); // (10×50) + (5×60) = 500+300
    // Weighted avg: 800/15 ≈ 53.33
    expect(result[0].valorUnitario).toBeCloseTo(800 / 15);
    expect(result[0].contas).toEqual([1, 2]);
  });

  it("treats product names as case-insensitive and trims whitespace", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "produto a", quantidade: 3, valorUnitario: 10, conta: 1 },
      { nomeProduto: "Produto A", quantidade: 7, valorUnitario: 10, conta: 1 },
      { nomeProduto: "  Produto A  ", quantidade: 2, valorUnitario: 10, conta: 2 },
    ];

    const result = consolidateProducts(items);

    expect(result).toHaveLength(1);
    expect(result[0].quantidade).toBe(12);
  });

  it("preserves the first occurrence display name (trimmed)", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "  Calça Jeans  ", quantidade: 1, valorUnitario: 100, conta: 1 },
      { nomeProduto: "calça jeans", quantidade: 1, valorUnitario: 100, conta: 2 },
    ];

    const result = consolidateProducts(items);

    expect(result[0].nomeProduto).toBe("Calça Jeans");
  });

  it("keeps distinct products separate", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "Produto A", quantidade: 5, valorUnitario: 20, conta: 1 },
      { nomeProduto: "Produto B", quantidade: 3, valorUnitario: 30, conta: 1 },
    ];

    const result = consolidateProducts(items);

    expect(result).toHaveLength(2);
  });

  it("sets contas to a sorted deduplicated list", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "X", quantidade: 1, valorUnitario: 10, conta: 2 },
      { nomeProduto: "X", quantidade: 1, valorUnitario: 10, conta: 1 },
      { nomeProduto: "X", quantidade: 1, valorUnitario: 10, conta: 2 },
    ];

    const result = consolidateProducts(items);

    expect(result[0].contas).toEqual([1, 2]);
  });

  it("calculates valorTotal correctly as sum of all line totals", () => {
    const items: RawProductItem[] = [
      { nomeProduto: "P", quantidade: 4, valorUnitario: 25, conta: 1 },
      { nomeProduto: "P", quantidade: 6, valorUnitario: 15, conta: 2 },
    ];
    // Total = 4×25 + 6×15 = 100 + 90 = 190
    const result = consolidateProducts(items);

    expect(result[0].valorTotal).toBeCloseTo(190);
    expect(result[0].quantidade).toBe(10);
    expect(result[0].valorUnitario).toBeCloseTo(19); // 190/10
  });
});
