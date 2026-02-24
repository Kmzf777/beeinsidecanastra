/** @jest-environment node */
import { GET, POST } from "@/app/api/aliquota/route";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(),
}));

const mockCreate = createServiceClient as jest.MockedFunction<typeof createServiceClient>;

// ─── Mock builder ────────────────────────────────────────────────────────────

function buildMock(maybeResult: unknown, upsertResult: unknown) {
  const mockMaybeSingle = jest.fn().mockResolvedValue(maybeResult);
  const mockEqYear = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockEqMonth = jest.fn(() => ({ eq: mockEqYear }));
  const mockSelect = jest.fn(() => ({ eq: mockEqMonth }));
  const mockUpsert = jest.fn().mockResolvedValue(upsertResult);
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
  }));
  return { from: mockFrom, mockUpsert, mockMaybeSingle };
}

function makeGetReq(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/aliquota");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

async function makePostReq(body: unknown): Promise<NextRequest> {
  return new NextRequest("http://localhost/api/aliquota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── GET ─────────────────────────────────────────────────────────────────────

describe("GET /api/aliquota", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when month is missing", async () => {
    const res = await GET(makeGetReq({ year: "2026" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when year is missing", async () => {
    const res = await GET(makeGetReq({ month: "3" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when month is out of range", async () => {
    const res = await GET(makeGetReq({ month: "13", year: "2026" }));
    expect(res.status).toBe(400);
  });

  it("returns aliquota: null when no row exists", async () => {
    const mock = buildMock({ data: null, error: null }, null);
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const res = await GET(makeGetReq({ month: "1", year: "2026" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.aliquota).toBeNull();
  });

  it("returns aliquota as number when row exists", async () => {
    const mock = buildMock({ data: { aliquota: "6.50" }, error: null }, null);
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const res = await GET(makeGetReq({ month: "2", year: "2026" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.aliquota).toBe(6.5);
  });

  it("returns aliquota: null on Supabase error (graceful degradation)", async () => {
    const mock = buildMock({ data: null, error: { message: "DB error" } }, null);
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const res = await GET(makeGetReq({ month: "1", year: "2026" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.aliquota).toBeNull();
  });
});

// ─── POST ────────────────────────────────────────────────────────────────────

describe("POST /api/aliquota", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/aliquota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when month is missing", async () => {
    const req = await makePostReq({ year: 2026, aliquota: 6 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when aliquota is -1", async () => {
    const req = await makePostReq({ month: 1, year: 2026, aliquota: -1 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when aliquota is 101", async () => {
    const req = await makePostReq({ month: 1, year: 2026, aliquota: 101 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when aliquota is a string", async () => {
    const req = await makePostReq({ month: 1, year: 2026, aliquota: "6" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and upserts valid aliquota", async () => {
    const mock = buildMock(null, { error: null });
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostReq({ month: 3, year: 2026, aliquota: 6.5 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mock.mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ month: 3, year: 2026, aliquota: 6.5 }),
      { onConflict: "month,year" }
    );
  });

  it("returns 200 for boundary value 0", async () => {
    const mock = buildMock(null, { error: null });
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostReq({ month: 1, year: 2026, aliquota: 0 });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 for boundary value 100", async () => {
    const mock = buildMock(null, { error: null });
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostReq({ month: 12, year: 2026, aliquota: 100 });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 500 when Supabase upsert fails", async () => {
    const mock = buildMock(null, { error: { message: "upsert failed" } });
    mockCreate.mockReturnValue(mock as unknown as ReturnType<typeof createServiceClient>);

    const req = await makePostReq({ month: 1, year: 2026, aliquota: 6 });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
