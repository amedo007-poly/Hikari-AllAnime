import { NextRequest, NextResponse } from "next/server";

// Per-user gate: you must be signed in with your own MyAnimeList account.
// (Cookie names mirror lib/mal.ts; inlined here to keep the edge middleware
// free of the node:crypto import that lib/mal.ts pulls in.)
const COOKIE_ACCESS = "mal_at";
const COOKIE_REFRESH = "mal_rt";

export function middleware(req: NextRequest) {
  // Gate only active once MAL is configured; off in local dev without a client id.
  if (!process.env.MAL_CLIENT_ID) return NextResponse.next();

  const authed =
    !!req.cookies.get(COOKIE_ACCESS)?.value || !!req.cookies.get(COOKIE_REFRESH)?.value;
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Everything is gated except the sign-in flow + static/PWA assets.
export const config = {
  matcher: [
    "/((?!login|api/mal/login|api/mal/callback|_next/static|_next/image|icons|apple-touch-icon.png|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
