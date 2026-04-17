// Suito Admin Service Worker — pass-through (no cache agresivo)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  // HTML navigation siempre va a la red
  if (event.request.mode === 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
