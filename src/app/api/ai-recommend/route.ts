import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "../../../lib/allanime/client";
import type { SearchResult } from "../../../lib/allanime/types";

export const runtime = "nodejs";

const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// POST { vibe, seeds?: string[] } -> AI picks anime, we resolve to playable shows.
export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured", picks: [] }, { status: 503 });

  const body = await req.json().catch(() => null);
  const vibe: string = (body?.vibe ?? "").toString().slice(0, 500);
  const seeds: string[] = Array.isArray(body?.seeds) ? body.seeds.slice(0, 12) : [];
  if (!vibe && seeds.length === 0)
    return NextResponse.json({ error: "empty", picks: [] }, { status: 400 });

  const sys =
    "You are Hikari's anime recommendation engine. Recommend 8 anime tailored to the user. " +
    "Return ONLY a JSON array, no prose, of objects: " +
    '{"title": "<searchable romaji or common English title>", "reason": "<one vivid sentence why>"}. ' +
    "Avoid duplicates and avoid titles the user already listed.";
  const user =
    (seeds.length ? `The user likes: ${seeds.join(", ")}.\n` : "") +
    (vibe ? `They want: ${vibe}\n` : "") +
    "Recommend 8 anime as JSON.";

  let content = "";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hikari.app",
        "X-Title": "Hikari",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.8,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `openrouter ${res.status}`, picks: [] }, { status: 502 });
    }
    const json = await res.json();
    content = json?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, picks: [] }, { status: 502 });
  }

  // parse the JSON array out of the model output
  let recs: { title: string; reason: string }[] = [];
  try {
    const m = content.match(/\[[\s\S]*\]/);
    recs = JSON.parse(m ? m[0] : content);
  } catch {
    return NextResponse.json({ error: "parse", picks: [], raw: content.slice(0, 300) }, { status: 502 });
  }

  // resolve each title to a playable AllAnime show (best title match)
  const resolved = await Promise.all(
    recs.slice(0, 8).map(async (r) => {
      const hit: SearchResult | undefined = (await searchAnime(r.title).catch(() => []))[0];
      return hit ? { show: hit, reason: r.reason, title: r.title } : null;
    }),
  );

  const picks = resolved.filter(Boolean);
  return NextResponse.json({ picks });
}
