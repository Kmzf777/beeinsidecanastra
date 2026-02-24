import { createServiceClient } from "@/lib/supabase/service";

const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";

type TokenRow = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  updated_at: string;
};

function getCredentials(accountNumber: 1 | 2) {
  if (accountNumber === 1) {
    return {
      clientId: process.env.BLING_CLIENT_ID_1!,
      clientSecret: process.env.BLING_CLIENT_SECRET_1!,
    };
  }
  return {
    clientId: process.env.BLING_CLIENT_ID_2!,
    clientSecret: process.env.BLING_CLIENT_SECRET_2!,
  };
}

async function refreshToken(
  accountNumber: 1 | 2,
  currentRefreshToken: string
): Promise<TokenRow> {
  const { clientId, clientSecret } = getCredentials(accountNumber);

  const response = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: currentRefreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const updatedAt = new Date().toISOString();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("bling_tokens")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      updated_at: updatedAt,
    })
    .eq("account_number", accountNumber);

  if (error) {
    throw new Error(`Failed to update tokens in Supabase: ${error.message}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    updated_at: updatedAt,
  };
}

/**
 * Returns all account numbers that have tokens stored in Supabase.
 */
export async function getConnectedAccounts(): Promise<(1 | 2)[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("bling_tokens")
    .select("account_number");

  if (!data || data.length === 0) return [];

  return data
    .map((row) => row.account_number as 1 | 2)
    .filter((n): n is 1 | 2 => n === 1 || n === 2)
    .sort() as (1 | 2)[];
}

/**
 * Returns a valid access token for the given account.
 * Automatically refreshes if the token is expired or about to expire (within 60s).
 */
export async function getValidToken(accountNumber: 1 | 2): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("bling_tokens")
    .select("access_token, refresh_token, expires_at, updated_at")
    .eq("account_number", accountNumber)
    .single();

  if (error || !data) {
    throw new Error(
      `No token found for account ${accountNumber}. Please connect the account first.`
    );
  }

  const expiresAt = new Date(data.expires_at).getTime();
  const bufferMs = 60 * 1000; // refresh 60s before expiry

  if (Date.now() + bufferMs < expiresAt) {
    return data.access_token;
  }

  const refreshed = await refreshToken(accountNumber, data.refresh_token);
  return refreshed.access_token;
}
