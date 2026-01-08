const CACHE_NAME = 'agente-mng-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((res) => {
        const copy = res.clone();
        if (event.request.url.includes('esm.sh') || event.request.url.includes('cdn')) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return res;
      });
    }).catch(() => event.request.mode === 'navigate' ? caches.match('/') : null)
  );
});