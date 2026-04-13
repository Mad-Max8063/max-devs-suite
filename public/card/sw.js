// ============================================
// Service Worker — Suito Virtual Card v5
// Scope: /card/ | Served from: /card/sw.js
// ============================================
// PRECACHE: Solo assets estáticos estables (public/).
// Los assets hasheados por Vite (JS/CSS en /assets/) se cachean
// en runtime via el handler Stale-While-Revalidate.

const CACHE_NAME = 'suito-card-v10';

const PRECACHE_URLS = [
  '/card/',
  '/card/assets/suito-logo.png',
  '/card/assets/cover.png',
  '/card/assets/default-avatar.svg',
  '/card/assets/icon-192.png',
  '/card/assets/icon-512.png',
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

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass cross-origin (Supabase, Google Fonts, Tailwind CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Never intercept the SW file itself
  if (url.pathname.endsWith('sw.js')) return;

  // ——— Navigation (slug URLs like /card/slug/) ———
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
        .catch(() => caches.match(request) || caches.match('/card/'))
    );
    return;
  }

  // ——— Static assets: Stale-While-Revalidate ———
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
