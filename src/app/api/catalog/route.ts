import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "../../../lib/allanime/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const year = Number(p.get("year"));
  try {
    const results = await getCatalog({
      genre: p.get("genre") || undefined,
      type: p.get("type") || undefined,
      year: year || undefined,
      sort: p.get("sort") || undefined,
      page: Number(p.get("page")) || 1,
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, results: [] }, { status: 502 });
  }
}
