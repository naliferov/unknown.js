const staticDevCoffee = "de";
const assets = ["/"];

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevCoffee).then(cache => {
      	cache.addAll(assets);
    })
  );
});
self.addEventListener('fetch', (event) => {});