/* Malediction Deck Builder - Service Worker
 *
 * Estratégia:
 *  - Página (HTML): network-first, com fallback para o cache (funciona offline e
 *    pega atualizações automaticamente quando online).
 *  - Ícones/manifest: pré-cache.
 *  - Imagens das cartas (jpg/png/webp): cache sob demanda (cache-first). Só o que o
 *    usuário já viu fica offline; sem isso o app usa as miniaturas embutidas no HTML.
 *
 * Quando mudar manifest/ícones, aumente CACHE_VERSION.
 */
const CACHE_VERSION = 'v3';
const CORE_CACHE = `mdb-core-${CACHE_VERSION}`;
const IMG_CACHE = 'mdb-card-images';   // não versionado: preserva imagens entre atualizações
const MAX_IMAGES = 250;                // limite de imagens guardadas (as mais antigas saem primeiro)

const CORE_ASSETS = [
  './',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('mdb-core-') && k !== CORE_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

const IMAGE_RE = /\.(?:jpe?g|png|webp|gif|avif|svg)$/i;

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function handleNavigation(request) {
  const cache = await caches.open(CORE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put('./', response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match('./', { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function handleImage(request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);          // se falhar offline, o app usa a miniatura
  if (response && response.ok) {
    await cache.put(request, response.clone());
    trimCache(IMG_CACHE, MAX_IMAGES);
  }
  return response;
}

async function handleStatic(request) {
  const cache = await caches.open(CORE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // não mexe em requisições externas

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else if (request.destination === 'image' || IMAGE_RE.test(url.pathname)) {
    event.respondWith(handleImage(request));
  } else {
    event.respondWith(handleStatic(request));
  }
});
