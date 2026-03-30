// ============================================
// Service Worker — Cache strategy for PWA
// ============================================

const CACHE_NAME = 'virtual-card-v5';

const PRECACHE_URLS = [
  '/card-app/css/styles.css',
  '/card-app/js/app.js',
  '/card-app/js/card.js',
  '/card-app/js/editor.js',
  '/card-app/js/gallery-editor.js',
  '/card-app/js/supabase.js',
  '/card-app/js/utils.js',
  '/card-app/js/vcard.js',
  '/card-app/assets/default-avatar.svg',
];

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for external resources (Supabase, CDN, etc.)
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // NETWORK-FIRST for navigation (HTML pages) — always get fresh HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/card-app/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
