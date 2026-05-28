/* OwnManage PWA service worker — static assets only; API/data always fresh */
const VERSION = "v3";
const STATIC_CACHE = `ownmanage-static-${VERSION}`;

const PRECACHE_URLS = [
  "/",
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

  // Only handle HTTP and HTTPS requests (ignores chrome-extension, data urls, etc.)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // API & Next.js payloads: never cache — always network
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    request.method !== "GET"
  ) {
    return;
  }

  // Document navigation: network only (no stale HTML/RSC)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  // Static assets (icons, fonts, images): cache-first
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
});
