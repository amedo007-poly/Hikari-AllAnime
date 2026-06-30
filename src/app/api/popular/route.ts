import { NextRequest, NextResponse } from "next/server";
import { getPopular } from "../../../lib/allanime/client";

export const runtime = "nodejs";
export const revalidate = 600; // cache trending for 10 min

export async function GET(req: NextRequest) {
  const range = Number(req.nextUrl.searchParams.get("dateRange")) || 7;
  try {
    const results = await getPopular(24, range);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, results: [] }, { status: 502 });
  }
}
