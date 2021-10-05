/// <reference lib="webworker" />

import Loglevel from "loglevel";

// import workers from "./workers.json";

declare var clients: Clients;
declare var self: ServiceWorkerGlobalScope;

const logger = Loglevel.getLogger("service_worker");

logger.setLevel(__LOG_LEVEL);

// Keeping __BUILD_ID somewhere is actually quite important, as it would reload
// the service worker after code changes.
logger.debug(`SERVICE_WORKER_SPAWNED("${__BUILD_ID}")`);

self.addEventListener("activate", function (event: ExtendableEvent) {
  event.waitUntil(_activate(event));
});

self.addEventListener("install", async function (event: ExtendableEvent) {
  event.waitUntil(_install(event));
});

async function _activate(event: ExtendableEvent): Promise<void> {
  await self.clients.claim();
}

async function _install(event: ExtendableEvent): Promise<void> {
  self.skipWaiting();
}
