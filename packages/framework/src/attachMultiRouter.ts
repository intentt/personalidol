/// <reference lib="webworker" />

import { routeMultiMessage } from "./routeMultiMessage";

import type { MessageEventMultiRouter } from "./MessageEventMultiRouter.type";

export function attachMultiRouter(messagePort: MessagePort, router: MessageEventMultiRouter): void {
  messagePort.onmessage = function (evt: ExtendableMessageEvent | MessageEvent) {
    routeMultiMessage(messagePort, evt, evt.data, router);
  };
  messagePort.start();
}
