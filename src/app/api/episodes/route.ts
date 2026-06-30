import { NextRequest, NextResponse } from "next/server";
import { listEpisodes } from "../../../lib/allanime/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const showId = req.nextUrl.searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });
  try {
    const episodes = await listEpisodes(showId);
    return NextResponse.json({ episodes });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
