import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Op/Ed skip timestamps from AniSkip (keyed by MAL id + episode number).
// https://api.aniskip.com/v2/skip-times/{malId}/{ep}?types=op&types=ed&episodeLength=0
export async function GET(req: NextRequest) {
  const malId = req.nextUrl.searchParams.get("malId");
  const ep = req.nextUrl.searchParams.get("ep");
  const len = req.nextUrl.searchParams.get("len") ?? "0";
  if (!malId || !ep) return NextResponse.json({ skips: [] });

  try {
    const url = `https://api.aniskip.com/v2/skip-times/${malId}/${ep}?types=op&types=ed&episodeLength=${len}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ skips: [] });
    const json = await res.json();
    type Skip = { skipType: string; interval: { startTime: number; endTime: number } };
    const skips = (json.results ?? []).map((r: Skip) => ({
      type: r.skipType, // "op" | "ed"
      start: r.interval.startTime,
      end: r.interval.endTime,
    }));
    return NextResponse.json({ skips });
  } catch {
    return NextResponse.json({ skips: [] });
  }
}
