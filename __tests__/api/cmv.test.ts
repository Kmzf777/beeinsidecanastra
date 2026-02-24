/** @jest-environment node */
import { GET, POST } from "@/app/api/cmv/route";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(),
}));

const mockCreateServiceClient = createServiceClient as jest.MockedFunction<typeof createServiceClient>;

function buildSupabaseMock(selectResult: unknown, upsertResult: unknown) {
  const mockIn = jest.fn().mockResolvedValue(selectResult);
  const mockSelect = jest.fn(() => ({ in: mockIn }));
  const mockUpsert = jest.fn().mockResolvedValue(upsertResult);
  const mockFrom = jest.fn(() => ({ select: mockSelect, upsert: mockUpsert }));
  return { from: mockFrom, mockIn, mockSelect, mockUpsert };
}

function makeGetRequest(params: Record<string, string | string[]>): NextRequest {
  const url = new URL("http://localhost/api/cmv");
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url.toString());
}

async function makePostRequest(body: unknown): Promise<NextRequest> {
  return new NextRequest("http://localhost/api/cmv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/cmv", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty cmvs when no products[] param is given", async () => {
    const req = makeGetRequest({});
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cmvs).toEqual({});
  });

  it("returns saved CMVs keyed by product name", async () => {
    const mock = buildSupabaseMock(
      {
        data: [
          { product_name: "Camiseta", cmv_unitario: 12.5 },
          { product_name: "Calça", cmv_unitario: 30 },
        ],
        error: null,
      },
      null
    );
    mockCreateServiceClient.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = makeGetRequest({ "products[]": ["Camiseta", "Calça"] });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cmvs).toEqual({ Camiseta: 12.5, Calça: 30 });
  });

  it("returns empty cmvs when Supabase returns an error (graceful degradation)", async () => {
    const mock = buildSupabaseMock({ data: null, error: { message: "DB error" } }, null);
    mockCreateServiceClient.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = makeGetRequest({ "products[]": "Camiseta" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cmvs).toEqual({});
  });
});

describe("POST /api/cmv", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when body is missing cmvs", async () => {
    const req = await makePostRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when cmvs is empty array", async () => {
    const req = await makePostRequest({ cmvs: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when a CMV item has non-positive cmvUnitario", async () => {
    const req = await makePostRequest({
      cmvs: [{ productName: "Camiseta", cmvUnitario: 0 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("upserts CMVs and returns 200 on success", async () => {
    const mock = buildSupabaseMock(null, { error: null });
    mockCreateServiceClient.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostRequest({
      cmvs: [
        { productName: "Camiseta", cmvUnitario: 15 },
        { productName: "Calça", cmvUnitario: 30 },
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(mock.from).toHaveBeenCalledWith("product_cmv");
    expect(mock.mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ product_name: "Camiseta", cmv_unitario: 15 }),
        expect.objectContaining({ product_name: "Calça", cmv_unitario: 30 }),
      ]),
      { onConflict: "product_name" }
    );
  });

  it("returns 500 when Supabase upsert fails", async () => {
    const mock = buildSupabaseMock(null, { error: { message: "upsert failed" } });
    mockCreateServiceClient.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostRequest({
      cmvs: [{ productName: "Camiseta", cmvUnitario: 15 }],
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/cmv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
