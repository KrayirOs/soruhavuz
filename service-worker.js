const CACHE_VERSION = "v1";
const CACHE_NAME = `soru-havuzu-${CACHE_VERSION}`;

const CACHE_URLS = [
  "/",
  "/index.html",
  "/ekle.html",
  "/liste.html",
  "/tekrar.html",
  "/rastgele.html",
  "/veri.html",
  "/styles.css",
  "/common.js",
  "/db.js",
  "/image-utils.js",
  "/analytics.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS).catch((error) => {
        console.warn("Cache addAll failed:", error);
        // Partial cache is OK
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension and similar requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cache if available
      if (response) return response;

      // Otherwise, try network
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page if available
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
          return new Response("Çevrimdışı moda geçildi", { status: 503 });
        });
    })
  );
});
