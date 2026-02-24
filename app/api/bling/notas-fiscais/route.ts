import { NextRequest, NextResponse } from "next/server";
import { getConnectedAccounts } from "@/lib/bling/token-manager";
import { fetchAllAccountsProductItems } from "@/lib/bling/notas-fiscais";
import { consolidateProducts } from "@/lib/calculations/consolidate-products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const month = Number(monthParam);
  const year = Number(yearParam);

  if (!monthParam || !yearParam || isNaN(month) || isNaN(year) ||
      month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Parâmetros inválidos. Informe month (1-12) e year." },
      { status: 400 }
    );
  }

  try {
    const connectedAccounts = await getConnectedAccounts();

    if (connectedAccounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta Bling conectada. Conecte uma conta nas configurações." },
        { status: 422 }
      );
    }

    const rawItems = await fetchAllAccountsProductItems(
      connectedAccounts,
      month,
      year
    );

    const products = consolidateProducts(rawItems);

    return NextResponse.json({
      products,
      fetchedAt: new Date().toISOString(),
      accountsQueried: connectedAccounts,
    });
  } catch (err) {
    console.error("[notas-fiscais] Error:", err);
    return NextResponse.json(
      { error: "Não foi possível buscar as notas fiscais. Tente novamente." },
      { status: 500 }
    );
  }
}
