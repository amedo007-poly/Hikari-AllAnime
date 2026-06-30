import { NextResponse } from "next/server";
import { getSpotlight } from "../../../lib/allanime/client";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET() {
  try {
    const items = await getSpotlight(6);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, items: [] }, { status: 502 });
  }
}
