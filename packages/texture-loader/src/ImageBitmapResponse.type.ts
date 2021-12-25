import type { RPCMessage } from "../../framework/src/RPCMessage.type";

export type ImageBitmapResponse = RPCMessage & {
  imageBitmap: ImageBitmap;
};
