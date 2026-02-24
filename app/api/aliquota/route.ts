import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/aliquota?month=M&year=Y
 * Returns the aliquota for the given month/year, if it exists.
 * Response: { aliquota: number | null }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get("month") ?? "", 10);
  const year = parseInt(url.searchParams.get("year") ?? "", 10);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return NextResponse.json({ error: "Parâmetros month e year são obrigatórios." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("monthly_config")
    .select("aliquota")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ aliquota: null });
  }

  return NextResponse.json({ aliquota: data ? Number(data.aliquota) : null });
}

/**
 * POST /api/aliquota
 * Body: { month: number; year: number; aliquota: number }
 * Upserts the aliquota for the given month/year.
 * Response: { ok: true }
 */
export async function POST(request: NextRequest) {
  let body: { month?: unknown; year?: unknown; aliquota?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { month, year, aliquota } = body;

  if (
    typeof month !== "number" ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return NextResponse.json({ error: "month deve ser um inteiro entre 1 e 12." }, { status: 400 });
  }

  if (typeof year !== "number" || !Number.isInteger(year)) {
    return NextResponse.json({ error: "year deve ser um inteiro válido." }, { status: 400 });
  }

  if (typeof aliquota !== "number" || aliquota < 0 || aliquota > 100) {
    return NextResponse.json(
      { error: "aliquota deve ser um número entre 0 e 100." },
      { status: 400 }
    );
  }

  const rounded = Math.round(aliquota * 100) / 100;

  const supabase = createServiceClient();
  const { error } = await supabase.from("monthly_config").upsert(
    { month, year, aliquota: rounded, updated_at: new Date().toISOString() },
    { onConflict: "month,year" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível salvar a alíquota. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
