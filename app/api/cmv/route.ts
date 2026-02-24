import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/cmv?products[]=nome1&products[]=nome2
 * Returns previously saved CMV for each requested product name.
 * Response: { cmvs: Record<string, number> }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const productNames = url.searchParams.getAll("products[]");

  if (productNames.length === 0) {
    return NextResponse.json({ cmvs: {} });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_cmv")
    .select("product_name, cmv_unitario")
    .in("product_name", productNames);

  if (error) {
    return NextResponse.json({ cmvs: {} });
  }

  const cmvs: Record<string, number> = {};
  for (const row of data ?? []) {
    cmvs[row.product_name] = Number(row.cmv_unitario);
  }

  return NextResponse.json({ cmvs });
}

/**
 * POST /api/cmv
 * Body: { cmvs: { productName: string; cmvUnitario: number }[] }
 * Upserts all CMV records (most-recent-wins per product_name).
 */
export async function POST(request: NextRequest) {
  let body: { cmvs?: { productName: string; cmvUnitario: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const cmvs = body?.cmvs;
  if (!Array.isArray(cmvs) || cmvs.length === 0) {
    return NextResponse.json({ error: "Nenhum CMV fornecido." }, { status: 400 });
  }

  for (const item of cmvs) {
    if (typeof item.productName !== "string" || typeof item.cmvUnitario !== "number" || item.cmvUnitario <= 0) {
      return NextResponse.json(
        { error: "Dados inválidos: productName (string) e cmvUnitario (number > 0) são obrigatórios." },
        { status: 400 }
      );
    }
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("product_cmv").upsert(
    cmvs.map(({ productName, cmvUnitario }) => ({
      product_name: productName,
      cmv_unitario: cmvUnitario,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "product_name" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível salvar os CMVs. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
