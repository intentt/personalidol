/// <reference lib="webworker" />

import Loglevel from "loglevel";

import { attachMultiRouter } from "@personalidol/framework/src/attachMultiRouter";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { ProgressManager } from "@personalidol/framework/src/ProgressManager";

import type { DOMElementsLookup } from "@personalidol/personalidol/src/DOMElementsLookup.type";
import type { MessageDOMUIDispose } from "@personalidol/dom-renderer/src/MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "@personalidol/dom-renderer/src/MessageDOMUIRender.type";
import type { MessageProgressChange } from "@personalidol/framework/src/MessageProgressChange.type";
import type { MessageProgressDone } from "@personalidol/framework/src/MessageProgressDone.type";
import type { MessageProgressError } from "@personalidol/framework/src/MessageProgressError.type";
import type { MessageProgressStart } from "@personalidol/framework/src/MessageProgressStart.type";
import type { MessageWorkerReady } from "@personalidol/framework/src/MessageWorkerReady.type";
import type { ProgressManager as IProgressManager } from "@personalidol/framework/src/ProgressManager.interface";
// import type { ProgressManagerState } from "@personalidol/framework/src/ProgressManagerState.type";

declare var self: DedicatedWorkerGlobalScope;

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const _broadcastMessagePorts: Array<MessagePort> = [];
const _progressManager: IProgressManager = ProgressManager();

let _domFatalErrorElementId: null | string = null;
let _domLoadingScreenElementId: null | string = null;
let _domMessagePort: null | MessagePort = null;
let _errorPropsVersion: number = 0;
let _lastProgressBroadcastVersion: number = 0;
let _progressPropsVersion: number = 0;

function _clear(): void {
  if (!_domMessagePort) {
    throw new Error("DOMUIController message port is not ready.");
  }

  if (_domLoadingScreenElementId) {
    _unmountLoadingScreenElement();
  }

  if (_domFatalErrorElementId) {
    _unmountFatalErrorElement();
  }
}

function _onProgress(): void {
  if (!_domMessagePort) {
    throw new Error("DOMUIController message port is not ready.");
  }

  if (_progressManager.state.errors.length < 1 && _progressManager.state.messages.length < 1) {
    _clear();
    return;
  }

  if (_domFatalErrorElementId) {
    // There is a fatal error going on.
    return;
  }

  if (_progressManager.state.errors.length > 0) {
    _onProgressError();
    return;
  }

  if (!_domLoadingScreenElementId) {
    _domLoadingScreenElementId = generateUUID();
  }

  _progressPropsVersion += 1;

  _domMessagePort.postMessage({
    render: <MessageDOMUIRender<DOMElementsLookup>>{
      id: _domLoadingScreenElementId,
      element: "pi-progress-manager-state",
      props: {
        progressManagerState: _progressManager.state,
        version: _progressPropsVersion,
      },
    },
  });
}

function _onProgressError(): void {
  if (!_domMessagePort) {
    throw new Error("DOMUIController message port is not ready.");
  }

  if (_domLoadingScreenElementId) {
    _unmountLoadingScreenElement();
  }

  if (!_domFatalErrorElementId) {
    _domFatalErrorElementId = generateUUID();
  }

  _errorPropsVersion += 1;

  _domMessagePort.postMessage({
    render: <MessageDOMUIRender<DOMElementsLookup>>{
      id: _domFatalErrorElementId,
      element: "pi-fatal-error",
      props: {
        errors: _progressManager.state.errors,
        version: _errorPropsVersion,
      },
    },
  });
}

function _unmountFatalErrorElement(): void {
  if (!_domMessagePort) {
    throw new Error("DOMUIController message port is not ready.");
  }

  if (!_domFatalErrorElementId) {
    throw new Error("DOM fatal error screen is not rendered.");
  }

  _domMessagePort.postMessage({
    dispose: <MessageDOMUIDispose>[_domFatalErrorElementId],
  });

  _domFatalErrorElementId = null;
}

function _unmountLoadingScreenElement(): void {
  if (!_domMessagePort) {
    throw new Error("DOMUIController message port is not ready.");
  }

  if (!_domLoadingScreenElementId) {
    throw new Error("DOM loading screen is not rendered.");
  }

  _domMessagePort.postMessage({
    dispose: <MessageDOMUIDispose>[_domLoadingScreenElementId],
  });

  _domLoadingScreenElementId = null;
}

function _refreshNotifyProgress(): void {
  if (_lastProgressBroadcastVersion >= _progressManager.state.version) {
    return;
  }

  _lastProgressBroadcastVersion = _progressManager.state.version;

  _onProgress();

  const broadcastMessage = {
    progress: _progressManager.state,
  };

  for (let i = 0; i < _broadcastMessagePorts.length; i += 1) {
    _broadcastMessagePorts[i].postMessage(broadcastMessage);
  }
}

const progressMessagesRouter = Object.freeze({
  done(messagePort: MessagePort, message: MessageProgressDone) {
    _progressManager.done(message);
    _refreshNotifyProgress();
  },

  error(messagePort: MessagePort, message: MessageProgressError) {
    _progressManager.error(message);
    _refreshNotifyProgress();
  },

  expect(messagePort: MessagePort, expect: number) {
    _progressManager.expect(expect);
    _refreshNotifyProgress();
  },

  progress(messagePort: MessagePort, message: MessageProgressChange) {
    _progressManager.progress(message);
    _refreshNotifyProgress();
  },

  reset() {
    _progressManager.reset();
    _refreshNotifyProgress();
  },

  start(messagePort: MessagePort, message: MessageProgressStart) {
    _progressManager.start(message);
    _refreshNotifyProgress();
  },
});

self.onmessage = createRouter({
  domMessagePort(domMessagePort: MessagePort): void {
    _domMessagePort = domMessagePort;
  },

  progressMessagePort({ broadcastProgress, messagePort }: { broadcastProgress: boolean; messagePort: MessagePort }): void {
    if (broadcastProgress) {
      _broadcastMessagePorts.push(messagePort);
    }

    attachMultiRouter(messagePort, progressMessagesRouter);
  },

  ready(): void {
    self.postMessage(<MessageWorkerReady>{
      ready: true,
    });
  },

  start(): void {},

  stop(): void {},
});
