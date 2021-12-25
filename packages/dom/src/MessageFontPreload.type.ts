import type { FontPreloadParameters } from "./FontPreloadParameters.type";
import type { RPCMessage } from "../../framework/src/RPCMessage.type";

export type MessageFontPreload = {
  preloadFont: FontPreloadParameters & RPCMessage;
};
