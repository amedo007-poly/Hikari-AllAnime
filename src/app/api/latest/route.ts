import { NextResponse } from "next/server";
import { getLatest } from "../../../lib/allanime/client";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const results = await getLatest(18);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, results: [] }, { status: 502 });
  }
}
