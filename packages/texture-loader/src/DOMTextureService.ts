import { MathUtils } from "three/src/math/MathUtils";

import { attachMultiRouter } from "@personalidol/workers/src/attachMultiRouter";
import { canvas2DDrawImage } from "@personalidol/dom-renderer/src/canvas2DDrawImage";
import { createReusedResponsesCache } from "@personalidol/workers/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/workers/src/createReusedResponsesUsage";
import { notifyLoadingManager } from "@personalidol/loading-manager/src/notifyLoadingManager";
import { preloadImage } from "@personalidol/dom-renderer/src/preloadImage";
import { reuseResponse } from "@personalidol/workers/src/reuseResponse";

import { keyFromTextureRequest } from "./keyFromTextureRequest";

import type { ReusedResponsesCache } from "@personalidol/workers/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/workers/src/ReusedResponsesUsage.type";

import type { DOMTextureService as IDOMTextureService } from "./DOMTextureService.interface";
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

export function DOMTextureService(canvas: HTMLCanvasElement, context2D: CanvasRenderingContext2D, progressMessagePort: MessagePort): IDOMTextureService {
  function registerMessagePort(messagePort: MessagePort) {
    attachMultiRouter(messagePort, _messagesRouter);
  }

  function start() {}

  function stop() {}

  function update() {
    if (_textureQueue.length < 1) {
      return;
    }

    do {
      let request = _textureQueue.shift();

      if (!request) {
        throw new Error("Unexpected empty processing request in the texture queue.");
      }

      _processTextureQueue(request);
    } while (_textureQueue.length > 0);
  }

  async function _createImageData(request: TextureQueueItem): Promise<ImageData> {
    const image: HTMLImageElement = await preloadImage(request.textureUrl);

    canvas2DDrawImage(canvas, context2D, image);

    return context2D.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  }

  async function _processTextureQueue(request: TextureQueueItem): Promise<void> {
    const requestKey = keyFromTextureRequest(request);
    const loadItemTexture = {
      comment: `texture ${request.textureUrl}`,
      id: MathUtils.generateUUID(),
      weight: 1,
    };
    const textureResponse = reuseResponse<ImageData, TextureQueueItem>(_loadingCache, _loadingUsage, requestKey, request, _createImageData);
    const { data: imageData, isLast } = await notifyLoadingManager(progressMessagePort, loadItemTexture, textureResponse);

    request.messagePort.postMessage(
      {
        imageData: {
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
    name: "DOMTextureService",

    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
    update: update,
  });
}
