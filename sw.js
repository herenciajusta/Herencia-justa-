/*
 * Service worker para Herencia Justa
 *
 * Este archivo define un cache básico de recursos estáticos para habilitar
 * el modo offline y mejorar el tiempo de carga. Las peticiones a
 * noticias.json se manejan con una estrategia de stale-while-revalidate: el
 * archivo se sirve desde cache inmediatamente y luego se actualiza
 * silenciosamente cuando hay conexión.
 */

const CACHE_NAME = 'hj-v1';
const ASSETS = [
  '/',
  '/index(14).html',
  '/logo-herencia.png',
  '/site.webmanifest',
  '/config.json'
];

self.addEventListener('install', event => {
  // Precache archivos esenciales
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  // Limpia caches antiguos si fuera necesario
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  // Solo se manejan peticiones GET
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Estrategia específica para noticias.json: stale-while-revalidate
  if (url.pathname.endsWith('noticias.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      const networkFetch = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
      }).catch(() => undefined);
      return cachedResponse || networkFetch;
    })());
    return;
  }
  // Para otros recursos, se intenta cache primero y luego red
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).catch(() => cached);
    })
  );
});