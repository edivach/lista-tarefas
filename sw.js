const CACHE_NAME = 'minhas-tarefas-v1';
const ARQUIVOS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;

      return fetch(event.request)
        .then((resposta) => {
          if (resposta && resposta.ok && event.request.url.startsWith(self.location.origin)) {
            const copia = resposta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return resposta;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html').then((cache) => {
              if (cache) {
                notificarOffline();
                return cache;
              }
              return new Response(
                '<h1 style="font-family:sans-serif;text-align:center;margin-top:40vh;color:#7c3aed">📡 Você está offline</h1><p style="font-family:sans-serif;text-align:center">Sem conexão no momento. O app volta quando a internet retornar.</p>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            });
          }
        });
    })
  );
});

async function notificarOffline() {
  const clientes = await self.clients.matchAll({ includeUncontrolled: true });
  clientes.forEach((cliente) => cliente.postMessage({ tipo: 'OFFLINE' }));
}
