const CACHE_NAME = 'chronos-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://placehold.co/192x192/ffffff/1a1a1a/png?text=Chr',
  'https://placehold.co/512x512/ffffff/1a1a1a/png?text=Chr'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
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
  self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests unless they are in STATIC_ASSETS
  if (!event.request.url.startsWith(self.location.origin) && 
      !STATIC_ASSETS.includes(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails, we already returned cachedResponse if it exists
      });

      return cachedResponse || fetchPromise;
    })
  );
});
