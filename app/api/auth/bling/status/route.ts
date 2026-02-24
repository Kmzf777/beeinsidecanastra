import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");

  if (account !== "1" && account !== "2") {
    return NextResponse.json(
      { error: "Invalid account parameter. Expected: account=1 or account=2" },
      { status: 400 }
    );
  }

  const accountNumber = parseInt(account, 10);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("bling_tokens")
    .select("updated_at")
    .eq("account_number", accountNumber)
    .single();

  if (error || !data) {
    return NextResponse.json({ connected: false, lastUpdated: null });
  }

  return NextResponse.json({
    connected: true,
    lastUpdated: data.updated_at,
  });
}
