import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH, malConfigured } from "../../../../lib/mal";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const connected =
    !!req.cookies.get(COOKIE_ACCESS)?.value || !!req.cookies.get(COOKIE_REFRESH)?.value;
  return NextResponse.json({ configured: malConfigured(), connected });
}
