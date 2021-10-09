import { attachMultiRouter } from "@personalidol/framework/src/attachMultiRouter";
import { createReusedResponsesCache } from "@personalidol/framework/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/framework/src/createReusedResponsesUsage";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { createRPCLookupTable } from "@personalidol/framework/src/createRPCLookupTable";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { handleRPCResponse } from "@personalidol/framework/src/handleRPCResponse";
import { isPowerOfTwo } from "@personalidol/math/src/isPowerOfTwo";
import { reuseResponse } from "@personalidol/framework/src/reuseResponse";

import { imageDataBufferResponseToImageData } from "./imageDataBufferResponseToImageData";
import { isImageBitmap } from "./isImageBitmap";
import { isImageData } from "./isImageData";
import { requestTexture } from "./requestTexture";

import type { Logger } from "loglevel";

import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { ReusedResponsesCache } from "@personalidol/framework/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/framework/src/ReusedResponsesUsage.type";
import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";
import type { RPCMessage } from "@personalidol/framework/src/RPCMessage.type";

import type { Atlas } from "./Atlas.type";
import type { AtlasResponse } from "./AtlasResponse.type";
import type { AtlasService as IAtlasService } from "./AtlasService.interface";
import type { AtlasTextureDimension } from "./AtlasTextureDimension.type";
import type { AtlasTextureDimensions } from "./AtlasTextureDimensions.type";
import type { ImageBitmapResponse } from "./ImageBitmapResponse.type";
import type { ImageDataBufferResponse } from "./ImageDataBufferResponse.type";

type AtlasQueueItem = RPCMessage & {
  messagePort: MessagePort;
  textureUrls: ReadonlyArray<string>;
};

// type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Context2D = CanvasRenderingContext2D;

type CreateAtlasTextureRequest = RPCMessage & {
  textureUrls: ReadonlyArray<string>;
};

const _pendingRequests: Set<AtlasQueueItem> = new Set();
const _emptyTransferables: [] = [];
const _loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const _loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();
const _rpcLookupTable: RPCLookupTable = createRPCLookupTable();

const _texturesMessageRouter = createRouter({
  imageBitmap: handleRPCResponse<ImageBitmapResponse, void>(_rpcLookupTable, _onImageBitmap),

  imageData: handleRPCResponse<ImageDataBufferResponse, void>(_rpcLookupTable, imageDataBufferResponseToImageData),
});

/**
 * Both cases (ImageBitmap and ImageData) need to be handled because of browser
 * support. Texture might be coming either from a texture worker which uses
 * `createImageData` or from the DOM service that uses another canvas to draw
 * an image.
 *
 * @see requestTexture
 */
function _drawAtlasTexture(
  context2D: Context2D,
  texture: ImageBitmap | ImageData,
  textureDimension: AtlasTextureDimension
): void {
  if (isImageBitmap(texture)) {
    // prettier-ignore
    context2D.drawImage(
      texture,

      0, 0,
      textureDimension.width, textureDimension.height,

      textureDimension.atlasLeft, textureDimension.atlasTop,
      textureDimension.width, textureDimension.height
    );

    return;
  }

  if (isImageData(texture)) {
    // prettier-ignore
    context2D.putImageData(
      texture,

      textureDimension.atlasLeft, textureDimension.atlasTop,

      0, 0,
      textureDimension.width, textureDimension.height
    );

    return;
  }

  throw new Error("Unknown image type.");
}

function _getAtlasSideLength(itemsNumber: number): number {
  if (itemsNumber < 1) {
    throw new Error("Can't create texture atlas from 0 textures.");
  }

  return Math.pow(2, Math.ceil(Math.log2(itemsNumber) / 2 + 1) - 1);
}

function _keyFromAtlasQueueItem(atlasQueueItem: AtlasQueueItem): string {
  return atlasQueueItem.textureUrls.join();
}

function _onImageBitmap({ imageBitmap }: ImageBitmapResponse): ImageBitmap {
  return imageBitmap;
}

export function AtlasService(
  logger: Logger,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context2D: Context2D,
  progressMessagePort: MessagePort,
  texturesMessagePort: MessagePort
): IAtlasService {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  let _isProcessingRequest: boolean = false;

  const _messagesRouter = {
    createTextureAtlas(messagePort: MessagePort, { textureUrls, rpc }: CreateAtlasTextureRequest): void {
      if (textureUrls.length < 1) {
        throw new Error("Can't create texture atlas from 0 textures.");
      }

      _pendingRequests.add({
        messagePort: messagePort,
        rpc: rpc,
        textureUrls: textureUrls,
      });

      _processAtlasQueue();
    },
  };

  function _processAtlasQueue(): void {
    if (_isProcessingRequest) {
      return;
    }

    for (let request of _pendingRequests) {
      _pendingRequests.delete(request);
      _processAtlasRequest(request);
      break;
    }
  }

  function registerMessagePort(messagePort: MessagePort) {
    attachMultiRouter(messagePort, _messagesRouter);
  }

  function start() {
    texturesMessagePort.onmessage = _texturesMessageRouter;
  }

  function stop() {
    texturesMessagePort.onmessage = null;
  }

  /**
   * Textures must be the same size and have other constraints, because I
   * didn't want to go into texture packing / optimization algorithms. Packing
   * everything into the POT square is enough here.
   *
   * Example atlas with 4 textures:
   * Each texture is flipped vertically.
   *
   * +-------+-------+  UVs:
   * |       |       |  0: (0.0, 0.0) - (0.5, 0.5)
   * |       |       |  1: (0.5, 0.0) - (1.0, 0.5)
   * | 2     | 3     |  2: (0.0, 0.5) - (0.5, 1.0)
   * +-------+-------+  3: (0.5, 0.5) - (1.0, 1.0)
   * |       |       |
   * |       |       |
   * | 0     | 1     |
   * +-------+-------+
   */
  async function _createTextureAtlas(request: AtlasQueueItem): Promise<Atlas> {
    logger.debug(`ATLAS_SERVICE.CREATE_TEXTURE_ATLAS.PRE_TEXTURES("${request.textureUrls.join('","')}")`)

    const textures = [];

    for (let textureUrl of request.textureUrls) {
      logger.debug(`ATLAS_SERVICE.CREATE_TEXTURE_ATLAS.TEXTURE("${textureUrl}")`)
      textures.push(await _requestTexture(textureUrl));
    }

    // const textures = await Promise.all(request.textureUrls.map(_requestTexture));
    logger.debug(`ATLAS_SERVICE.CREATE_TEXTURE_ATLAS.POST_TEXTURES("${request.textureUrls.join('","')}")`)

    const textureSize = textures[0].height;
    const width = textures[0].width;

    if (textureSize !== width) {
      throw new Error("Texture sides must be of equal length.");
    }

    if (!isPowerOfTwo(textureSize)) {
      throw new Error("Texture size must be a power of two.");
    }

    let i = 0;

    for (i = 0; i < textures.length; i += 1) {
      if (textures[i].height !== textureSize && textures[i].width !== width) {
        throw new Error(
          `All textures must be of equal size. "${request.textureUrls[i]}" stands out with "${textures[i].width}x${textures[i].height}" vs "${width}x${textureSize}".`
        );
      }
    }

    const atlasSideLength: number = _getAtlasSideLength(textures.length);
    const atlasSideLengthPx: number = atlasSideLength * textureSize;

    // @ts-ignore OffscreenCanvas is experimental
    canvas.height = atlasSideLengthPx;
    // @ts-ignore OffscreenCanvas is experimental
    canvas.width = atlasSideLengthPx;

    // Reset canvas to pure black first to remove previous textures.
    context2D.clearRect(0, 0, atlasSideLengthPx, atlasSideLengthPx);

    i = 0;

    const textureDimensions: AtlasTextureDimensions = {};

    for (let y = atlasSideLength - 1; y >= 0; y -= 1) {
      for (let x = 0; x < atlasSideLength; x += 1) {
        if (i >= textures.length) {
          break;
        }

        const texture = textures[i];

        const atlasLeft = x * textureSize;
        const atlasTop = y * textureSize;

        const textureDimension: AtlasTextureDimension = {
          atlasLeft: atlasLeft,
          atlasTop: atlasTop,
          height: textureSize,
          width: textureSize,

          uvStartU: atlasLeft / atlasSideLengthPx,
          uvStopU: (atlasLeft + textureSize) / atlasSideLengthPx,

          uvStartV: (atlasTop + textureSize) / atlasSideLengthPx,
          uvStopV: atlasTop / atlasSideLengthPx,
        };

        const textureUrl = request.textureUrls[i];

        textureDimensions[textureUrl] = textureDimension;

        _drawAtlasTexture(context2D, texture, textureDimension);

        i += 1;
      }
    }

    return {
      imageData: context2D.getImageData(0, 0, atlasSideLengthPx, atlasSideLengthPx),
      textureDimensions: textureDimensions,
    };
  }

  async function _processAtlasRequest(request: AtlasQueueItem): Promise<void> {
    if (_isProcessingRequest) {
      throw new Error("AtlasService is already processing another request.");
    }

    _isProcessingRequest = true;

    const requestKey = _keyFromAtlasQueueItem(request);
    const { data: response, isLast } = await reuseResponse<Atlas, AtlasQueueItem>(
      _loadingCache,
      _loadingUsage,
      requestKey,
      request,
      _createTextureAtlas
    );
    const { imageData, textureDimensions } = response;

    request.messagePort.postMessage(
      {
        textureAtlas: <AtlasResponse>{
          imageDataBuffer: imageData.data.buffer,
          imageDataHeight: imageData.height,
          imageDataWidth: imageData.width,
          textureDimensions: textureDimensions,
          rpc: request.rpc,
        },
      },
      isLast ? [imageData.data.buffer] : _emptyTransferables
    );

    _isProcessingRequest = false;
    _processAtlasQueue();
  }

  function _requestTexture(textureUrl: string): Promise<ImageBitmap | ImageData> {
    return requestTexture(_rpcLookupTable, texturesMessagePort, textureUrl);
  }

  return Object.freeze({
    id: generateUUID(),
    name: "AtlasService",
    state: state,

    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
  });
}
