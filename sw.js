// sw.js - Service Worker PERSONALIZADO para narcisomanjate-jpg
const CACHE_NAME = 'super-agente-v2';

// Caminhos atualizados para refletir a pasta /icons/ e o repositório
const ASSETS_TO_CACHE = [
  '/super-agente-mng-nice/',
  '/super-agente-mng-nice/index.html',
  '/super-agente-mng-nice/icons/site.webmanifest',
  '/super-agente-mng-nice/icons/android-chrome-192x192.png',
  '/super-agente-mng-nice/icons/android-chrome-512x512.png',
  '/super-agente-mng-nice/icons/apple-touch-icon.png',
  '/super-agente-mng-nice/icons/favicon-32x32.png',
  '/super-agente-mng-nice/icons/favicon-16x16.png'
];

const SCOPE = '/super-agente-mng-nice/';

// Instalar
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cache aberto:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    }).catch(err => {
      console.error('[SW] Erro ao cachear recursos:', err);
    })
  );
});

// Ativar
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch - Suporte para SPA e Cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || 
      e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (e.request.mode === 'navigate') {
        return caches.match('/super-agente-mng-nice/index.html')
          .then(response => response || fetch(e.request));
      }

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/super-agente-mng-nice/index.html');
        }
      });
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});