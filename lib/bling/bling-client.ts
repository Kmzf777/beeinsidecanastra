import { getValidToken } from "@/lib/bling/token-manager";

const BLING_API_BASE = "https://api.bling.com.br/Api/v3";

// Delays in ms for each retry attempt: 1s, 2s, 4s
const RETRY_DELAYS_MS = [1000, 2000, 4000];

export class BlingClient {
  constructor(private readonly accountNumber: 1 | 2) {}

  /**
   * Performs a GET request to the Bling API.
   * Retries up to 3 times (with 1s/2s/4s backoff) on 429 and 5xx errors.
   */
  async get<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const token = await getValidToken(this.accountNumber);

    const url = new URL(`${BLING_API_BASE}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    console.log(`[BlingClient] GET ${url.toString()}`);

    let lastError: Error | null = null;
    const maxAttempts = RETRY_DELAYS_MS.length + 1; // 4 total: initial + 3 retries

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1])
        );
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          `Bling API error ${response.status} (attempt ${attempt + 1}/${maxAttempts})`
        );
        continue;
      }

      // Non-retryable 4xx error
      const body = await response.text();
      throw new Error(`Bling API error ${response.status}: ${body}`);
    }

    throw lastError ?? new Error("Bling API request failed after retries");
  }
}
