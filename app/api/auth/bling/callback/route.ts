import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const SETTINGS_URL = "/settings";

function getCredentials(account: "1" | "2") {
  if (account === "1") {
    return {
      clientId: process.env.BLING_CLIENT_ID_1,
      clientSecret: process.env.BLING_CLIENT_SECRET_1,
    };
  }
  return {
    clientId: process.env.BLING_CLIENT_ID_2,
    clientSecret: process.env.BLING_CLIENT_SECRET_2,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user-denied authorization
  if (error === "access_denied") {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=access_denied&message=Autorização+negada+pelo+usuário`,
        request.url
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=invalid_callback&message=Parâmetros+inválidos+no+callback`,
        request.url
      )
    );
  }

  // Validate CSRF state and retrieve account number
  const cookieStore = await cookies();
  const savedState = cookieStore.get("bling_oauth_state")?.value;
  const account = cookieStore.get("bling_oauth_account")?.value as
    | "1"
    | "2"
    | undefined;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=state_mismatch&message=Falha+na+validação+CSRF`,
        request.url
      )
    );
  }

  if (account !== "1" && account !== "2") {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=invalid_account&message=Conta+não+identificada+no+callback`,
        request.url
      )
    );
  }

  // Clear the state cookies
  cookieStore.delete("bling_oauth_state");
  cookieStore.delete("bling_oauth_account");

  const { clientId, clientSecret } = getCredentials(account);
  const redirectUri = process.env.BLING_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=config_error&message=Credenciais+Bling+não+configuradas+para+conta+${account}`,
        request.url
      )
    );
  }

  // Exchange code for tokens (server-side only)
  let tokenData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  try {
    const response = await fetch(BLING_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `Bling token exchange failed for account ${account} (${response.status}):`,
        body
      );
      return NextResponse.redirect(
        new URL(
          `${SETTINGS_URL}?error=token_exchange_failed&message=Falha+na+troca+de+token+conta+${account}`,
          request.url
        )
      );
    }

    tokenData = await response.json();
  } catch (err) {
    console.error(`Bling token exchange error (account ${account}):`, err);
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=token_exchange_failed&message=Erro+ao+trocar+código+por+token`,
        request.url
      )
    );
  }

  // Store tokens securely via service role (bypasses RLS — never exposed to client)
  const supabase = createServiceClient();
  const expiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();

  const accountNumber = parseInt(account, 10);

  const { error: dbError } = await supabase.from("bling_tokens").upsert(
    {
      account_number: accountNumber,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_number" }
  );

  if (dbError) {
    console.error(
      `Failed to save Bling tokens for account ${account}:`,
      dbError
    );
    return NextResponse.redirect(
      new URL(
        `${SETTINGS_URL}?error=storage_failed&message=Falha+ao+salvar+tokens+conta+${account}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(`${SETTINGS_URL}?connected=${account}`, request.url)
  );
}
