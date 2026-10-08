const CACHE_NAME = "touchgrass-shell-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/touchgrass.svg",
  "/icons/touchgrass-192.png",
  "/icons/touchgrass-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("/index.html")
      .then((response) => response.text())
      .then((html) => {
        const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
        return caches.open(CACHE_NAME).then((cache) => cache.addAll([...new Set([...APP_SHELL, ...assets])]));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    const cachedPage = new URL(url.pathname, self.location.origin).href;
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy)));
          return response;
        })
        .catch(async () => (
          (await caches.match(cachedPage, { ignoreVary: true }))
          || (await caches.match(new URL("/index.html", self.location.origin).href, { ignoreVary: true }))
        )),
    );
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then((cached) => {
        const update = fetch(request).then((response) => {
          if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())));
          return response;
        }).catch(() => cached);
        return cached || update;
      }),
    );
  }
});
