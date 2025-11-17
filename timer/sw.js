self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("timer-cache").then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./sw.js"
      ]);
    })
  );
});

self.addEventListener("activate", () => {
  console.log("Service worker activated");
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});
