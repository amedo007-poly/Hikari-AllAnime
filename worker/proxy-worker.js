// Hikari stream proxy — Cloudflare Worker.
// Same job as /api/proxy on Vercel, but Cloudflare doesn't bill egress, so
// video bandwidth stops counting against the Vercel plan.
//
// Deploy:  cd worker && npx wrangler deploy
// Then set NEXT_PUBLIC_PROXY_BASE=https://<name>.<account>.workers.dev on Vercel.

const DEFAULT_REFERER = "https://youtu-chan.com";
const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; rv:150.0) Gecko/20100101 Firefox/150.0";
const HLS_HINT = /\.m3u8(\?|$)/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
};

// SSRF guard: public http(s) only.
function isForbiddenTarget(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return true;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return true;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    return true;
  if (host === "0.0.0.0" || host === "[::1]" || host === "::1") return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    )
      return true;
  }
  return false;
}

function proxied(workerOrigin, target, referer) {
  const p = new URLSearchParams({ url: target, referer });
  return `${workerOrigin}/?${p}`;
}

// Rewrite every URI in an m3u8 so segments/keys/nested playlists come back
// through this worker (carrying the referer, dodging CORS).
function rewriteManifest(body, manifestUrl, referer, workerOrigin) {
  const base = new URL(manifestUrl);
  const resolve = (u) => new URL(u, base).toString();
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          return `URI="${proxied(workerOrigin, resolve(uri), referer)}"`;
        });
      }
      return proxied(workerOrigin, resolve(trimmed), referer);
    })
    .join("\n");
}

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "GET") return new Response("method", { status: 405 });

    const reqUrl = new URL(req.url);
    const target = reqUrl.searchParams.get("url");
    const referer = reqUrl.searchParams.get("referer") || DEFAULT_REFERER;
    if (!target) return new Response("missing url", { status: 400 });
    if (isForbiddenTarget(target))
      return new Response("forbidden target", { status: 403 });

    const range = req.headers.get("range");
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": AGENT,
        Referer: referer,
        Origin: new URL(referer).origin,
        ...(range ? { Range: range } : {}),
      },
      redirect: "follow",
    });

    const ct = upstream.headers.get("content-type") ?? "";
    const isManifest =
      ct.includes("mpegurl") || ct.includes("vnd.apple") || HLS_HINT.test(target);

    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(
        text,
        upstream.url || target,
        referer,
        reqUrl.origin,
      );
      return new Response(rewritten, {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
        },
      });
    }

    const headers = new Headers(CORS);
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
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
