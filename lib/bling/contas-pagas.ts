import { BlingClient } from "@/lib/bling/bling-client";
import { PaidAccount } from "@/types/index";

const PAGE_SIZE = 100;

/** Summary returned by GET /contas/pagar (list) */
interface BlingContaListItem {
  id: number;
  situacao: number;
  vencimento: string;
  valor: number;
}

interface BlingContaListResponse {
  data: BlingContaListItem[];
}

/** Detail returned by GET /contas/pagar/{id} */
interface BlingContaDetailResponse {
  data: {
    id: number;
    situacao: number;
    vencimento: string;
    valor: number;
    historico?: string;
    numeroDocumento?: string;
    dataEmissao?: string;
    contato?: { id: number; nome?: string };
  };
}

/**
 * Fetches paid accounts (contas a pagar) for the given account and period.
 * Step 1: Lists all items for the date range.
 * Step 2: Filters for paid (situacao=2).
 * Step 3: Fetches detail for each to get historico (description).
 */
export async function fetchPaidAccountsForAccount(
  client: BlingClient,
  accountNumber: 1 | 2,
  month: number,
  year: number
): Promise<PaidAccount[]> {
  const inicio = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const fim = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Step 1: Fetch all items from the paginated list endpoint
  const allItems: BlingContaListItem[] = [];
  let page = 1;

  while (true) {
    const response = await client.get<BlingContaListResponse>(
      "/contas/pagar",
      {
        dataEmissaoInicial: inicio,
        dataEmissaoFinal: fim,
        pagina: page,
        limite: PAGE_SIZE,
      }
    );

    const items = response.data ?? [];
    allItems.push(...items);

    if (items.length < PAGE_SIZE) break;
    page++;
  }

  // Step 2: Filter for paid items (situacao=2) with positive value
  const paidItems = allItems.filter(
    (item) => item.situacao === 2 && item.valor > 0
  );

  console.log(
    `[contas-pagas] Account ${accountNumber}: ${allItems.length} total, ${paidItems.length} paid for ${month}/${year}`
  );

  if (paidItems.length === 0) return [];

  // Step 3: Fetch detail for each paid item to get historico (description)
  // (rate limiter in BlingClient controls pacing to avoid 429)
  const BATCH_SIZE = 2;
  const accounts: PaidAccount[] = [];

  for (let i = 0; i < paidItems.length; i += BATCH_SIZE) {
    const batch = paidItems.slice(i, i + BATCH_SIZE);
    const details = await Promise.all(
      batch.map((item) =>
        client
          .get<BlingContaDetailResponse>(`/contas/pagar/${item.id}`)
          .catch(() => null)
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const listItem = batch[j];
      const detail = details[j]?.data;
      const descricao =
        detail?.historico ||
        detail?.numeroDocumento ||
        `Conta #${listItem.id}`;

      const fornecedor = detail?.contato?.nome || '';

      accounts.push({
        id: `${listItem.id}-${accountNumber}`,
        descricao,
        valor: listItem.valor,
        dataPagamento: listItem.vencimento,
        contaOrigem: accountNumber,
        fornecedor,
      });
    }
  }

  return accounts;
}

/**
 * Fetches paid accounts from all connected accounts sequentially
 * to avoid overwhelming the Bling API rate limits.
 * Returns a single consolidated list sorted by dataPagamento desc.
 */
export async function fetchAllAccountsPaidAccounts(
  accountNumbers: (1 | 2)[],
  month: number,
  year: number
): Promise<PaidAccount[]> {
  const allAccounts: PaidAccount[] = [];

  for (const accountNumber of accountNumbers) {
    const client = new BlingClient(accountNumber);
    const accounts = await fetchPaidAccountsForAccount(client, accountNumber, month, year);
    allAccounts.push(...accounts);
  }

  allAccounts.sort((a, b) => b.dataPagamento.localeCompare(a.dataPagamento));
  return allAccounts;
}
