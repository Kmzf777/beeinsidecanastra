import { NextRequest, NextResponse } from "next/server";
import { getConnectedAccounts } from "@/lib/bling/token-manager";
import { fetchAllAccountsPaidAccounts } from "@/lib/bling/contas-pagas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const month = Number(monthParam);
  const year = Number(yearParam);

  if (
    !monthParam ||
    !yearParam ||
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return NextResponse.json(
      { error: "Parâmetros inválidos. Informe month (1-12) e year." },
      { status: 400 }
    );
  }

  try {
    const connectedAccounts = await getConnectedAccounts();

    if (connectedAccounts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhuma conta Bling conectada. Conecte uma conta nas configurações.",
        },
        { status: 422 }
      );
    }

    const accounts = await fetchAllAccountsPaidAccounts(
      connectedAccounts,
      month,
      year
    );

    return NextResponse.json({
      accounts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[contas-pagas] Error:", err);
    return NextResponse.json(
      {
        error:
          "Não foi possível buscar as contas pagas. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
