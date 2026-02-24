import { fetchPaidAccountsForAccount, fetchAllAccountsPaidAccounts } from "@/lib/bling/contas-pagas";
import { BlingClient } from "@/lib/bling/bling-client";

jest.mock("@/lib/bling/bling-client");

const MockBlingClient = BlingClient as jest.MockedClass<typeof BlingClient>;

function makeContasPagarResponse(items: Array<{ id: number; descricao: string; valor: number; dataPagamento: string }>) {
  return {
    data: items.map((item) => ({ ...item, situacao: 2 })),
  };
}

describe("fetchPaidAccountsForAccount", () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    MockBlingClient.prototype.get = mockGet;
  });

  it("fetches a single page when fewer than 100 items returned", async () => {
    mockGet.mockResolvedValueOnce(
      makeContasPagarResponse([
        { id: 1, descricao: "Aluguel", valor: 2000, dataPagamento: "2026-02-05" },
        { id: 2, descricao: "Internet", valor: 150, dataPagamento: "2026-02-10" },
      ])
    );

    const client = new BlingClient(1);
    const result = await fetchPaidAccountsForAccount(client, 1, 2, 2026);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "1-1",
      descricao: "Aluguel",
      valor: 2000,
      dataPagamento: "2026-02-05",
      contaOrigem: 1,
    });
  });

  it("fetches multiple pages when first page is full (100 items)", async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      descricao: `Despesa ${i}`,
      valor: 100,
      dataPagamento: "2026-02-15",
    }));
    const partialPage = Array.from({ length: 30 }, (_, i) => ({
      id: i + 101,
      descricao: `Despesa B${i}`,
      valor: 50,
      dataPagamento: "2026-02-20",
    }));

    mockGet
      .mockResolvedValueOnce(makeContasPagarResponse(fullPage))
      .mockResolvedValueOnce(makeContasPagarResponse(partialPage));

    const client = new BlingClient(1);
    const result = await fetchPaidAccountsForAccount(client, 1, 2, 2026);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(1, "/contaspagar", expect.objectContaining({ pagina: 1 }));
    expect(mockGet).toHaveBeenNthCalledWith(2, "/contaspagar", expect.objectContaining({ pagina: 2 }));
    expect(result).toHaveLength(130);
  });

  it("constructs correct date range and parameters for February", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const client = new BlingClient(1);
    await fetchPaidAccountsForAccount(client, 1, 2, 2024); // leap year

    expect(mockGet).toHaveBeenCalledWith("/contaspagar", expect.objectContaining({
      situacao: 2,
      dataPagamentoInicio: "2024-02-01",
      dataPagamentoFim: "2024-02-29",
    }));
  });

  it("constructs correct date range for January", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const client = new BlingClient(2);
    await fetchPaidAccountsForAccount(client, 2, 1, 2026);

    expect(mockGet).toHaveBeenCalledWith("/contaspagar", expect.objectContaining({
      dataPagamentoInicio: "2026-01-01",
      dataPagamentoFim: "2026-01-31",
    }));
  });

  it("assigns contaOrigem correctly for account 2", async () => {
    mockGet.mockResolvedValueOnce(
      makeContasPagarResponse([
        { id: 5, descricao: "Fornecedor X", valor: 500, dataPagamento: "2026-02-18" },
      ])
    );

    const client = new BlingClient(2);
    const result = await fetchPaidAccountsForAccount(client, 2, 2, 2026);

    expect(result[0].contaOrigem).toBe(2);
    expect(result[0].id).toBe("5-2");
  });

  it("skips items with empty description or zero/negative valor", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: 1, descricao: "", valor: 100, dataPagamento: "2026-02-01", situacao: 2 },
        { id: 2, descricao: "Valid", valor: 0, dataPagamento: "2026-02-01", situacao: 2 },
        { id: 3, descricao: "Good Item", valor: 200, dataPagamento: "2026-02-01", situacao: 2 },
      ],
    });

    const client = new BlingClient(1);
    const result = await fetchPaidAccountsForAccount(client, 1, 2, 2026);

    expect(result).toHaveLength(1);
    expect(result[0].descricao).toBe("Good Item");
  });
});

describe("fetchAllAccountsPaidAccounts", () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    MockBlingClient.prototype.get = mockGet;
  });

  it("consolidates items from two accounts into a single list", async () => {
    mockGet
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 10, descricao: "Conta 1 Item A", valor: 100, dataPagamento: "2026-02-10" },
        ])
      )
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 20, descricao: "Conta 2 Item A", valor: 200, dataPagamento: "2026-02-15" },
        ])
      );

    const result = await fetchAllAccountsPaidAccounts([1, 2], 2, 2026);

    expect(result).toHaveLength(2);
    const origems = result.map((r) => r.contaOrigem);
    expect(origems).toContain(1);
    expect(origems).toContain(2);
  });

  it("sorts consolidated list by dataPagamento descending", async () => {
    mockGet
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 1, descricao: "Older", valor: 100, dataPagamento: "2026-02-05" },
          { id: 2, descricao: "Newest", valor: 200, dataPagamento: "2026-02-20" },
        ])
      )
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 3, descricao: "Middle", valor: 150, dataPagamento: "2026-02-12" },
        ])
      );

    const result = await fetchAllAccountsPaidAccounts([1, 2], 2, 2026);

    expect(result[0].dataPagamento).toBe("2026-02-20");
    expect(result[1].dataPagamento).toBe("2026-02-12");
    expect(result[2].dataPagamento).toBe("2026-02-05");
  });

  it("each item retains its correct contaOrigem after consolidation", async () => {
    mockGet
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 1, descricao: "Item A", valor: 100, dataPagamento: "2026-02-10" },
        ])
      )
      .mockResolvedValueOnce(
        makeContasPagarResponse([
          { id: 1, descricao: "Item A", valor: 100, dataPagamento: "2026-02-10" },
        ])
      );

    const result = await fetchAllAccountsPaidAccounts([1, 2], 2, 2026);

    // Same Bling ID from different accounts should produce distinct ids
    expect(result.find((r) => r.contaOrigem === 1)?.id).toBe("1-1");
    expect(result.find((r) => r.contaOrigem === 2)?.id).toBe("1-2");
  });

  it("returns empty list when both accounts return no items", async () => {
    mockGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    const result = await fetchAllAccountsPaidAccounts([1, 2], 2, 2026);
    expect(result).toHaveLength(0);
  });
});
