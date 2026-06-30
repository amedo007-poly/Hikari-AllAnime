import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  callWithAuth,
  getMe,
  malConfigured,
} from "../../../../lib/mal";

export const runtime = "nodejs";

// Who's signed in? { connected, configured, name?, picture? }
export async function GET(req: NextRequest) {
  const configured = malConfigured();
  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;
  if (!access && !refresh) {
    return NextResponse.json({ configured, connected: false });
  }
  try {
    const { result, tokens } = await callWithAuth(access, refresh, (t) => getMe(t));
    const res = NextResponse.json({ configured, connected: true, ...result });
    if (tokens) {
      const secure = req.nextUrl.protocol === "https:";
      const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
      res.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: tokens.expires_in });
      res.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  } catch {
    return NextResponse.json({ configured, connected: false });
  }
}
