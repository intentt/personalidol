import { generateUUID } from "../../math/src/generateUUID";

import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";

import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { WindowResizeObserver as IWindowResizeObserver } from "./WindowResizeObserver.interface";

export function WindowResizeObserver(
  dimensionsState: Uint32Array,
  tickTimerState: TickTimerState
): IWindowResizeObserver {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  function start(): void {}

  function stop(): void {}

  function update(): void {
    if (
      dimensionsState[DimensionsIndices.D_HEIGHT] === window.innerHeight &&
      dimensionsState[DimensionsIndices.D_WIDTH] === window.innerWidth
    ) {
      // Nothing changed.
      return;
    }

    dimensionsState[DimensionsIndices.P_BOTTOM] = window.innerHeight;
    dimensionsState[DimensionsIndices.P_LEFT] = 0;
    dimensionsState[DimensionsIndices.P_RIGHT] = window.innerWidth;
    dimensionsState[DimensionsIndices.P_TOP] = 0;
    dimensionsState[DimensionsIndices.D_HEIGHT] = window.innerHeight;
    dimensionsState[DimensionsIndices.D_WIDTH] = window.innerWidth;

    dimensionsState[DimensionsIndices.LAST_UPDATE] = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isWindowResizeObserver: true,
    name: "WindowResizeObserver",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
