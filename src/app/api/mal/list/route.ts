import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  callWithAuth,
  getAnimeList,
} from "../../../../lib/mal";

export const runtime = "nodejs";

const VALID = ["watching", "plan_to_watch", "completed", "on_hold", "dropped"];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "watching";
  if (!VALID.includes(status))
    return NextResponse.json({ error: "bad status", entries: [] }, { status: 400 });

  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;

  try {
    const { result, tokens } = await callWithAuth(access, refresh, (t) =>
      getAnimeList(t, status),
    );
    const res = NextResponse.json({ entries: result });
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
      return NextResponse.json({ error: "not_connected", entries: [] }, { status: 401 });
    return NextResponse.json({ error: msg, entries: [] }, { status: 502 });
  }
}
