import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";
import { generateUUID } from "../../math/src/generateUUID";
import { isInDimensionsBounds } from "../../framework/src/isInDimensionsBounds";
import { passiveEventListener } from "../../framework/src/passiveEventListener";

import { TouchIndices } from "./TouchIndices.enum";
import { TouchState } from "./TouchState";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { WindowFocusObserverState } from "../../dom/src/WindowFocusObserverState.type";

import type { TouchObserver as ITouchObserver } from "./TouchObserver.interface";
import type { TouchObserverState } from "./TouchObserverState.type";

export function TouchObserver(
  htmlElement: HTMLElement,
  dimensionsState: Uint32Array,
  touchState: Int32Array,
  windowFocusObserverState: WindowFocusObserverState,
  tickTimerState: TickTimerState
): ITouchObserver {
  const state: TouchObserverState = Object.seal({
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

  function update(): void {
    if (!windowFocusObserverState.isDocumentFocused && _isListening) {
      _detachListeners();
    }

    if (!windowFocusObserverState.isDocumentFocused && windowFocusObserverState.lastUpdate > state.lastUpdate) {
      // Clear inputs if the game window is not focused.
      TouchState.resetStateArray(touchState);
      state.lastUpdate = tickTimerState.currentTick;
    }

    if (!windowFocusObserverState.isDocumentFocused) {
      return;
    }

    if (windowFocusObserverState.isDocumentFocused && !_isListening) {
      _attachListeners();
    }

    if (touchState[TouchIndices.T_NAVIGATOR_MAX_TOUCH_POINTS] !== navigator.maxTouchPoints) {
      touchState[TouchIndices.T_NAVIGATOR_MAX_TOUCH_POINTS] = navigator.maxTouchPoints;
      state.lastUpdate = tickTimerState.currentTick;
    }

    if (dimensionsState[DimensionsIndices.LAST_UPDATE] > state.lastUpdate) {
      _updateDimensionsRelativeCoords();
    }
  }

  function _attachListeners(): void {
    if (_isListening) {
      throw new Error("TouchState listeners are already attached.");
    }

    _isListening = true;

    htmlElement.addEventListener("touchcancel", _onTouchChange, passiveEventListener);
    htmlElement.addEventListener("touchend", _onTouchEnd, passiveEventListener);
    htmlElement.addEventListener("touchmove", _onTouchChange, passiveEventListener);
    htmlElement.addEventListener("touchstart", _onTouchStart, passiveEventListener);
  }

  function _detachListeners(): void {
    if (!_isListening) {
      throw new Error("TouchState listeners are already detached.");
    }

    _isListening = false;

    htmlElement.removeEventListener("touchcancel", _onTouchChange);
    htmlElement.removeEventListener("touchend", _onTouchEnd);
    htmlElement.removeEventListener("touchmove", _onTouchChange);
    htmlElement.removeEventListener("touchstart", _onTouchStart);
  }

  function _onTouchChange(evt: TouchEvent): void {
    touchState[TouchIndices.T_LAST_USED] = tickTimerState.currentTick;
    touchState[TouchIndices.T_TOTAL] = evt.touches.length;

    for (let i = 0; i < evt.touches.length && i < TouchState.touches_total; i += 1) {
      touchState[TouchState.touches[i].CLIENT_X] = evt.touches[i].clientX;
      touchState[TouchState.touches[i].CLIENT_Y] = evt.touches[i].clientY;

      touchState[TouchState.touches[i].PRESSURE] = Math.floor(evt.touches[i].force * 100);
    }

    _updateDimensionsRelativeCoords();
  }

  function _onTouchEnd(evt: TouchEvent): void {
    touchState[TouchIndices.T_INITIATED_BY_ROOT_ELEMENT] = 0;

    for (let i = 0; i < evt.touches.length && i < TouchState.touches_total; i += 1) {
      touchState[TouchState.touches[i].UP_CLIENT_X] = evt.touches[i].clientX;
      touchState[TouchState.touches[i].UP_CLIENT_Y] = evt.touches[i].clientY;
      touchState[TouchState.touches[i].UP_LAST_UPDATE] = tickTimerState.currentTick;
    }

    _onTouchChange(evt);
  }

  function _onTouchStart(evt: TouchEvent): void {
    touchState[TouchIndices.T_INITIATED_BY_ROOT_ELEMENT] = Number(htmlElement === evt.target);

    for (let i = 0; i < evt.touches.length && i < TouchState.touches_total; i += 1) {
      touchState[TouchState.touches[i].DOWN_INITIAL_CLIENT_X] = evt.touches[i].clientX;
      touchState[TouchState.touches[i].DOWN_INITIAL_CLIENT_Y] = evt.touches[i].clientY;
      touchState[TouchState.touches[i].DOWN_INITIAL_LAST_UPDATE] = tickTimerState.currentTick;
    }

    _onTouchChange(evt);
  }

  function _updateDimensionsRelativeCoords(): void {
    for (let i = 0; i < touchState[TouchIndices.T_TOTAL] && i < TouchState.touches_total; i += 1) {
      touchState[TouchState.touches[i].RELATIVE_X] =
        touchState[TouchState.touches[i].CLIENT_X] - dimensionsState[DimensionsIndices.P_LEFT];
      touchState[TouchState.touches[i].RELATIVE_Y] =
        touchState[TouchState.touches[i].CLIENT_Y] - dimensionsState[DimensionsIndices.P_TOP];

      touchState[TouchState.touches[i].IN_BOUNDS] = Number(
        isInDimensionsBounds(
          dimensionsState,
          touchState[TouchState.touches[i].CLIENT_X],
          touchState[TouchState.touches[i].CLIENT_Y]
        )
      );
    }

    state.lastUpdate = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isTouchObserver: true,
    name: "TouchObserver",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
