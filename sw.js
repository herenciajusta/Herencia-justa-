const CACHE_NAME = 'hj-v2';
const OFFLINE_ASSETS = new Set([
  '/',
  '/index.html',
  '/consulta-gratuita.html',
  '/assets/herencia.css',
  '/assets/herencia.js',
  '/assets/herencia-escudo.webp',
  '/assets/cuenca-portada-760.webp',
  '/assets/cuenca-portada.webp',
  '/assets/estudio-penafiel.webp',
  '/assets/estudio-marca.webp',
  '/assets/estudio-oficina.webp',
  '/assets/participacion.webp',
  '/assets/transparencia.webp',
  '/articulos.json',
  '/noticias.json'
]);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...OFFLINE_ASSETS])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('hj-') && key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
});

self.addEventListener('fetch', (event) => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !OFFLINE_ASSETS.has(url.pathname)) return;

  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(url.pathname)) || Response.error();
  }));
});
