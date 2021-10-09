import { generateUUID } from "@personalidol/math/src/generateUUID";

function _createMessageEvent(type: string, data: any): MessageEvent {
  return new MessageEvent(type, {
    data: data,
    lastEventId: generateUUID(),
  });
}

/**
 * Some devices (with iOS/IPadOS for example) may throttle MessageChannel. To
 * somewhat mitigate that, use just plain callbacks when both sender and
 * receiver are in the same thread.
 *
 * It usually does not matter, but it's noticeable when something needs to be
 * updated from inside the animation frame, every frame.
 */
export function SingleThreadMessageChannel(): MessageChannel {
  let _port1onmessage: null | MessagePort["onmessage"] = null;
  const port1: MessagePort = Object.seal({
    addEventListener: port1addEventListener,
    close: port1close,
    dispatchEvent: port1dispatchEvent,
    onmessageerror: null,
    postMessage: port1postMessage,
    removeEventListener: port1removeEventListener,
    start: port1start,

    set onmessage(onmessage: null | MessagePort["onmessage"]) {
      _port1onmessage = onmessage;
    },
    get onmessage(): null | MessagePort["onmessage"] {
      return _port1onmessage;
    },
  });

  let _port2onmessage: null | MessagePort["onmessage"] = null;
  const port2: MessagePort = Object.seal({
    addEventListener: port2addEventListener,
    close: port2close,
    dispatchEvent: port2dispatchEvent,
    onmessageerror: null,
    postMessage: port2postMessage,
    removeEventListener: port2removeEventListener,
    start: port2start,

    set onmessage(onmessage: null | MessagePort["onmessage"]) {
      _port2onmessage = onmessage;
    },
    get onmessage(): null | MessagePort["onmessage"] {
      return _port2onmessage;
    },
  });

  function port1addEventListener() {
    throw new Error("Not yet implemented: port1.addEventListener");
  }

  function port1close() {
    throw new Error("Not yet implemented: port1.close");
  }

  function port1dispatchEvent(): boolean {
    throw new Error("Not yet implemented: port1.dispatchEvent");
  }

  function port1postMessage(message: any) {
    if (!_port2onmessage) {
      return;
    }

    _port2onmessage.call(port2, _createMessageEvent("port1", message));
  }

  function port1removeEventListener() {
    throw new Error("Not yet implemented: port1.removeEventListener");
  }

  function port1start() {}

  function port2addEventListener() {
    throw new Error("Not yet implemented: port2.addEventListener");
  }

  function port2close() {
    throw new Error("Not yet implemented: port2.close");
  }

  function port2dispatchEvent(): boolean {
    throw new Error("Not yet implemented: port2.dispatchEvent");
  }

  function port2postMessage(message: any) {
    if (!_port1onmessage) {
      return;
    }

    _port1onmessage.call(port1, _createMessageEvent("port2", message));
  }

  function port2removeEventListener() {
    throw new Error("Not yet implemented: port2.removeEventListener");
  }

  function port2start() {}

  return Object.freeze({
    port1: port1,
    port2: port2,
  });
}
