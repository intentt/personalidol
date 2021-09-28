/// <reference lib="webworker" />

import { routeMessages } from "./routeMessages";

import type { MessageEventHandler } from "./MessageEventHandler.type";
import type { MessageEventMetaHandles } from "./MessageEventMetaHandles.type";
import type { MessageEventRouter } from "./MessageEventRouter.type";

export function createRouter(
  router: MessageEventRouter,
  metaHandles: null | MessageEventMetaHandles = null
): MessageEventHandler {
  const onerror = metaHandles && metaHandles.error;

  if ("function" === typeof onerror) {
    return function (evt: ExtendableMessageEvent | MessageEvent): void {
      try {
        routeMessages(evt, evt.data, router);
      } catch (err) {
        onerror(err as unknown as Error);
      }
    };
  }

  return function (evt: ExtendableMessageEvent | MessageEvent): void {
    routeMessages(evt, evt.data, router);
  };
}
