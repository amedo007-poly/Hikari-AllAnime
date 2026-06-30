import { ALLANIME_REFERER } from "./allanime/config";

/** Wrap an upstream stream URL so it loads same-origin through /api/proxy. */
export function buildProxyUrl(url: string, referer = ALLANIME_REFERER): string {
  const p = new URLSearchParams({ url, referer });
  return `/api/proxy?${p}`;
}
