/// <reference lib="webworker" />

import Loglevel from "loglevel";

import { AtlasService } from "../../texture-loader/src/AtlasService";
import { createRouter } from "../../framework/src/createRouter";
import { ServiceBuilder } from "../../framework/src/ServiceBuilder";

import type { AtlasService as IAtlasService } from "../../texture-loader/src/AtlasService.interface";
import type { MessageWorkerReady } from "../../framework/src/MessageWorkerReady.type";
import type { ServiceBuilder as IServiceBuilder } from "../../framework/src/ServiceBuilder.interface";

type Dependencies = {
  canvas: OffscreenCanvas;
  // context2d: OffscreenCanvasRenderingContext2D;
  context2d: CanvasRenderingContext2D;
  progressMessagePort: MessagePort;
  statsMessagePort: MessagePort;
  texturesMessagePort: MessagePort;
};

declare var self: DedicatedWorkerGlobalScope;

const partialDependencies: Partial<Dependencies> = {
  canvas: undefined,
  context2d: undefined,
  progressMessagePort: undefined,
  statsMessagePort: undefined,
  texturesMessagePort: undefined,
};

let _atlasService: null | IAtlasService = null;

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const serviceBuilder: IServiceBuilder<Dependencies> = ServiceBuilder<Dependencies>(self.name, partialDependencies);

serviceBuilder.onready.add(onDependenciesReady);

function onDependenciesReady(dependencies: Dependencies): void {
  _atlasService = AtlasService(
    logger,
    dependencies.canvas,
    dependencies.context2d,
    "worker",
    dependencies.progressMessagePort,
    dependencies.texturesMessagePort
  );
}

function notifyReady(): void {
  self.postMessage(<MessageWorkerReady>{
    ready: true,
  });
}

self.onmessage = createRouter({
  // Dependencies

  atlasCanvas(canvas: OffscreenCanvas) {
    serviceBuilder.setDependency("canvas", canvas);

    // @ts-ignore OffscreenCanvas is experimental
    const context2d = canvas.getContext("2d");

    if (!context2d) {
      throw new Error(`Unable to obtain 2D context from the offscreen atlas canvas within WORKER(${self.name}).`);
    }

    // @ts-ignore OffscreenCanvas is experimental
    serviceBuilder.setDependency("context2d", context2d);
  },

  atlasMessagePort(port: MessagePort) {
    if (null === _atlasService) {
      throw new Error(`WORKER("${self.name}"): Atlas service is not ready.`);
    }

    _atlasService.registerMessagePort(port);
  },

  progressMessagePort(port: MessagePort): void {
    serviceBuilder.setDependency("progressMessagePort", port);
  },

  statsMessagePort(port: MessagePort): void {
    serviceBuilder.setDependency("statsMessagePort", port);
  },

  texturesMessagePort(port: MessagePort) {
    serviceBuilder.setDependency("texturesMessagePort", port);
  },

  // WorkerService

  ready(): void {
    if (serviceBuilder.isReady()) {
      notifyReady();
    } else {
      serviceBuilder.onready.add(notifyReady);
    }
  },

  start(): void {
    if (null === _atlasService) {
      throw new Error(`WORKER("${self.name}"): Atlas service is not ready.`);
    }

    _atlasService.start();
  },

  stop(): void {
    if (null === _atlasService) {
      throw new Error(`WORKER("${self.name}"): Atlas service is not ready.`);
    }

    _atlasService.stop();
  },
});
