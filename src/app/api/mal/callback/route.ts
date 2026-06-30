import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_VERIFIER,
  exchangeCode,
} from "../../../../lib/mal";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const verifier = req.cookies.get(COOKIE_VERIFIER)?.value;
  if (!code || !verifier) {
    return NextResponse.redirect(`${origin}/mal?error=auth`);
  }

  try {
    const tokens = await exchangeCode(code, verifier, `${origin}/api/mal/callback`);
    const next = req.cookies.get("mal_next")?.value || "/";
    const res = NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
    const secure = req.nextUrl.protocol === "https:";
    const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
    res.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: tokens.expires_in });
    res.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
    res.cookies.delete(COOKIE_VERIFIER);
    res.cookies.delete("mal_next");
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=token`);
  }
}
