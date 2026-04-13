// ============================================
// Service Worker — Suito Virtual Card v2026
// Scope: /card/ | Served from: /card/sw-2026.js
// ============================================

const CACHE_NAME = 'suito-card-v2026';

// Only precache stable public/ assets — Vite-hashed filenames are NOT
// known at SW write time and must be cached at runtime via fetch handler.
const PRECACHE_URLS = [
  '/card/',
  '/card/suito-max-2026.html',
  '/card/assets/suito-logo.png',
  '/card/assets/cover.png',
  '/card/assets/default-avatar.svg',
  // Icons — manifest-declared (paridad 1:1 con manifest-2026.webmanifest)
  '/card/assets/icon-192.svg',
  '/card/assets/icon-192.png',
  '/card/assets/icon-512.png',
  '/card/assets/icon-512.svg',
  '/card/manifest-2026.webmanifest',
  '/card/favicon.png?v=2026',
];

// ——— Install: precache stable static assets ———
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ——— Activate: purge ALL stale caches ———
self.addEventListener('activate', (event) => {
  const VALID_CACHES = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !VALID_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ——— Fetch ———
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass cross-origin (Supabase, Google Fonts, Tailwind CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Never intercept the SW file itself
  if (url.pathname.endsWith('sw-2026.js')) return;

  // ——— Navigation (slug URLs like /card/max-devs-solutions/) ———
  // NetworkFirst: dynamic slug content must resolve against the server.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(
          () => caches.match(request) || caches.match('/card/suito-max-2026.html')
        )
    );
    return;
  }

  // ——— Static assets (images, scripts, styles, fonts) ———
  // Stale-While-Revalidate: instant response from cache + background update.
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // ——— Default: NetworkFirst with cache fallback ———
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
