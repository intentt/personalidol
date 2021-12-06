import { DOMTextureService } from "@personalidol/texture-loader/src/DOMTextureService";
import { isCreateImageBitmapSupported } from "@personalidol/framework/src/isCreateImageBitmapSupported";
import { prefetch } from "@personalidol/framework/src/prefetch";
import { WorkerServiceClient } from "@personalidol/framework/src/WorkerServiceClient";

import { workers } from "./workers";

import type { Logger } from "loglevel";

import type { MainLoop } from "@personalidol/framework/src/MainLoop.interface";
import type { RegistersMessagePort } from "@personalidol/framework/src/RegistersMessagePort.interface";
import type { ServiceManager } from "@personalidol/framework/src/ServiceManager.interface";

export async function createTexturesService(
  logger: Logger,
  mainLoop: MainLoop<number | ReturnType<typeof setTimeout>>,
  serviceManager: ServiceManager,
  progressMessagePort: MessagePort,
  websiteToProgressMessagePort: MessagePort
): Promise<RegistersMessagePort> {
  const textureCanvas = document.createElement("canvas");
  const textureCanvasContext2D = textureCanvas.getContext("2d");

  if (null === textureCanvasContext2D) {
    throw new Error("Unable to get detached canvas 2D context.");
  }

  return (async function () {
    if (await isCreateImageBitmapSupported()) {
      logger.debug("SUPPORTED(createImageBitmap) // offload texture service to a worker thread");

      await prefetch(logger, websiteToProgressMessagePort, "worker", workers.textures.url);

      const texturesWorker = new Worker(workers.textures.url, {
        credentials: "same-origin",
        name: workers.textures.name,
        type: "module",
      });

      const texturesWorkerServiceClient = WorkerServiceClient(texturesWorker, workers.textures.name);
      await texturesWorkerServiceClient.ready();

      texturesWorker.postMessage(
        {
          progressMessagePort: progressMessagePort,
        },
        [progressMessagePort]
      );

      return Object.freeze({
        thread: "worker" as const,
        registerMessagePort(messagePort: MessagePort) {
          texturesWorker.postMessage(
            {
              texturesMessagePort: messagePort,
            },
            [messagePort]
          );
        },
      });
    } else {
      logger.debug("NO_SUPPORT(createImageBitmap) // starting texture service in the main thread");

      const textureService = DOMTextureService(textureCanvas, textureCanvasContext2D, progressMessagePort);

      mainLoop.updatables.add(textureService);
      serviceManager.services.add(textureService);

      return textureService;
    }
  })();
}
