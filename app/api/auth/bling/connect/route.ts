import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const BLING_AUTHORIZE_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";

function getClientId(account: "1" | "2"): string | undefined {
  return account === "1"
    ? process.env.BLING_CLIENT_ID_1
    : process.env.BLING_CLIENT_ID_2;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");

  if (account !== "1" && account !== "2") {
    return NextResponse.json(
      { error: "Invalid account parameter. Expected: account=1 or account=2" },
      { status: 400 }
    );
  }

  const clientId = getClientId(account);
  const redirectUri = process.env.BLING_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Bling OAuth credentials not configured" },
      { status: 500 }
    );
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");

  // Store state + account number in short-lived cookies for CSRF validation in callback
  const cookieStore = await cookies();
  cookieStore.set("bling_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  cookieStore.set("bling_oauth_account", account, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  const authorizeUrl = `${BLING_AUTHORIZE_URL}?${params.toString()}`;

  return NextResponse.redirect(authorizeUrl);
}
