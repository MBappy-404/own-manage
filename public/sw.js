/* OwnManage PWA service worker — v4: aggressive no-cache for data & navigation */
const VERSION = "v4";
const STATIC_CACHE = `ownmanage-static-${VERSION}`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin HTTP/HTTPS requests
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.origin !== self.location.origin) return;

  // NEVER cache: API, Next.js internals, RSC data, non-GET, or POST
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("_t") ||
    request.method !== "GET"
  ) {
    return; // Let browser handle it directly — no SW interference
  }

  // Document navigation: ALWAYS network-only, offline-only fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => {
        // Only when truly offline — return a basic offline message
        return caches.match("/manifest.webmanifest").then(() =>
          new Response(
            "<html><body style='font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0a0f1d;color:#fff'><div style='text-align:center'><h1>You are offline</h1><p>Please check your connection and try again.</p></div></body></html>",
            { headers: { "Content-Type": "text/html" } },
          ),
        );
      }),
    );
    return;
  }

  // Static assets only (icons, fonts, images): cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(STATIC_CACHE)
              .then((c) => c.put(request, copy))
              .catch((err) => console.warn("PWA Cache PUT failed:", err));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Everything else: network-only (no caching)
  return;
});
