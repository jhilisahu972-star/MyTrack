const CACHE_NAME = "mytrack-v1";

const ASSETS = [
  "./habit-tracker.html",
  "./manifest.json",
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap"
];

// Install — cache all core assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete any old caches from previous versions
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, fall back to network
self.addEventListener("fetch", event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Only cache valid responses from our own origin or fonts
          if (
            response.ok &&
            (event.request.url.startsWith(self.location.origin) ||
             event.request.url.includes("fonts.googleapis.com") ||
             event.request.url.includes("fonts.gstatic.com"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — return cached HTML for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("./habit-tracker.html");
          }
        });
    })
  );
});
