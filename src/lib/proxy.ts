import { ALLANIME_REFERER } from "./allanime/config";

// When NEXT_PUBLIC_PROXY_BASE is set (Cloudflare Worker URL), streams go
// through it instead of /api/proxy — Cloudflare doesn't bill egress, so
// video bandwidth stops counting against the Vercel plan.
const BASE = process.env.NEXT_PUBLIC_PROXY_BASE?.replace(/\/$/, "") ?? "";

/** Wrap an upstream stream URL so it loads through the proxy (Worker if configured). */
export function buildProxyUrl(url: string, referer = ALLANIME_REFERER): string {
  const p = new URLSearchParams({ url, referer });
  return BASE ? `${BASE}/?${p}` : `/api/proxy?${p}`;
}
