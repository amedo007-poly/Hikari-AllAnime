import { NextRequest, NextResponse } from "next/server";
import {
  getByType,
  getLatest,
  getMostPopular,
} from "../../../lib/allanime/client";
import type { SearchResult } from "../../../lib/allanime/types";

export const runtime = "nodejs";

// /api/browse?kind=movie|tv|ona|ova|special|popular|latest&page=1
export async function GET(req: NextRequest) {
  const kind = (req.nextUrl.searchParams.get("kind") ?? "popular").toLowerCase();
  const page = Number(req.nextUrl.searchParams.get("page")) || 1;

  const TYPE: Record<string, string> = {
    movie: "Movie",
    tv: "TV",
    ona: "ONA",
    ova: "OVA",
    special: "Special",
  };

  try {
    let results: SearchResult[];
    if (kind === "latest") results = await getLatest(30);
    else if (kind === "popular") results = await getMostPopular(page);
    else if (TYPE[kind]) results = await getByType([TYPE[kind]], page);
    else results = await getMostPopular(page);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, results: [] }, { status: 502 });
  }
}
