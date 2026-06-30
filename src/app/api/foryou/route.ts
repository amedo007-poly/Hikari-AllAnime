import { NextRequest, NextResponse } from "next/server";
import { getShowDetail, getByGenre } from "../../../lib/allanime/client";
import type { SearchResult } from "../../../lib/allanime/types";

export const runtime = "nodejs";

/**
 * Lightweight content-based recommender (no LLM / no key).
 * POST { ids: string[] } — the shows the user has saved / is watching.
 * 1) pull genres of the seed shows, weight them
 * 2) browse the top genres
 * 3) drop already-seen shows, dedupe, rank by score
 * Returns { results, genres } so the UI can say "Because you like <genre>".
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.slice(0, 8) : [];
  if (ids.length === 0) return NextResponse.json({ results: [], genres: [] });

  try {
    // 1) genre weights from the seed shows
    const details = await Promise.all(ids.map((id) => getShowDetail(id).catch(() => null)));
    const weight: Record<string, number> = {};
    for (const d of details) {
      for (const g of d?.genres ?? []) weight[g] = (weight[g] ?? 0) + 1;
    }
    const topGenres = Object.entries(weight)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    if (topGenres.length === 0) return NextResponse.json({ results: [], genres: [] });

    // 2) candidates from those genres
    const seen = new Set(ids);
    const pools = await Promise.all(topGenres.map((g) => getByGenre(g, 1).catch(() => [])));

    // 3) merge, drop seen, dedupe, rank by score
    const byId = new Map<string, SearchResult>();
    for (const pool of pools) {
      for (const s of pool) {
        if (seen.has(s.id) || byId.has(s.id)) continue;
        byId.set(s.id, s);
      }
    }
    const results = [...byId.values()]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 24);

    return NextResponse.json({ results, genres: topGenres });
  } catch (e) {
    return NextResponse.json({ results: [], genres: [], error: (e as Error).message }, { status: 502 });
  }
}
