/// <reference lib="webworker" />
/// <reference types="@types/ammo.js" />

import Loglevel from "loglevel";

import { AmmoLoader } from "@personalidol/ammo/src/AmmoLoader";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { DynamicsMainLoopTicker } from "@personalidol/dynamics/src/DynamicsMainLoopTicker";
import { DynamicsWorld } from "@personalidol/dynamics/src/DynamicsWorld";
import { DynamicsWorldStatsHook } from "@personalidol/dynamics/src/DynamicsWorldStatsHook";
import { FallbackScheduler } from "@personalidol/framework/src/FallbackScheduler";
import { MainLoop } from "@personalidol/framework/src/MainLoop";
import { MainLoopStatsHook } from "@personalidol/framework/src/MainLoopStatsHook";
import { prefetch } from "@personalidol/framework/src/prefetch";
import { ServiceBuilder } from "@personalidol/framework/src/ServiceBuilder";
import { ServiceManager } from "@personalidol/framework/src/ServiceManager";
import { SimulantFactory } from "@personalidol/personalidol/src/SimulantFactory";
import { StatsReporter } from "@personalidol/framework/src/StatsReporter";

import type { MainLoop as IMainLoop } from "@personalidol/framework/src/MainLoop.interface";
import type { MessageWorkerReady } from "@personalidol/framework/src/MessageWorkerReady.type";
import type { ServiceBuilder as IServiceBuilder } from "@personalidol/framework/src/ServiceBuilder.interface";
import type { ServiceManager as IServiceManager } from "@personalidol/framework/src/ServiceManager.interface";
import type { SimulantsLookup } from "@personalidol/personalidol/src/SimulantsLookup.type";

declare var self: DedicatedWorkerGlobalScope;

type Dependencies = {
  ammo: typeof Ammo;
  dynamicsMessagePort: MessagePort;
  progressMessagePort: MessagePort;
  statsMessagePort: MessagePort;
};

const partialDependencies: Partial<Dependencies> = {
  ammo: undefined,
  dynamicsMessagePort: undefined,
  progressMessagePort: undefined,
  statsMessagePort: undefined,
};

const AMMO_WASM_URL: string = `${__STATIC_BASE_PATH}/lib/ammo.wasm.wasm?${__CACHE_BUST}`;
const logger = Loglevel.getLogger(self.name);

// If the FallbackScheduler uses `setTimeout`, then it would be ok to sample
// time twice as often as the dynamics loop should update.
// See: Nyquist–Shannon–Kotelnikov sampling theorem.
const mainLoop: IMainLoop<number | ReturnType<typeof setTimeout>> = MainLoop(logger, FallbackScheduler(1000 / 120), DynamicsMainLoopTicker(logger, 1 / 60));

const serviceManager: IServiceManager = ServiceManager(logger);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const ammoLoader = AmmoLoader(AMMO_WASM_URL);
const serviceBuilder: IServiceBuilder<Dependencies> = ServiceBuilder<Dependencies>(self.name, partialDependencies);

serviceBuilder.onready.add(onDependenciesReady);

function onDependenciesReady(dependencies: Dependencies): void {
  const dynamicsWorld = DynamicsWorld<SimulantsLookup>(
    logger,
    dependencies.ammo,
    SimulantFactory<SimulantsLookup>(),
    mainLoop.ticker.tickTimerState,
    dependencies.dynamicsMessagePort,
    dependencies.progressMessagePort
  );

  mainLoop.updatables.add(dynamicsWorld);
  serviceManager.services.add(dynamicsWorld);

  const statsReporter = StatsReporter(self.name, dependencies.statsMessagePort, mainLoop.ticker.tickTimerState);

  statsReporter.hooks.add(DynamicsWorldStatsHook(dynamicsWorld));
  statsReporter.hooks.add(MainLoopStatsHook(mainLoop));

  mainLoop.updatables.add(statsReporter);
  serviceManager.services.add(statsReporter);
}

function notifyReady(): void {
  self.postMessage(<MessageWorkerReady>{
    ready: true,
  });
}

self.onmessage = createRouter({
  dynamicsMessagePort(port: MessagePort): void {
    serviceBuilder.setDependency("dynamicsMessagePort", port);
  },

  async progressMessagePort(port: MessagePort): Promise<void> {
    serviceBuilder.setDependency("progressMessagePort", port);
    await prefetch(port, "worker", AMMO_WASM_URL);
    serviceBuilder.setDependency("ammo", await ammoLoader.loadWASM());
  },

  statsMessagePort(port: MessagePort): void {
    serviceBuilder.setDependency("statsMessagePort", port);
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
    mainLoop.start();
    serviceManager.start();
  },

  stop(): void {
    mainLoop.stop();
    serviceManager.stop();
  },
});
