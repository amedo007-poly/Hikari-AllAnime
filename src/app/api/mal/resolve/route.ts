import { NextRequest, NextResponse } from "next/server";
import { resolveByMal } from "../../../../lib/allanime/client";

export const runtime = "nodejs";

// Map a MAL anime to an AllAnime show (exact by malId, else best title match).
export async function GET(req: NextRequest) {
  const malId = req.nextUrl.searchParams.get("malId");
  const title = req.nextUrl.searchParams.get("title") ?? "";
  if (!malId) return NextResponse.json({ showId: null }, { status: 400 });
  try {
    const show = await resolveByMal(malId, title);
    return NextResponse.json({ showId: show?.id ?? null, name: show?.name ?? null });
  } catch (e) {
    return NextResponse.json({ showId: null, error: (e as Error).message }, { status: 502 });
  }
}
