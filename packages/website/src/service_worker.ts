/// <reference lib="webworker" />

import Loglevel from "loglevel";

import { preloadedContent } from "./preloadedContent";

// import workers from "./workers.json";

declare var clients: Clients;
declare var self: ServiceWorkerGlobalScope;

const logger = Loglevel.getLogger("service_worker");

logger.setLevel(__LOG_LEVEL);

// Keeping __BUILD_ID somewhere is actually quite important, as it would reload
// the service worker after code changes.
logger.debug(`SERVICE_WORKER_SPAWNED("${__BUILD_ID}")`);

function _shouldCache(event: FetchEvent): boolean {
  const url = new URL(event.request.url);

  // Caching breaks wasm sometimes for some reason.
  if (url.pathname.endsWith(".wasm")) {
    return false;
  }

  return event.request.url.endsWith(__CACHE_BUST) || url.pathname.endsWith(`${__BUILD_ID}.js`);
}

self.addEventListener("activate", function (event: ExtendableEvent) {
  event.waitUntil(_activate(event));
});

self.addEventListener("fetch", async function (event: FetchEvent) {
  event.respondWith(
    caches.open(__BUILD_ID).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        if (response) {
          return response;
        }

        return fetch(event.request).then(function (response) {
          if (_shouldCache(event)) {
            cache.put(event.request, response.clone());
          }

          return response;
        });
      });
    })
  );
});

self.addEventListener("install", async function (event: ExtendableEvent) {
  event.waitUntil(_install(event));
});

async function _clearOutdatedCache(cacheName: string): Promise<void> {
  if (__BUILD_ID !== cacheName) {
    await caches.delete(cacheName);
  }
}

async function _activate(event: ExtendableEvent): Promise<void> {
  await self.clients.claim();

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(_clearOutdatedCache));
}

async function _install(event: ExtendableEvent): Promise<void> {
  self.skipWaiting();

  event.waitUntil(
    caches.open(__BUILD_ID).then(function (cache) {
      return cache.addAll(Object.values(preloadedContent));
    })
  );
}
