import { NextRequest, NextResponse } from "next/server";
import { getByGenre } from "../../../lib/allanime/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "name required", results: [] }, { status: 400 });
  try {
    const results = await getByGenre(name, 30);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, results: [] }, { status: 502 });
  }
}
