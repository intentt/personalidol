import { generateUUID } from "../../math/src/generateUUID";
import { passiveEventListener } from "../../framework/src/passiveEventListener";

import { isKeyboardKeyName } from "./isKeyboardKeyName";
import { KeyboardIndices } from "./KeyboardIndices.enum";

import type { Logger } from "loglevel";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { WindowFocusObserverState } from "../../dom/src/WindowFocusObserverState.type";

import type { KeyboardKeyName } from "./KeyboardKeyName.type";
import type { KeyboardObserver as IKeyboardObserver } from "./KeyboardObserver.interface";
import type { KeyboardObserverState } from "./KeyboardObserverState.type";

export function KeyboardObserver(
  logger: Logger,
  htmlElement: HTMLElement,
  keyboardState: Uint8Array,
  windowFocusObserverState: WindowFocusObserverState,
  tickTimerState: TickTimerState
): IKeyboardObserver {
  const state: KeyboardObserverState = Object.seal({
    lastUpdate: 0,
    needsUpdates: true,
  });

  let _isListening: boolean = false;

  function start(): void {
    _attachListeners();
  }

  function stop(): void {
    if (_isListening) {
      // Service might be stopped while the document is out of focus.
      return;
    }

    _detachListeners();
  }

  function _attachListeners(): void {
    if (_isListening) {
      throw new Error("Touch listeners are already attached.");
    }

    _isListening = true;

    document.addEventListener("keydown", _onKeyDown, passiveEventListener);
    document.addEventListener("keyup", _onKeyUp, passiveEventListener);
  }

  function _detachListeners(): void {
    if (!_isListening) {
      throw new Error("Touch listeners are already detached.");
    }

    _isListening = false;

    document.removeEventListener("keydown", _onKeyDown);
    document.removeEventListener("keyup", _onKeyUp);
  }

  function update(): void {
    if (!windowFocusObserverState.isDocumentFocused && _isListening) {
      _detachListeners();
    }

    if (!windowFocusObserverState.isDocumentFocused && windowFocusObserverState.lastUpdate > state.lastUpdate) {
      // Clear inputs if the game window is not focused.
      keyboardState.fill(0);
      _onKeyboardStateChange();
    }

    if (!windowFocusObserverState.isDocumentFocused) {
      return;
    }

    if (windowFocusObserverState.isDocumentFocused && !_isListening) {
      _attachListeners();
    }
  }

  function _onKeyboardStateChange(): void {
    state.lastUpdate = tickTimerState.currentTick;
  }

  function _onKeyCodeDown(keyName: KeyboardKeyName, keyIndex: number): void {
    keyboardState[keyIndex] = 1;
    _onKeyboardStateChange();
  }

  function _onKeyCodeUp(keyName: KeyboardKeyName, keyIndex: number): void {
    keyboardState[keyIndex] = 0;
    _onKeyboardStateChange();
  }

  function _onKeyDown(evt: KeyboardEvent): void {
    const eventKeyCode: string = evt.code;

    if (!isKeyboardKeyName(eventKeyCode)) {
      logger.warn(`Unknown key pressed: ${evt.code}`);

      return;
    }

    if (evt.repeat) {
      // This is a repeated keypress.
      return;
    }

    _onKeyCodeDown(eventKeyCode, KeyboardIndices[eventKeyCode]);
  }

  function _onKeyUp(evt: KeyboardEvent): void {
    const eventKeyCode: string = evt.code;

    if (!isKeyboardKeyName(eventKeyCode)) {
      logger.warn(`Unknown key pressed: ${evt.code}`);

      return;
    }

    _onKeyCodeUp(eventKeyCode, KeyboardIndices[eventKeyCode]);
  }

  return Object.freeze({
    id: generateUUID(),
    isKeyboardObserver: true,
    name: "KeyboardObserver",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
