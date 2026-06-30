import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "../../../lib/allanime/client";
import type { TranslationType } from "../../../lib/allanime/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const mode = (req.nextUrl.searchParams.get("mode") as TranslationType) ?? "sub";
  if (!q) return NextResponse.json({ results: [] });
  try {
    const results = await searchAnime(q, mode);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, results: [] },
      { status: 502 },
    );
  }
}
