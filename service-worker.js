const CACHE_NAME = "soru-havuzu-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./ekle.html",
  "./liste.html",
  "./rastgele.html",
  "./veri.html",
  "./styles.css",
  "./db.js",
  "./image-utils.js",
  "./common.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key !== CACHE_NAME)
      .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const network = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, network.clone());
  return network;
}

async function networkFirstForNavigation(request) {
  try {
    const network = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, network.clone());
    return network;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || caches.match("./index.html");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstForNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
