import { getValidToken } from "@/lib/bling/token-manager";

const BLING_API_BASE = "https://api.bling.com.br/Api/v3";

// Delays in ms for each retry attempt: 2s, 5s, 10s, 20s
const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000];

// Minimum delay between any two API requests (ms) — global across all clients
const MIN_REQUEST_INTERVAL_MS = 350;

// Global request queue to prevent concurrent floods
let lastRequestTime = 0;
const requestQueue: Array<() => void> = [];
let processing = false;

function scheduleRequest(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestQueue.push(resolve);
    if (!processing) drainQueue();
  });
}

async function drainQueue() {
  processing = true;
  while (requestQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    lastRequestTime = Date.now();
    const next = requestQueue.shift();
    next?.();
  }
  processing = false;
}

export class BlingClient {
  constructor(private readonly accountNumber: 1 | 2) {}

  /**
   * Performs a GET request to the Bling API.
   * Uses a global rate limiter to avoid 429 errors.
   * Retries up to 4 times with exponential backoff on 429 and 5xx errors.
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

    let lastError: Error | null = null;
    const maxAttempts = RETRY_DELAYS_MS.length + 1; // 5 total: initial + 4 retries

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS_MS[attempt - 1];
        console.log(`[BlingClient] Retry ${attempt}/${RETRY_DELAYS_MS.length} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Wait for our turn in the global queue
      await scheduleRequest();

      console.log(`[BlingClient] GET ${url.toString()}`);

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
