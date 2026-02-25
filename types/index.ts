// Global TypeScript interfaces for Beeinside

// ─── Bling API ────────────────────────────────────────────────────────────────

export interface BlingAccount {
  id: 1 | 2;
  clientId: string;
  clientSecret: string;
}

export interface BlingToken {
  accountId: 1 | 2;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// ─── Financial ────────────────────────────────────────────────────────────────

export interface PeriodFilter {
  month: number; // 1-12
  year: number;
}

/** Alias for PeriodFilter — used by Story 2.1 components */
export type Period = PeriodFilter;

export interface NfeItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Nfe {
  id: string;
  number: string;
  issueDate: string;
  items: NfeItem[];
  accountId: 1 | 2;
}

/** Consolidated product from NF-e sales, possibly aggregated across multiple accounts */
export interface ProductSale {
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number; // valorUnitarioMedio when consolidated across accounts
  valorTotal: number; // quantidade × valorUnitario
  contas: (1 | 2)[]; // accounts that contributed this product
}

export interface PaidBill {
  id: string;
  description: string;
  category: string;
  amount: number;
  paymentDate: string;
  accountId: 1 | 2;
}

export interface PaidAccount {
  id: string; // `${blingId}-${contaOrigem}` for uniqueness across accounts
  descricao: string;
  valor: number;
  dataPagamento: string; // "YYYY-MM-DD"
  contaOrigem: 1 | 2;
  fornecedor: string;
  categoria?: "Despesa" | "Custo de Produto" | "Ignorar"; // populated in Story 3.2
}

// ─── Margin Calculation ───────────────────────────────────────────────────────

export interface ProductCmv {
  productCode: string;
  productName: string;
  totalCost: number;
  quantitySold: number;
  unitCost: number;
}

export interface CategorizedExpense {
  category: string;
  total: number;
  items: PaidBill[];
}

export interface MarginResult {
  period: PeriodFilter;
  grossRevenue: number;
  cmv: number;
  grossProfit: number;
  expenses: CategorizedExpense[];
  taxAliquota: number;
  taxAmount: number;
  contributionMargin: number;
  contributionMarginPercent: number;
}
