import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopTicker } from "./MainLoopTicker.interface";
import type { MainLoopTickerState } from "./MainLoopTickerState.type";
import type { TickTimerState } from "./TickTimerState.type";

export function DefaultMainLoopTicker(): MainLoopTicker {
  const state: MainLoopTickerState = Object.seal({
    scheduledUpdates: 0,
  });

  const tickTimerState: TickTimerState = Object.seal({
    currentTick: 0,
    delta: 0,
    elapsedTime: 0,
  });

  function tick(delta: number, elapsedTime: number): void {
    tickTimerState.currentTick += 1;
    tickTimerState.delta = delta;
    tickTimerState.elapsedTime = elapsedTime;

    state.scheduledUpdates = 1;
  }

  return Object.freeze({
    id: generateUUID(),
    name: "DefaultMainLoopTicker",
    state: state,
    tickTimerState: tickTimerState,

    tick: tick,
  });
}
