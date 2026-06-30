import { NextResponse } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "../../../../lib/mal";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_ACCESS);
  res.cookies.delete(COOKIE_REFRESH);
  return res;
}
