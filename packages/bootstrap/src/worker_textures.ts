/// <reference lib="webworker" />

import Loglevel from "loglevel";

import { attachMultiRouter } from "@personalidol/framework/src/attachMultiRouter";
import { createReusedResponsesCache } from "@personalidol/framework/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/framework/src/createReusedResponsesUsage";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { keyFromTextureRequest } from "@personalidol/texture-loader/src/keyFromTextureRequest";
import { monitorResponseProgress } from "@personalidol/framework/src/monitorResponseProgress";
import { Progress } from "@personalidol/framework/src/Progress";
import { reuseResponse } from "@personalidol/framework/src/reuseResponse";

import type { MessageWorkerReady } from "@personalidol/framework/src/MessageWorkerReady.type";
import type { Progress as IProgress } from "@personalidol/framework/src/Progress.interface";
import type { ReusedResponsesCache } from "@personalidol/framework/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/framework/src/ReusedResponsesUsage.type";
import type { TextureRequest } from "@personalidol/texture-loader/src/TextureRequest.type";

declare var self: DedicatedWorkerGlobalScope;

type CreateImageBitmapOptions = {
  imageOrientation: "none" | "flipY";
};

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

let _progressMessagePort: null | MessagePort = null;
const createImageBitmapOptions: CreateImageBitmapOptions = {
  imageOrientation: "flipY",
};
const emptyTransferables: [] = [];
const loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();

function _createImageBitmapFlipY(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, createImageBitmapOptions);
}

function _fetchImageBitmap(progress: IProgress, textureRequest: TextureRequest): Promise<ImageBitmap> {
  return fetch(textureRequest.textureUrl).then(monitorResponseProgress(progress.progress, true)).then(_responseToBlob).then(_createImageBitmapFlipY);
}

async function _fetchImageBitmapWithProgress(textureRequest: TextureRequest): Promise<ImageBitmap> {
  if (null === _progressMessagePort) {
    throw new Error(`Progress message port must be set in WORKER(${self.name}) before loading texture.`);
  }

  const progress = Progress(_progressMessagePort, "texture", textureRequest.textureUrl);

  return progress.wait(_fetchImageBitmap(progress, textureRequest));
}

function _responseToBlob(response: Response): Promise<Blob> {
  return response.blob();
}

const textureMessagesRouter = {
  async createImageBitmap(messagePort: MessagePort, textureRequest: TextureRequest): Promise<void> {
    const imageBitmap = await reuseResponse(loadingCache, loadingUsage, keyFromTextureRequest(textureRequest), textureRequest, _fetchImageBitmapWithProgress);

    // prettier-ignore
    messagePort.postMessage(
      {
        imageBitmap: {
          imageBitmap: imageBitmap.data,
          rpc: textureRequest.rpc,
        },
      },
      // Transfer the last one to not occupy more memory than necessary.
      imageBitmap.isLast
        ? [imageBitmap.data]
        : emptyTransferables
    );
  },
};

self.onmessage = createRouter({
  progressMessagePort(port: MessagePort): void {
    if (null !== _progressMessagePort) {
      throw new Error(`Progress message port was already received by WORKER(${self.name}).`);
    }

    _progressMessagePort = port;
  },

  ready(): void {
    self.postMessage(<MessageWorkerReady>{
      ready: true,
    });
  },

  texturesMessagePort(port: MessagePort): void {
    attachMultiRouter(port, textureMessagesRouter);
  },
});
