const CACHE_NAME = 'agente-mng-v2'; // Incrementado para v2 para forçar atualização
const ASSETS = [
  './',               // Caminho relativo para a raiz da pasta
  'index.html',       // Sem barra inicial
  'index.css',        // Sem barra inicial
  'index.tsx',        // Sem barra inicial
  'manifest.json',    // Sem barra inicial
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
];

// Instalação: Cacheia os recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos .addAll para garantir que todos os itens básicos fiquem offline
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Fetch: Cache First para assets, Network First para o resto
self.addEventListener('fetch', (event) => {
  // Ignora pedidos que não sejam http/https (como extensões ou esquemas chrome-extension)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Se a resposta for válida, fazemos uma cópia para o cache (apenas para libs externas)
        if (networkResponse.ok) {
          const copy = networkResponse.clone();
          const url = event.request.url;

          // Cache dinâmico para bibliotecas do esm.sh e fontes
          if (url.includes('esm.sh') || url.includes('gstatic.com') || url.includes('cdn')) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
        }
        return networkResponse;
      });
    }).catch(() => {
      // Se falhar a rede e não estiver no cache, tenta retornar o index.html para navegação
      if (event.request.mode === 'navigate') {
        return caches.match('./') || caches.match('index.html');
      }
    })
  );
});