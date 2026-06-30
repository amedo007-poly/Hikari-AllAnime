// Minimal service worker — enables installability + an app-shell cache.
// Streaming (API/proxy) always goes to network; only the static shell is cached.
const CACHE = "hikari-shell-v1";
const SHELL = ["/", "/search", "/list"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache streams or API responses.
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.method !== "GET") return;

  // Network-first for navigations, cache fallback offline.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/") .then((r) => r ?? Response.error())));
    return;
  }
  // Cache-first for other GETs (static assets).
  e.respondWith(
    caches.match(e.request).then((hit) => hit ?? fetch(e.request)),
  );
});
