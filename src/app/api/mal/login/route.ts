import { NextRequest, NextResponse } from "next/server";
import { COOKIE_VERIFIER, authUrl, makeVerifier, malConfigured } from "../../../../lib/mal";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!malConfigured()) {
    return NextResponse.json({ error: "MAL_CLIENT_ID not set" }, { status: 500 });
  }
  const redirectUri = `${req.nextUrl.origin}/api/mal/callback`;
  const verifier = makeVerifier();
  const next = req.nextUrl.searchParams.get("next") || "/";
  const res = NextResponse.redirect(authUrl(redirectUri, verifier));
  const secure = req.nextUrl.protocol === "https:";
  res.cookies.set(COOKIE_VERIFIER, verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("mal_next", next, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
