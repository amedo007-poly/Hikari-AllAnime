import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  callWithAuth,
  removeAnime,
} from "../../../../lib/mal";

export const runtime = "nodejs";

// POST { animeId } — remove an anime from the user's MAL list.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const animeId = Number(body?.animeId);
  if (!animeId) return NextResponse.json({ error: "animeId required" }, { status: 400 });

  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;

  try {
    const { tokens } = await callWithAuth(access, refresh, (t) => removeAnime(t, animeId));
    const res = NextResponse.json({ ok: true });
    if (tokens) {
      const secure = req.nextUrl.protocol === "https:";
      const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
      res.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: tokens.expires_in });
      res.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  } catch (e) {
    const msg = String(e);
    if (msg.includes("not_connected"))
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
