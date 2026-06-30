import { NextRequest, NextResponse } from "next/server";
import {
  getEpisodeInfos,
  getShowDetail,
  listEpisodes,
} from "../../../lib/allanime/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const showId = req.nextUrl.searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });
  try {
    const [detail, episodes] = await Promise.all([
      getShowDetail(showId),
      listEpisodes(showId).catch(() => ({ sub: [], dub: [], raw: [] })),
    ]);

    // Episode titles/thumbnails over the full available range (best-effort).
    const all = [...episodes.sub, ...episodes.dub].map(Number).filter((n) => !isNaN(n));
    const max = all.length ? Math.max(...all) : 0;
    const infos =
      max > 0 ? await getEpisodeInfos(showId, 1, max).catch(() => ({})) : {};

    return NextResponse.json({ detail, episodes, infos });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
