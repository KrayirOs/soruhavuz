// Her deploy'da bu numarayi elle artir (ya da bir build script ile otomatiklestir).
// Bu deger degismedigi surece tarayici service worker dosyasini "ayni" sanip
// telefonlardaki eski onbellegi hic yenilemez; bu da guncellemelerin
// yuklu PWA'ya hic ulasmamasina yol acan asil sorundu.
const CACHE_VERSION = "v2";
const CACHE_NAME = `soru-havuzu-${CACHE_VERSION}`;

// Kullanicinin gercek verisini (IndexedDB) etkilemez; sadece dosya onbellegidir.
const CACHE_URLS = [
  "/",
  "/index.html",
  "/ekle.html",
  "/liste.html",
  "/tekrar.html",
  "/rastgele.html",
  "/veri.html",
  "/istatistikler.html",
  "/ayarlar.html",
  "/styles.css",
  "/common.js",
  "/constants.js",
  "/db.js",
  "/image-utils.js",
  "/analytics.js",
  "/stats.js",
  "/theme.js",
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

  const isAppShellFile = event.request.destination === "document" ||
    event.request.destination === "script" ||
    event.request.url.endsWith(".html") ||
    event.request.url.endsWith(".js");

  if (isAppShellFile) {
    // Network-first: HTML/JS dosyalari icin once agdan guncel surumu almayi dene.
    // Boylece yaptigin her kod guncellemesi telefondaki yuklu PWA'ya hemen yansir.
    // Ag yoksa (cevrimdisi), en son onbellenmis surume dus.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.destination === "document") {
              return caches.match("/index.html");
            }
            return new Response("Çevrimdışı moda geçildi", { status: 503 });
          })
        )
    );
    return;
  }

  // Diger statik dosyalar (resim, font, css vb.) icin cache-first devam ediyor.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => new Response("Çevrimdışı moda geçildi", { status: 503 }));
    })
  );
});
