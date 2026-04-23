// Service Worker - Suito - Gestor de Turnos
// Estrategia: Network First con fallback a cache

const CACHE_NAME = 'suito-app-v1';
const STATIC_CACHE = 'suito-static-v1';

// Assets estáticos para cachear
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Páginas para cache offline
const OFFLINE_PAGES = [
    './',
    './index.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
                        .map((name) => {
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip API calls to Supabase (don't cache dynamic data)
    if (request.url.includes('supabase.co')) {
        return;
    }

    // For navigation requests, use network first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Ultimate fallback - return cached index.html
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // For static assets, use cache first
    if (request.destination === 'image' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font') {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached version and update in background
                        fetch(request).then((response) => {
                            caches.open(STATIC_CACHE).then((cache) => {
                                cache.put(request, response);
                            });
                        }).catch(() => { });
                        return cachedResponse;
                    }

                    // Not in cache, fetch from network
                    return fetch(request)
                        .then((response) => {
                            const responseClone = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => {
                                cache.put(request, responseClone);
                            });
                            return response;
                        });
                })
        );
        return;
    }

    // Default: network first
    event.respondWith(
        fetch(request)
            .then((response) => {
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Tienes una nueva notificación',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Gestor de Turnos', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window/tab open
                for (const client of windowClients) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Background sync (for future offline capability)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-appointments') {
        event.waitUntil(syncAppointments());
    }
});

async function syncAppointments() {
    // Future: sync offline appointments when back online
    console.log('[SW] Syncing appointments...');
}
