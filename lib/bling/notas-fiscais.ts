import { BlingClient } from "@/lib/bling/bling-client";

const PAGE_SIZE = 100;

/** Item inside an NF-e (present in both list and detail responses) */
interface BlingNFeItem {
  codigo?: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

/** NF-e as returned by GET /nfe (list) — may or may not include itens */
interface BlingNFeListItem {
  id: number;
  numero?: string;
  itens?: BlingNFeItem[];
}

interface BlingNFeListResponse {
  data: BlingNFeListItem[];
}

/** NF-e as returned by GET /nfe/{id} (detail) — includes itens */
interface BlingNFeDetailResponse {
  data: {
    id: number;
    itens?: BlingNFeItem[];
  };
}

/** Intermediate type before cross-account consolidation */
export interface RawProductItem {
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  conta: 1 | 2;
}

function extractItems(
  itens: BlingNFeItem[] | undefined,
  accountNumber: 1 | 2
): RawProductItem[] {
  if (!itens) return [];
  const items: RawProductItem[] = [];
  for (const item of itens) {
    if (!item.descricao || item.quantidade <= 0) continue;
    items.push({
      nomeProduto: item.descricao,
      quantidade: item.quantidade,
      valorUnitario: item.valor,
      conta: accountNumber,
    });
  }
  return items;
}

/**
 * Fetches all NF-e de saída (tipo=1) for the given account and period.
 * Does NOT filter by situacao — includes all outgoing invoices regardless
 * of status (authorized, DANFE issued, etc.) to avoid missing data.
 *
 * If the list response includes itens, uses them directly.
 * Otherwise, fetches each NF-e detail individually to get items.
 */
export async function fetchProductItemsForAccount(
  client: BlingClient,
  accountNumber: 1 | 2,
  month: number,
  year: number
): Promise<RawProductItem[]> {
  const inicio = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const fim = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Step 1: Fetch the paginated NF-e list
  const allNfes: BlingNFeListItem[] = [];
  let page = 1;

  while (true) {
    const response = await client.get<BlingNFeListResponse>("/nfe", {
      dataEmissaoInicial: inicio,
      dataEmissaoFinal: fim,
      tipo: 1,
      pagina: page,
      limite: PAGE_SIZE,
    });

    const nfes = response.data ?? [];
    allNfes.push(...nfes);

    if (nfes.length < PAGE_SIZE) break;
    page++;
  }

  if (allNfes.length === 0) {
    console.log(`[notas-fiscais] No NF-e found for account ${accountNumber}, ${month}/${year}`);
    return [];
  }

  console.log(`[notas-fiscais] Found ${allNfes.length} NF-e(s) for account ${accountNumber}`);

  // Step 2: Check if the list response already includes itens
  const firstWithItems = allNfes.find((nfe) => nfe.itens && nfe.itens.length > 0);

  if (firstWithItems) {
    // List response includes items — extract directly
    console.log(`[notas-fiscais] List response includes items, extracting directly`);
    return allNfes.flatMap((nfe) => extractItems(nfe.itens, accountNumber));
  }

  // Step 3: List doesn't include items — fetch each NF-e detail
  console.log(`[notas-fiscais] List has no items, fetching ${allNfes.length} detail(s)...`);
  const BATCH_SIZE = 5;
  const items: RawProductItem[] = [];

  for (let i = 0; i < allNfes.length; i += BATCH_SIZE) {
    const batch = allNfes.slice(i, i + BATCH_SIZE);
    const details = await Promise.all(
      batch.map((nfe) =>
        client.get<BlingNFeDetailResponse>(`/nfe/${nfe.id}`)
      )
    );

    for (const detail of details) {
      items.push(...extractItems(detail.data?.itens, accountNumber));
    }
  }

  if (items.length === 0) {
    console.log(`[notas-fiscais] Warning: ${allNfes.length} NF-e(s) found but 0 items extracted. First NF-e detail sample:`, JSON.stringify(allNfes[0]).slice(0, 500));
  }

  return items;
}

/**
 * Fetches NF-e product items from all connected accounts in parallel.
 */
export async function fetchAllAccountsProductItems(
  accountNumbers: (1 | 2)[],
  month: number,
  year: number
): Promise<RawProductItem[]> {
  const results = await Promise.all(
    accountNumbers.map((accountNumber) => {
      const client = new BlingClient(accountNumber);
      return fetchProductItemsForAccount(client, accountNumber, month, year);
    })
  );

  return results.flat();
}
