import { BlingClient } from "@/lib/bling/bling-client";
import { getValidToken } from "@/lib/bling/token-manager";

jest.mock("@/lib/bling/token-manager", () => ({
  getValidToken: jest.fn(),
}));

const mockGetValidToken = getValidToken as jest.MockedFunction<typeof getValidToken>;

describe("BlingClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValidToken.mockResolvedValue("test-token");
  });

  it("makes a GET request with Authorization header and query params", async () => {
    const mockResponse = { data: [{ id: 1 }] };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as unknown as Response);

    const client = new BlingClient(1);
    const result = await client.get("/nfe", { pagina: 1, limite: 100 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = (global.fetch as jest.Mock).mock.calls[0];
    expect(calledUrl).toContain("pagina=1");
    expect(calledUrl).toContain("limite=100");
    expect((calledOptions as RequestInit).headers).toEqual({
      Authorization: "Bearer test-token",
    });
    expect(result).toEqual(mockResponse);
  });

  it("retries on 429 and succeeds on third attempt", async () => {
    jest.useFakeTimers();
    const mockResponse = { data: [] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 } as unknown as Response)
      .mockResolvedValueOnce({ ok: false, status: 429 } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

    const client = new BlingClient(1);
    const promise = client.get("/nfe");

    await jest.runAllTimersAsync();

    const result = await promise;
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual(mockResponse);

    jest.useRealTimers();
  });

  it("retries on 503 (5xx) error", async () => {
    jest.useFakeTimers();
    const mockResponse = { data: [] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

    const client = new BlingClient(1);
    const promise = client.get("/nfe");

    await jest.runAllTimersAsync();

    const result = await promise;
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockResponse);

    jest.useRealTimers();
  });

  it("throws after exhausting all retries on persistent 429", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    } as unknown as Response);

    const client = new BlingClient(1);

    // Attach rejection handler immediately to prevent unhandled rejection warning
    let caughtError: Error | undefined;
    const promise = client.get("/nfe").catch((e: Error) => {
      caughtError = e;
    });

    await jest.runAllTimersAsync();
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/Bling API error 429/);
    expect(global.fetch).toHaveBeenCalledTimes(4); // initial + 3 retries

    jest.useRealTimers();
  });

  it("does not retry on 404 (non-retryable 4xx)", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    } as unknown as Response);

    const client = new BlingClient(1);
    await expect(client.get("/nfe")).rejects.toThrow("Bling API error 404");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
