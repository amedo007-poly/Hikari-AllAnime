import { NextResponse } from "next/server";
import { getRandom } from "../../../lib/allanime/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const show = await getRandom();
    return NextResponse.json({ showId: show?.id ?? null, name: show?.name ?? null });
  } catch (e) {
    return NextResponse.json({ showId: null, error: (e as Error).message }, { status: 502 });
  }
}
