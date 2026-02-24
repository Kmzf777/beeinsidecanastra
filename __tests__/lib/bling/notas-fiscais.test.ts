import { fetchProductItemsForAccount } from "@/lib/bling/notas-fiscais";
import { BlingClient } from "@/lib/bling/bling-client";

jest.mock("@/lib/bling/bling-client");

const MockBlingClient = BlingClient as jest.MockedClass<typeof BlingClient>;

function makeNFe(items: Array<{ descricao: string; quantidade: number; valor: number }>) {
  return { id: 1, numero: "001", itens: items };
}

describe("fetchProductItemsForAccount", () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    MockBlingClient.prototype.get = mockGet;
  });

  it("fetches a single page when fewer than 100 items returned", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        makeNFe([{ descricao: "Produto A", quantidade: 5, valor: 10 }]),
        makeNFe([{ descricao: "Produto B", quantidade: 2, valor: 20 }]),
      ],
    });

    const client = new BlingClient(1);
    const result = await fetchProductItemsForAccount(client, 1, 2, 2026);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ nomeProduto: "Produto A", quantidade: 5, valorUnitario: 10, conta: 1 });
    expect(result[1]).toMatchObject({ nomeProduto: "Produto B", quantidade: 2, valorUnitario: 20, conta: 1 });
  });

  it("fetches multiple pages when first page is full (100 items)", async () => {
    // First page: 100 NFs each with 1 item
    const fullPage = Array.from({ length: 100 }, (_, i) =>
      makeNFe([{ descricao: `Produto ${i}`, quantidade: 1, valor: 5 }])
    );
    // Second page: 50 NFs
    const partialPage = Array.from({ length: 50 }, (_, i) =>
      makeNFe([{ descricao: `Produto B${i}`, quantidade: 1, valor: 5 }])
    );

    mockGet
      .mockResolvedValueOnce({ data: fullPage })
      .mockResolvedValueOnce({ data: partialPage });

    const client = new BlingClient(1);
    const result = await fetchProductItemsForAccount(client, 1, 2, 2026);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(1, "/nfe", expect.objectContaining({ pagina: 1 }));
    expect(mockGet).toHaveBeenNthCalledWith(2, "/nfe", expect.objectContaining({ pagina: 2 }));
    expect(result).toHaveLength(150);
  });

  it("stops pagination exactly when a page returns 100 items and next page is empty", async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) =>
      makeNFe([{ descricao: `Produto ${i}`, quantidade: 1, valor: 5 }])
    );

    mockGet
      .mockResolvedValueOnce({ data: fullPage })
      .mockResolvedValueOnce({ data: [] });

    const client = new BlingClient(1);
    const result = await fetchProductItemsForAccount(client, 1, 2, 2026);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(100);
  });

  it("constructs correct date range for February", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    const client = new BlingClient(1);
    await fetchProductItemsForAccount(client, 1, 2, 2024); // leap year

    expect(mockGet).toHaveBeenCalledWith("/nfe", expect.objectContaining({
      dataEmissaoInicio: "2024-02-01",
      dataEmissaoFim: "2024-02-29",
      tipo: 2,
      situacao: 6,
    }));
  });

  it("skips NF items with empty product name or zero quantity", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        makeNFe([
          { descricao: "", quantidade: 1, valor: 10 },
          { descricao: "Valid Product", quantidade: 0, valor: 5 },
          { descricao: "Good Product", quantidade: 3, valor: 15 },
        ]),
      ],
    });

    const client = new BlingClient(1);
    const result = await fetchProductItemsForAccount(client, 1, 1, 2026);

    expect(result).toHaveLength(1);
    expect(result[0].nomeProduto).toBe("Good Product");
  });
});
