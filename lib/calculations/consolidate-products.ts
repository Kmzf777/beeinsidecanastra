import type { ProductSale } from "@/types";
import type { RawProductItem } from "@/lib/bling/notas-fiscais";

type ProductAccumulator = {
  displayName: string;
  quantidade: number;
  valorTotal: number;
  contas: Set<1 | 2>;
};

/**
 * Consolidates raw product items across accounts into a deduplicated list.
 * Products are grouped by nomeProduto (case-insensitive, trimmed).
 * Quantities are summed; valorUnitario becomes the weighted average.
 */
export function consolidateProducts(items: RawProductItem[]): ProductSale[] {
  const map = new Map<string, ProductAccumulator>();

  for (const item of items) {
    const key = item.nomeProduto.trim().toLowerCase();
    const itemTotal = item.quantidade * item.valorUnitario;
    const existing = map.get(key);

    if (existing) {
      existing.quantidade += item.quantidade;
      existing.valorTotal += itemTotal;
      existing.contas.add(item.conta);
    } else {
      map.set(key, {
        displayName: item.nomeProduto.trim(),
        quantidade: item.quantidade,
        valorTotal: itemTotal,
        contas: new Set([item.conta]),
      });
    }
  }

  return Array.from(map.values()).map((group) => ({
    nomeProduto: group.displayName,
    quantidade: group.quantidade,
    valorUnitario:
      group.quantidade > 0 ? group.valorTotal / group.quantidade : 0,
    valorTotal: group.valorTotal,
    contas: (Array.from(group.contas).sort() as (1 | 2)[]),
  }));
}
