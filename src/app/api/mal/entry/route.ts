import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  callWithAuth,
  getAnimeStatus,
} from "../../../../lib/mal";

export const runtime = "nodejs";

// GET ?malId= — is this anime on the user's MAL list? { connected, onList, status, watched }
export async function GET(req: NextRequest) {
  const malId = Number(req.nextUrl.searchParams.get("malId"));
  if (!malId) return NextResponse.json({ error: "malId required" }, { status: 400 });

  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;
  if (!access && !refresh) return NextResponse.json({ connected: false });

  try {
    const { result, tokens } = await callWithAuth(access, refresh, (t) => getAnimeStatus(t, malId));
    const res = NextResponse.json({
      connected: true,
      onList: !!result,
      status: result?.status ?? null,
      watched: result?.watched ?? 0,
      score: result?.score ?? 0,
    });
    if (tokens) {
      const secure = req.nextUrl.protocol === "https:";
      const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
      res.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: tokens.expires_in });
      res.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  } catch {
    return NextResponse.json({ connected: false });
  }
}
