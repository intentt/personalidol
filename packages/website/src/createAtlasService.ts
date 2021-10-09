import { AtlasService } from "@personalidol/texture-loader/src/AtlasService";
import { isCanvasTransferControlToOffscreenSupported } from "@personalidol/framework/src/isCanvasTransferControlToOffscreenSupported";
import { prefetch } from "@personalidol/framework/src/prefetch";
import { WorkerServiceClient } from "@personalidol/framework/src/WorkerServiceClient";

import { workers } from "./workers";

import type { Logger } from "loglevel";

import type { MainLoop } from "@personalidol/framework/src/MainLoop.interface";
import type { RegistersMessagePort } from "@personalidol/framework/src/RegistersMessagePort.interface";
import type { ServiceManager } from "@personalidol/framework/src/ServiceManager.interface";

export function createAtlasService(
  logger: Logger,
  mainLoop: MainLoop<number | ReturnType<typeof setTimeout>>,
  serviceManager: ServiceManager,
  progressMessagePort: MessagePort,
  statsMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  websiteToProgressMessagePort: MessagePort
): Promise<RegistersMessagePort> {
  const atlasCanvas = document.createElement("canvas");

  return (async function () {
    // "userSettings.useOffscreenCanvas" does not relate to the atlas canvas,
    // because it's a utility worker, not the primary rendering thread.
    if (isCanvasTransferControlToOffscreenSupported()) {
      logger.debug("SUPPORTED(canvas.transferControlToOffscreen) // offlad atlas service to a worker thread");

      // @ts-ignore OffscreenCanvas is experimental
      const offscreenAtlas = atlasCanvas.transferControlToOffscreen();

      await prefetch(websiteToProgressMessagePort, "worker", workers.atlas.url);

      const atlasWorker = new Worker(workers.atlas.url, {
        credentials: "same-origin",
        name: workers.atlas.name,
        type: "module",
      });

      atlasWorker.postMessage(
        {
          atlasCanvas: offscreenAtlas,
          progressMessagePort: progressMessagePort,
          statsMessagePort: statsMessagePort,
          texturesMessagePort: texturesMessagePort,
        },
        [progressMessagePort, statsMessagePort, texturesMessagePort, offscreenAtlas]
      );

      const atlasWorkerServiceClient = WorkerServiceClient(atlasWorker, workers.atlas.name);
      await atlasWorkerServiceClient.ready();

      mainLoop.updatables.add(atlasWorkerServiceClient);
      serviceManager.services.add(atlasWorkerServiceClient);

      return Object.freeze({
        registerMessagePort(messagePort: MessagePort) {
          atlasWorker.postMessage(
            {
              atlasMessagePort: messagePort,
            },
            [messagePort]
          );
        },
      });
    } else {
      logger.debug("NO_SUPPORT(canvas.transferControlToOffscreen) // starting atlas service in the main thread");

      const atlasCanvasContext2D = atlasCanvas.getContext("2d");

      if (null === atlasCanvasContext2D) {
        throw new Error("Unable to get atlas canvas 2D context.");
      }

      const atlasService = AtlasService(logger, atlasCanvas, atlasCanvasContext2D, progressMessagePort, texturesMessagePort);

      serviceManager.services.add(atlasService);

      return atlasService;
    }
  })();
}
