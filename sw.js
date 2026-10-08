const CACHE_NAME = "rishi-music-v9";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.all(
          APP_FILES.map(file =>
            fetch(file, { cache: "no-store" })
              .then(response => {
                if (response.ok) {
                  return cache.put(file, response);
                }
              })
              .catch(error =>
                console.warn("Cache failed:", file, error)
              )
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names.map(name => {
            if (
              name.startsWith("rishi-music-") &&
              name !== CACHE_NAME
            ) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {

        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            })
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => {
            if (cached) {
              return cached;
            }

            return caches.match("./index.html");
          })
      )
  );
});
