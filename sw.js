// sw.js - Service Worker CORRIGIDO
const CACHE_NAME = 'super-agente-v2';
const ASSETS_TO_CACHE = [
  '/super-agente-mng-nice/',
  '/super-agente-mng-nice/index.html',
  '/super-agente-mng-nice/manifest.json',
  '/super-agente-mng-nice/icon.png'
  // Adicione outros assets importantes
];

// ⚠️ IMPORTANTE: GitHub Pages requer escopo específico
const SCOPE = self.registration.scope || '/super-agente-mng-nice/';

// Instalar
self.addEventListener('install', (e) => {
  console.log('[SW] Install event:', SCOPE);
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cache aberto:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('[SW] Todos os recursos cacheados');
      return self.skipWaiting();
    }).catch(err => {
      console.error('[SW] Erro ao cachear:', err);
    })
  );
});

// Ativar
self.addEventListener('activate', (e) => {
  console.log('[SW] Ativado');
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Mantém apenas o cache atual
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch - CORRIGIDO para SPA (Single Page Application)
self.addEventListener('fetch', (e) => {
  // Ignora requisições não-GET e do Firebase
  if (e.request.method !== 'GET' || 
      e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Para navegação SPA, sempre retorne index.html
      if (e.request.mode === 'navigate') {
        return caches.match('/super-agente-mng-nice/index.html')
          .then(response => response || fetch(e.request));
      }

      // Para outros recursos
      if (cachedResponse) {
        console.log('[SW] Cache hit:', e.request.url);
        return cachedResponse;
      }

      return fetch(e.request).then(networkResponse => {
        // Não cachear respostas inválidas
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clone a resposta para cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback para página offline
        if (e.request.mode === 'navigate') {
          return caches.match('/super-agente-mng-nice/index.html');
        }
        // Para imagens, pode retornar um fallback
        if (e.request.destination === 'image') {
          // return caches.match('/super-agente-mng-nice/offline.png');
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Mensagem para pular espera
self.addEventListener('message', (e) => {
  if (e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});