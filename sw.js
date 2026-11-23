const CACHE_NAME = "malediction-pwa-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./malediction-deck-builder.html"
];

// Instalação
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de versões antigas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) =>
            key.startsWith("malediction-pwa-") &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Interceptação das requisições
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não interceptar requisições externas.
  if (url.origin !== self.location.origin) return;

  // Navegação: tenta a rede e usa o cache se estiver offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put("./index.html", copy));

          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html")
          );
        })
    );

    return;
  }

  // Arquivos locais: cache primeiro, rede depois.
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
          }

          return response;
        });
      })
  );
});
