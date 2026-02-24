/** @jest-environment node */
import { GET } from "@/app/api/bling/contas-pagas/route";
import { NextRequest } from "next/server";
import { getConnectedAccounts } from "@/lib/bling/token-manager";
import { fetchAllAccountsPaidAccounts } from "@/lib/bling/contas-pagas";
import { PaidAccount } from "@/types/index";

jest.mock("@/lib/bling/token-manager", () => ({
  getConnectedAccounts: jest.fn(),
}));
jest.mock("@/lib/bling/contas-pagas", () => ({
  fetchAllAccountsPaidAccounts: jest.fn(),
}));

const mockGetConnectedAccounts = getConnectedAccounts as jest.MockedFunction<typeof getConnectedAccounts>;
const mockFetchAllAccounts = fetchAllAccountsPaidAccounts as jest.MockedFunction<typeof fetchAllAccountsPaidAccounts>;

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/bling/contas-pagas");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

const sampleAccounts: PaidAccount[] = [
  { id: "1-1", descricao: "Aluguel", valor: 2000, dataPagamento: "2026-02-05", contaOrigem: 1 },
  { id: "2-2", descricao: "Internet", valor: 150, dataPagamento: "2026-02-10", contaOrigem: 2 },
];

describe("GET /api/bling/contas-pagas", () => {
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

  it("returns 400 for non-numeric month", async () => {
    const req = makeRequest({ month: "abc", year: "2026" });
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

  it("returns accounts with metadata on success", async () => {
    mockGetConnectedAccounts.mockResolvedValueOnce([1, 2]);
    mockFetchAllAccounts.mockResolvedValueOnce(sampleAccounts);

    const req = makeRequest({ month: "2", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accounts).toEqual(sampleAccounts);
    expect(body.fetchedAt).toBeDefined();
  });

  it("calls fetchAllAccountsPaidAccounts with correct month/year", async () => {
    mockGetConnectedAccounts.mockResolvedValueOnce([1, 2]);
    mockFetchAllAccounts.mockResolvedValueOnce([]);

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
    expect(body.error).toBe("Não foi possível buscar as contas pagas. Tente novamente.");
  });

  it("returns empty accounts array when no paid accounts found", async () => {
    mockGetConnectedAccounts.mockResolvedValueOnce([1]);
    mockFetchAllAccounts.mockResolvedValueOnce([]);

    const req = makeRequest({ month: "2", year: "2026" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accounts).toEqual([]);
  });
});
