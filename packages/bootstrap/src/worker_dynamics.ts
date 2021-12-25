/// <reference lib="webworker" />
/// <reference types="@types/ammo.js" />

import Loglevel from "loglevel";

import { AmmoLoader } from "../../ammo/src/AmmoLoader";
import { createRouter } from "../../framework/src/createRouter";
import { DynamicsMainLoopTicker } from "../../dynamics/src/DynamicsMainLoopTicker";
import { DynamicsWorld } from "../../dynamics/src/DynamicsWorld";
import { DynamicsWorldStatsHook } from "../../dynamics/src/DynamicsWorldStatsHook";
import { FallbackScheduler } from "../../framework/src/FallbackScheduler";
import { MainLoop } from "../../framework/src/MainLoop";
import { MainLoopStatsHook } from "../../framework/src/MainLoopStatsHook";
import { prefetch } from "../../framework/src/prefetch";
import { ServiceBuilder } from "../../framework/src/ServiceBuilder";
import { ServiceManager } from "../../framework/src/ServiceManager";
import { SimulantFactory } from "../../personalidol/src/SimulantFactory";
import { StatsReporter } from "../../framework/src/StatsReporter";

import type { MainLoop as IMainLoop } from "../../framework/src/MainLoop.interface";
import type { MessageWorkerReady } from "../../framework/src/MessageWorkerReady.type";
import type { ServiceBuilder as IServiceBuilder } from "../../framework/src/ServiceBuilder.interface";
import type { ServiceManager as IServiceManager } from "../../framework/src/ServiceManager.interface";
import type { SimulantsLookup } from "../../personalidol/src/SimulantsLookup.type";

declare var self: DedicatedWorkerGlobalScope;

importScripts(`${__STATIC_BASE_PATH}/lib/ammo.wasm.js?${__CACHE_BUST}`);

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

const AMMO_WASM_WASM_URL: string = `${__STATIC_BASE_PATH}/lib/ammo.wasm.wasm?${__CACHE_BUST}`;
const logger = Loglevel.getLogger(self.name);

// If the FallbackScheduler uses `setTimeout`, then it would be ok to sample
// time twice as often as the dynamics loop should update.
// See: Nyquist–Shannon–Kotelnikov sampling theorem.
const mainLoop: IMainLoop<number | ReturnType<typeof setTimeout>> = MainLoop(
  logger,
  FallbackScheduler(1000 / 120),
  DynamicsMainLoopTicker(logger, 1 / 60)
);

const serviceManager: IServiceManager = ServiceManager(logger);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const ammoLoader = AmmoLoader(AMMO_WASM_WASM_URL);
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
    await prefetch(logger, port, "worker", AMMO_WASM_WASM_URL);
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
