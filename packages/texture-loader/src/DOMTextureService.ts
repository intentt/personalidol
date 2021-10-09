import { attachMultiRouter } from "@personalidol/framework/src/attachMultiRouter";
import { createReusedResponsesCache } from "@personalidol/framework/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/framework/src/createReusedResponsesUsage";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { preloadImage } from "@personalidol/dom/src/preloadImage";
import { Progress } from "@personalidol/framework/src/Progress";
import { reuseResponse } from "@personalidol/framework/src/reuseResponse";

import { canvas2DDrawImage } from "./canvas2DDrawImage";
import { keyFromTextureRequest } from "./keyFromTextureRequest";

import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { Progress as IProgress } from "@personalidol/framework/src/Progress.interface";
import type { ReusedResponsesCache } from "@personalidol/framework/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/framework/src/ReusedResponsesUsage.type";

import type { DOMTextureService as IDOMTextureService } from "./DOMTextureService.interface";
import type { ImageDataBufferResponse } from "./ImageDataBufferResponse.type";
import type { TextureRequest } from "./TextureRequest.type";

type TextureQueueItem = TextureRequest & {
  messagePort: MessagePort;
};

const _emptyTransferables: [] = [];
const _loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const _loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();
const _textureQueue: Array<TextureQueueItem> = [];

const _messagesRouter = {
  createImageBitmap(messagePort: MessagePort, textureRequest: TextureRequest): void {
    _textureQueue.push({
      ...textureRequest,
      messagePort: messagePort,
    });
  },
};

export function DOMTextureService(
  canvas: HTMLCanvasElement,
  context2D: CanvasRenderingContext2D,
  progressMessagePort: MessagePort
): IDOMTextureService {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  function registerMessagePort(messagePort: MessagePort) {
    attachMultiRouter(messagePort, _messagesRouter);
  }

  function start() {}

  function stop() {}

  function update() {
    if (_textureQueue.length < 1) {
      return;
    }

    let request = _textureQueue.shift();

    if (!request) {
      throw new Error("Unexpected empty processing request in the texture queue.");
    }

    _processTextureQueue(request);
  }

  async function _createImageData(request: TextureQueueItem): Promise<ImageData> {
    const progress: IProgress = Progress(progressMessagePort, "texture", request.textureUrl);
    const image: HTMLImageElement = await progress.wait(preloadImage(progress, request.textureUrl));

    canvas2DDrawImage(canvas, context2D, image);

    return context2D.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  }

  async function _processTextureQueue(request: TextureQueueItem): Promise<void> {
    const requestKey = keyFromTextureRequest(request);
    const { data: imageData, isLast } = await reuseResponse<ImageData, TextureQueueItem>(
      _loadingCache,
      _loadingUsage,
      requestKey,
      request,
      _createImageData
    );

    request.messagePort.postMessage(
      {
        imageData: <ImageDataBufferResponse>{
          imageDataBuffer: imageData.data.buffer,
          imageDataHeight: imageData.height,
          imageDataWidth: imageData.width,
          rpc: request.rpc,
        },
      },
      isLast ? [imageData.data.buffer] : _emptyTransferables
    );
  }

  return Object.freeze({
    id: generateUUID(),
    name: "DOMTextureService",
    state: state,
    thread: "main" as const,

    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
    update: update,
  });
}
