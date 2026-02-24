import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateContributionMargin } from "@/lib/calculations/contribution-margin";

interface ProductInput {
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
}

interface PaidAccountInput {
  descricao: string;
  valor: number;
}

interface RequestBody {
  month?: unknown;
  year?: unknown;
  products?: unknown;
  paidAccounts?: unknown;
}

/**
 * POST /api/calculate
 * Body: {
 *   month: number,
 *   year: number,
 *   products: { nomeProduto, quantidade, valorUnitario }[], // NF data from client context
 *   paidAccounts: { descricao, valor }[]                   // paid accounts from Bling/context
 * }
 *
 * Flow:
 *   1. Read product_cmv from Supabase (cmvUnitario per product)
 *   2. Read aliquota from monthly_config (Supabase)
 *   3. Read account_categories for paid account descriptions (Supabase)
 *   4. Filter paidAccounts to category='Despesa'
 *   5. Run calculateContributionMargin()
 *   6. Upsert result into monthly_results (Supabase)
 *   7. Return CalculationResult
 */
export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { month, year, products, paidAccounts } = body;

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

  if (!Array.isArray(products)) {
    return NextResponse.json({ error: "products deve ser um array." }, { status: 400 });
  }

  if (!Array.isArray(paidAccounts)) {
    return NextResponse.json({ error: "paidAccounts deve ser um array." }, { status: 400 });
  }

  const typedProducts = products as ProductInput[];
  const typedPaidAccounts = paidAccounts as PaidAccountInput[];

  const supabase = createServiceClient();

  // 1. Fetch aliquota from monthly_config
  const { data: configData } = await supabase
    .from("monthly_config")
    .select("aliquota")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  const aliquota = configData ? Number(configData.aliquota) : 0;

  // 2. Fetch CMV per product from product_cmv
  const productNames = typedProducts.map((p) => p.nomeProduto);
  const cmvMap: Record<string, number> = {};

  if (productNames.length > 0) {
    const { data: cmvData } = await supabase
      .from("product_cmv")
      .select("product_name, cmv_unitario")
      .in("product_name", productNames);

    for (const row of cmvData ?? []) {
      cmvMap[row.product_name] = Number(row.cmv_unitario);
    }
  }

  // 3. Fetch categories for paid accounts from account_categories
  const descriptions = typedPaidAccounts.map((a) => a.descricao.trim().toLowerCase());
  const categoryMap: Record<string, string> = {};

  if (descriptions.length > 0) {
    const { data: catData } = await supabase
      .from("account_categories")
      .select("description, category")
      .in("description", descriptions);

    for (const row of catData ?? []) {
      categoryMap[row.description] = row.category;
    }
  }

  // 4. Build CalculationInput
  const calcInput = {
    products: typedProducts.map((p) => ({
      nomeProduto: p.nomeProduto,
      quantidade: p.quantidade,
      valorUnitario: p.valorUnitario,
      cmvUnitario: cmvMap[p.nomeProduto] ?? 0,
    })),
    aliquota,
    despesas: typedPaidAccounts
      .filter((a) => categoryMap[a.descricao.trim().toLowerCase()] === "Despesa")
      .map((a) => a.valor),
  };

  // 5. Run calculation
  const result = calculateContributionMargin(calcInput);

  // 6. Upsert into monthly_results
  const { error: upsertError } = await supabase.from("monthly_results").upsert(
    {
      month,
      year,
      total_receita: result.summary.totalReceita,
      total_impostos: result.summary.totalImpostos,
      total_cmv: result.summary.totalCMV,
      total_mc: result.summary.totalMC,
      total_despesas: result.summary.totalDespesas,
      resultado_operacional: result.summary.resultadoOperacional,
      products_detail: result.products,
      calculated_at: result.calculatedAt,
    },
    { onConflict: "month,year" }
  );

  if (upsertError) {
    return NextResponse.json(
      { error: "Não foi possível salvar o resultado. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
