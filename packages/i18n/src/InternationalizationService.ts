import { attachMultiRouter } from "../../framework/src/attachMultiRouter";
import { generateUUID } from "../../math/src/generateUUID";

import type { i18n } from "i18next";

import type { PreloadableState } from "../../framework/src/PreloadableState.type";
import type { RPCMessage } from "../../framework/src/RPCMessage.type";

import type { InternationalizationService as IInternationalizationService } from "./InternationalizationService.interface";

type LoadNamespacesRequest = RPCMessage & {
  namespaces: Array<string>;
};

export function InternationalizationService(
  i18next: i18n,
  progressMessagePort: MessagePort
): IInternationalizationService {
  const state: PreloadableState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
  });

  const _messagesRouter = Object.freeze({
    async loadNamespaces(messagePort: MessagePort, { namespaces, rpc }: LoadNamespacesRequest): Promise<void> {
      if (namespaces.length < 1) {
        throw new Error("Expected namespaces.");
      }

      // Progress is monitored in the i18next plugin.
      i18next.loadNamespaces(namespaces);

      messagePort.postMessage({
        loadedNamespaces: {
          namespaces: namespaces,
          rpc: rpc,
        },
      });
    },
  });

  function _waitForInitialization(): Promise<void> {
    return new Promise(function (resolve) {
      i18next.on("loaded", resolve);
    });
  }

  async function preload(): Promise<void> {
    state.isPreloading = true;

    if (!i18next.isInitialized) {
      await _waitForInitialization();
    }

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function registerMessagePort(messagePort: MessagePort): void {
    attachMultiRouter(messagePort, _messagesRouter);
  }

  function start(): void {}

  function stop(): void {}

  return Object.freeze({
    id: generateUUID(),
    i18next: i18next,
    isPreloadable: true,
    name: "InternationalizationService",
    state: state,
    thread: "main" as const,

    preload: preload,
    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
  });
}
