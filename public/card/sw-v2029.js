// Suito VCard Service Worker v2029-FINAL-r2
const CACHE_NAME = 'suito-card-v2029';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_ACTIVATED' }));
    }))
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through for Supabase and other external APIs
  if (event.request.url.includes('supabase.co')) return;

  // Never intercept navigation requests — HTML always comes fresh from the server
  if (event.request.mode === 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      return cachedResponse || Response.error();
    })
  );
});
