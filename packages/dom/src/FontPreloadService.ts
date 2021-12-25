/// <reference types="@types/css-font-loading-module" />

import { createRouter } from "../../framework/src/createRouter";
import { generateUUID } from "../../math/src/generateUUID";
import { prefetch } from "../../framework/src/prefetch";

import type { Logger } from "loglevel";

import type { RPCMessage } from "../../framework/src/RPCMessage.type";

import type { FontPreloadService as IFontPreloadService } from "./FontPreloadService.interface";
import type { FontPreloadParameters } from "./FontPreloadParameters.type";

export function FontPreloadService(
  logger: Logger,
  fontPreloadMessagePort: MessagePort,
  progressMessagePort: MessagePort
): IFontPreloadService {
  const _messageHandlers = {
    preloadFont: _preloadFont,
  };

  const _messagesRouter = createRouter(_messageHandlers);

  function start() {
    fontPreloadMessagePort.onmessage = _messagesRouter;
  }

  function stop() {
    fontPreloadMessagePort.onmessage = _messagesRouter;
  }

  async function _preloadFont(parameters: FontPreloadParameters & RPCMessage) {
    await prefetch(logger, progressMessagePort, "font", parameters.source);

    const fontFace = new FontFace(parameters.family, `url(${parameters.source})`, parameters.descriptors);

    await fontFace.load();

    document.fonts.add(fontFace);

    fontPreloadMessagePort.postMessage({
      preloadedFont: parameters,
    });
  }

  return Object.freeze({
    id: generateUUID(),
    name: "FontPreloadService",

    start: start,
    stop: stop,
  });
}
