const CACHE_NAME = 'chronos-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://placehold.co/192x192/ffffff/1a1a1a/png?text=Chr',
  'https://placehold.co/512x512/ffffff/1a1a1a/png?text=Chr',
  'https://placehold.co/1080x1920/fdfcf0/1a1a1a/png?text=Chronos+Gazette+Mobile',
  'https://placehold.co/1920x1080/fdfcf0/1a1a1a/png?text=Chronos+Gazette+Desktop'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
