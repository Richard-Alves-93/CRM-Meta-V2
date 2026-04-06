// PWA Service Worker
const CACHE_NAME = 'crm-pwa-cache-v2'; // Bumped version to force activation

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força a instalação imediata da nova versão
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Deleta todo e qualquer cache antigo
          }
        })
      );
    })
  );
  self.clients.claim(); // Força os clientes ativos a usarem esta versão imediatamente
});

self.addEventListener('fetch', (event) => {
  // Estratégia: Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a requisição de rede funcionar, atualize o cache também com as rotas que não sejam API
        if (event.request.method === 'GET' && !event.request.url.includes('/api/')) {
           const responseClone = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, responseClone);
           });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se falhar (offline), tenta buscar no cache
        return caches.match(event.request);
      })
  );
});
