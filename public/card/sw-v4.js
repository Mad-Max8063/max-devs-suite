// ============================================
// Service Worker — Suito Virtual Card v4
// Scope: /card/ | Served from: /card/sw-v4.js
// ============================================

const CACHE_NAME = 'suito-card-v4';

// Only precache stable public/ assets — Vite-hashed filenames are NOT
// known at SW write time and must be cached at runtime via fetch handler.
const PRECACHE_URLS = [
  '/card/',
  '/card/assets/suito-logo.png',
  '/card/assets/cover.png',
  '/card/assets/default-avatar.svg',
  // Icons — manifest-declared (paridad 1:1 con manifest-v4.webmanifest)
  '/card/assets/icon-192.svg',   // manifest: image/svg+xml 192x192
  '/card/assets/icon-192.png',   // manifest: image/png 192x192 (NUEVO)
  '/card/assets/icon-512.png',   // manifest: image/png 512x512 (purpose: any + maskable)
  // Icons — vector present on disk, offline policy for Chromium/Android
  '/card/assets/icon-512.svg',   // vector 512x512, existe en public/card/assets/
  '/card/manifest-v4.webmanifest',
  '/favicon.png',
];

// ——— Install: precache stable static assets ———
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ——— Activate: purge ALL stale caches (virtual-card-v5, suito-card-v3, etc.) ———
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
  if (url.pathname.endsWith('sw-v4.js')) return;

  // ——— Navigation (slug URLs like /card/max-devs-solutions/) ———
  // NetworkFirst: dynamic slug content must resolve against the server.
  // Fallback to cache only on network failure.
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
          () => caches.match(request) || caches.match('/card/')
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
