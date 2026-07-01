import { NextRequest } from "next/server";
import { AGENT, ALLANIME_REFERER } from "../../../lib/allanime/config";

export const runtime = "nodejs";

// Build a same-origin proxy URL for a given absolute target + referer.
function proxied(target: string, referer: string): string {
  const p = new URLSearchParams({ url: target, referer });
  return `/api/proxy?${p}`;
}

// Rewrite every URI inside an m3u8 manifest to route back through this proxy,
// so segments, nested playlists, and encryption keys all carry the referer
// and dodge CORS. Relative URIs are resolved against the manifest's own URL.
function rewriteManifest(body: string, manifestUrl: string, referer: string): string {
  const base = new URL(manifestUrl);
  const resolve = (u: string) => new URL(u, base).toString();

  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Tag lines: rewrite any URI="..." attribute (EXT-X-KEY, EXT-X-MEDIA, MAP).
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          return `URI="${proxied(resolve(uri), referer)}"`;
        });
      }

      // Plain URI line (segment or variant playlist).
      return proxied(resolve(trimmed), referer);
    })
    .join("\n");
}

const HLS_HINT = /\.m3u8(\?|$)/i;

// SSRF guard: only proxy public http(s) hosts — never loopback/private/link-local.
function isForbiddenTarget(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return true;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return true;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal"))
    return true;
  if (host === "0.0.0.0" || host === "[::1]" || host === "::1") return true;
  // IPv4 literal in a private/reserved range
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254))
      return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer") ?? ALLANIME_REFERER;
  if (!target) return new Response("missing url", { status: 400 });
  if (isForbiddenTarget(target)) return new Response("forbidden target", { status: 403 });

  const range = req.headers.get("range");
  const upstream = await fetch(target, {
    headers: {
      "User-Agent": AGENT,
      Referer: referer,
      Origin: new URL(referer).origin,
      ...(range ? { Range: range } : {}),
    },
    // follow redirects to the real CDN
    redirect: "follow",
  });

  const ct = upstream.headers.get("content-type") ?? "";
  const isManifest =
    ct.includes("mpegurl") || ct.includes("vnd.apple") || HLS_HINT.test(target);

  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*",
  };

  if (isManifest) {
    const text = await upstream.text();
    const rewritten = rewriteManifest(text, upstream.url || target, referer);
    return new Response(rewritten, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    });
  }

  // Pass-through stream (segments, mp4, keys). Preserve range/length headers.
  const headers = new Headers(cors);
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
  ]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  // Upstream image hosts sometimes omit content-type; infer it so <img> renders.
  if (!headers.has("content-type")) {
    const ext = new URL(target).pathname.toLowerCase().match(/\.(\w+)(?:$|\?)/)?.[1];
    const mime: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    if (ext && mime[ext]) headers.set("content-type", mime[ext]);
  }

  return new Response(upstream.body, {
    status: upstream.status, // 206 for partial content
    headers,
  });
}
