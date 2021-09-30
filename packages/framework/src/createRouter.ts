/// <reference lib="webworker" />

import { routeMessages } from "./routeMessages";

import type { MessageEventHandler } from "./MessageEventHandler.type";
import type { MessageEventRouter } from "./MessageEventRouter.type";

export function createRouter(router: MessageEventRouter): MessageEventHandler {
  return function (evt: ExtendableMessageEvent | MessageEvent): void {
    routeMessages(evt, evt.data, router);
  };
}
