import { attachMultiRouter } from "@personalidol/workers/src/attachMultiRouter";
import { createReusedResponsesCache } from "@personalidol/workers/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/workers/src/createReusedResponsesUsage";
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

export function DOMTextureService(canvas: HTMLCanvasElement, context2D: CanvasRenderingContext2D): IDOMTextureService {
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
    const image: HTMLImageElement = await _preloadImage(request.textureUrl);

    const imageNaturalHeight = image.naturalHeight;
    const imageNaturalWidth = image.naturalWidth;

    canvas.height = imageNaturalHeight;
    canvas.width = imageNaturalWidth;

    // It's worth to note here that JS is asynchronous, but while we are in the
    // same thread, there is no risk of several images being written to the
    // canvas at the same time, so no locks are necessary.

    if (!request.flipY) {
      context2D.drawImage(image, 0, 0);

      return context2D.getImageData(0, 0, imageNaturalWidth, imageNaturalHeight);
    }

    context2D.scale(1, -1);
    context2D.drawImage(image, 0, -1 * imageNaturalHeight);

    try {
      return context2D.getImageData(0, 0, imageNaturalWidth, imageNaturalHeight);
    } finally {
      context2D.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  async function _processTextureQueue(request: TextureQueueItem): Promise<void> {
    // prettier-ignore
    const { data: imageData, isLast } = await reuseResponse<ImageData, TextureQueueItem>(
      _loadingCache,
      _loadingUsage,
      keyFromTextureRequest(request),
      request,
      _createImageData
    );

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

  function _preloadImage(textureUrl: string): Promise<HTMLImageElement> {
    return new Promise(function (resolve, reject) {
      const image = new Image();

      image.onerror = reject;
      image.onload = function () {
        resolve(image);
      };

      image.src = textureUrl;
    });
  }

  return Object.freeze({
    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
    update: update,
  });
}