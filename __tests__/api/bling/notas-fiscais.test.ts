/** @jest-environment node */
import { GET } from "@/app/api/bling/notas-fiscais/route";
import { NextRequest } from "next/server";
import { getConnectedAccounts } from "@/lib/bling/token-manager";
import { fetchAllAccountsProductItems } from "@/lib/bling/notas-fiscais";
import { consolidateProducts } from "@/lib/calculations/consolidate-products";

jest.mock("@/lib/bling/token-manager", () => ({
  getConnectedAccounts: jest.fn(),
}));
jest.mock("@/lib/bling/notas-fiscais", () => ({
  fetchAllAccountsProductItems: jest.fn(),
}));
jest.mock("@/lib/calculations/consolidate-products", () => ({
  consolidateProducts: jest.fn(),
}));

const mockGetConnectedAccounts = getConnectedAccounts as jest.MockedFunction<typeof getConnectedAccounts>;
const mockFetchAllAccounts = fetchAllAccountsProductItems as jest.MockedFunction<typeof fetchAllAccountsProductItems>;
const mockConsolidate = consolidateProducts as jest.MockedFunction<typeof consolidateProducts>;

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/bling/notas-fiscais");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

describe("GET /api/bling/notas-fiscais", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when month is missing", async () => {
    const req = makeRequest({ year: "2026" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when year is missing", async () => {
    const req = makeRequest({ month: "2" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid month (0)", async () => {
    const req = makeRequest({ month: "0", year: "2026" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid month (13)", async () => {
    const req = makeRequest({ month: "13", year: "2026" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when no accounts are connected", async () => {
    mockGetConnectedAccounts.mockResolvedValueOnce([]);
    const req = makeRequest({ month: "2", year: "2026" });
    const res = await GET(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("Nenhuma conta Bling");
  });

  it("returns consolidated products with metadata on success", async () => {
    const rawItems = [
      { nomeProduto: "Camiseta", quantidade: 5, valorUnitario: 50, conta: 1 as const },
    ];
    const consolidated = [
      { nomeProduto: "Camiseta", quantidade: 5, valorUnitario: 50, valorTotal: 250, contas: [1 as const] },
    ];

    mockGetConnectedAccounts.mockResolvedValueOnce([1]);
    mockFetchAllAccounts.mockResolvedValueOnce(rawItems);
    mockConsolidate.mockReturnValueOnce(consolidated);

    const req = makeRequest({ month: "2", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toEqual(consolidated);
    expect(body.accountsQueried).toEqual([1]);
    expect(body.fetchedAt).toBeDefined();
  });

  it("calls fetchAllAccountsProductItems with correct month/year", async () => {
    mockGetConnectedAccounts.mockResolvedValueOnce([1, 2]);
    mockFetchAllAccounts.mockResolvedValueOnce([]);
    mockConsolidate.mockReturnValueOnce([]);

    const req = makeRequest({ month: "3", year: "2025" });
    await GET(req);

    expect(mockFetchAllAccounts).toHaveBeenCalledWith([1, 2], 3, 2025);
  });

  it("returns 500 with friendly message on unexpected error", async () => {
    mockGetConnectedAccounts.mockRejectedValueOnce(new Error("DB down"));

    const req = makeRequest({ month: "2", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Não foi possível buscar as notas fiscais. Tente novamente.");
  });
});
