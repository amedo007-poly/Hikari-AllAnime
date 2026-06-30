import { NextRequest, NextResponse } from "next/server";
import { getEpisodeStreams } from "../../../lib/allanime/client";
import type { TranslationType } from "../../../lib/allanime/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const showId = p.get("showId");
  const ep = p.get("ep");
  const mode = (p.get("mode") as TranslationType) ?? "sub";
  if (!showId || !ep)
    return NextResponse.json({ error: "showId and ep required" }, { status: 400 });
  try {
    const streams = await getEpisodeStreams(showId, ep, mode);
    return NextResponse.json({ streams });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, streams: [] }, { status: 502 });
  }
}
