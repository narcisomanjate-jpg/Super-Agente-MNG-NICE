const CACHE_NAME = 'super-agente-cache-v1';
const urlsToCache = [
  '/Super-Agente-MNG-NICE/',
  '/Super-Agente-MNG-NICE/index.html',
  // Adicione todos os seus arquivos CSS, JS, imagens e ícones aqui para cache
  '/Super-Agente-MNG-NICE/style.css', 
  '/Super-Agente-MNG-NICE/script.js', 
  '/Super-Agente-MNG-NICE/icon.webp'
];

// Evento de instalação: abre um cache e adiciona todos os assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch (intercepção de requisições): tenta servir do cache primeiro, depois da rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        if (response) {
          return response;
        }
        // Caso contrário, vai para a rede
        return fetch(event.request);
      })
  );
});

// Evento de ativação: limpa caches antigos se a versão mudar
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
const CACHE_NAME = 'super-agente-cache-v1';
const urlsToCache = [
  '/Super-Agente-MNG-NICE/',
  '/Super-Agente-MNG-NICE/index.html',
  // Adicione todos os seus arquivos CSS, JS, imagens e ícones aqui para cache
  '/Super-Agente-MNG-NICE/style.css', 
  '/Super-Agente-MNG-NICE/script.js', 
  '/Super-Agente-MNG-NICE/icon.webp'
];

// Evento de instalação: abre um cache e adiciona todos os assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch (intercepção de requisições): tenta servir do cache primeiro, depois da rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        if (response) {
          return response;
        }
        // Caso contrário, vai para a rede
        return fetch(event.request);
      })
  );
});

// Evento de ativação: limpa caches antigos se a versão mudar
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
