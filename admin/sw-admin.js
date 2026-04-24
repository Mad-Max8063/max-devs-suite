/**
 * sw-admin.js — Suito Admin Service Worker
 * Basic service worker for PWA support in the Admin panel.
 * Currently provides offline fallback for the app shell.
 */

const CACHE_NAME = 'suito-admin-v1';
const ASSETS_TO_CACHE = [
    './',
    './dashboard-v2029.html',
    './styles.css',
    './app.js',
    './clients.js',
    './auth.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
