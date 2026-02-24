import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type CategoryType = "Despesa" | "Custo de Produto" | "Ignorar";

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * GET /api/categories?descriptions[]=desc1&descriptions[]=desc2
 * Returns previously saved categories for each requested description (matched case-insensitively).
 * Response: { categories: { description: string; category: CategoryType }[] }
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawDescriptions = url.searchParams.getAll("descriptions[]");

  if (rawDescriptions.length === 0) {
    return NextResponse.json({ categories: [] });
  }

  const normalizedDescriptions = rawDescriptions.map(normalize);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_categories")
    .select("description, category")
    .in("description", normalizedDescriptions);

  if (error) {
    return NextResponse.json({ categories: [] });
  }

  return NextResponse.json({ categories: data ?? [] });
}

/**
 * POST /api/categories
 * Body: { categorizations: { description: string; category: CategoryType }[] }
 * Upserts only 'Despesa' and 'Custo de Produto' categories (descriptions normalized to lowercase).
 * Response: { ok: true }
 */
export async function POST(request: NextRequest) {
  let body: { categorizations?: { description: string; category: CategoryType }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const categorizations = body?.categorizations;
  if (!Array.isArray(categorizations)) {
    return NextResponse.json({ error: "Nenhuma categorização fornecida." }, { status: 400 });
  }

  const valid = categorizations.filter(
    (c) =>
      typeof c.description === "string" &&
      c.description.trim().length > 0 &&
      (c.category === "Despesa" || c.category === "Custo de Produto")
  );

  if (valid.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // Deduplicate by normalized description (last entry wins)
  const deduped = new Map<string, { description: string; category: string }>();
  for (const c of valid) {
    deduped.set(normalize(c.description), {
      description: normalize(c.description),
      category: c.category,
    });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("account_categories").upsert(
    Array.from(deduped.values()).map((c) => ({
      ...c,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "description" }
  );

  if (error) {
    console.error("[categories] Supabase upsert error:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar as categorizações. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
