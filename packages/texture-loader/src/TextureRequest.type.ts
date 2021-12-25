import type { RPCMessage } from "../../framework/src/RPCMessage.type";

export type TextureRequest = RPCMessage & {
  textureUrl: string;
};
