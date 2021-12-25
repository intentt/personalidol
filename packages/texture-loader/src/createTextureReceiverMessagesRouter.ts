import { createRouter } from "../../framework/src/createRouter";
import { handleRPCResponse } from "../../framework/src/handleRPCResponse";

import { imageDataBufferResponseToTexture } from "./imageDataBufferResponseToTexture";
import { imageToTexture } from "./imageToTexture";

import type { Texture as ITexture } from "three";

import type { RPCLookupTable } from "../../framework/src/RPCLookupTable.type";

import type { ImageBitmapResponse } from "./ImageBitmapResponse.type";
import type { ImageDataBufferResponse } from "./ImageDataBufferResponse.type";

function _onImageBitmap({ imageBitmap }: ImageBitmapResponse) {
  return imageToTexture(imageBitmap);
}

export function createTextureReceiverMessagesRouter(rpcLookupTable: RPCLookupTable) {
  return createRouter({
    imageBitmap: handleRPCResponse<ImageBitmapResponse, ITexture>(rpcLookupTable, _onImageBitmap),

    imageData: handleRPCResponse<ImageDataBufferResponse, ITexture>(rpcLookupTable, imageDataBufferResponseToTexture),
  });
}
