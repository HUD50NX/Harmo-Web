// Harmo Web — guarda o app no aparelho pra abrir rápido (e sem internet, menos a busca/baixar cifra).
const V = 'harmo-web-2';
const FILES = ['./', 'index.html', 'ilustrada.html', 'css/app.css', 'js/core.js', 'js/cifras.js', 'js/teoria.js', 'js/afinador.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  // rede primeiro (atualiza sozinho); sem internet, usa o que está guardado
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
