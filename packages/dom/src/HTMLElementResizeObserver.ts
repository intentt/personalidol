import { generateUUID } from "../../math/src/generateUUID";

import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";

import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { HTMLElementResizeObserver as IHTMLElementResizeObserver } from "./HTMLElementResizeObserver.interface";

export function HTMLElementResizeObserver(
  htmlElement: HTMLElement,
  dimensionsState: Uint32Array,
  tickTimerState: TickTimerState
): IHTMLElementResizeObserver {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });
  const _resizeObserver = new ResizeObserver(_updateDimensions);

  function start(): void {
    _resizeObserver.observe(htmlElement);
  }

  function stop(): void {
    _resizeObserver.disconnect();
  }

  function update(): void {}

  function _updateDimensions(): void {
    // ResizeObserver theoretically provides the same values as bounding
    // rect, but in reality sometimes it gives incorrect values, for example
    // when element uses vh / wv units
    const { bottom, left, right, top } = htmlElement.getBoundingClientRect();

    dimensionsState[DimensionsIndices.P_BOTTOM] = bottom;
    dimensionsState[DimensionsIndices.P_LEFT] = left;
    dimensionsState[DimensionsIndices.P_RIGHT] = right;
    dimensionsState[DimensionsIndices.P_TOP] = top;
    dimensionsState[DimensionsIndices.D_HEIGHT] = bottom - top;
    dimensionsState[DimensionsIndices.D_WIDTH] = right - left;

    dimensionsState[DimensionsIndices.LAST_UPDATE] = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isHTMLElementResizeObserver: true,
    name: "HTMLElementResizeObserver",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
