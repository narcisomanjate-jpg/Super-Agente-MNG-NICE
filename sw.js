// sw.js - Service Worker ATUALIZADO
const CACHE_NAME = 'super-agente-v' + new Date().getTime(); // AUTO-VERSION

// Instalar
self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

// Ativar
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(r => 
      r || fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
    )
  );
});

// ⭐⭐ ESSA PARTE FALTAVA NO SEU CÓDIGO - CAUSA DO PROBLEMA ⭐⭐
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});