import { generateUUID } from "../../math/src/generateUUID";

import type { Logger } from "loglevel";

import type { MainLoopTicker } from "../../framework/src/MainLoopTicker.interface";
import type { MainLoopTickerState } from "../../framework/src/MainLoopTickerState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

/**
 * This ticker aims to keep any number of updates with stricty the same delta.
 * It's good for physics, but bad for animations (because animations will be
 * janky and not adjust to the display refresh rate).
 *
 * See more here:
 * http://www.isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
 */
export function DynamicsMainLoopTicker(
  logger: Logger,
  simulationTimestep: number = 1 / 60,
  panicThreshold = 30
): MainLoopTicker {
  const state: MainLoopTickerState = Object.seal({
    scheduledUpdates: 0,
  });

  const tickTimerState: TickTimerState = Object.seal({
    currentTick: 0,
    delta: 0,
    elapsedTime: 0,
  });

  let _frameDelta: number = 0;

  function tick(delta: number, elapsedTime: number): void {
    _frameDelta += delta;

    if (_frameDelta < simulationTimestep) {
      return;
    }

    tickTimerState.currentTick += 1;
    tickTimerState.delta = simulationTimestep;
    tickTimerState.elapsedTime = elapsedTime;

    state.scheduledUpdates = Math.floor(_frameDelta / simulationTimestep);
    _frameDelta -= state.scheduledUpdates * simulationTimestep;

    if (state.scheduledUpdates > panicThreshold) {
      logger.warn(`Dynamics loop updates are piling up. Skipping "${state.scheduledUpdates - 1}" updates.`);
      state.scheduledUpdates = 1;
    }
  }

  return Object.freeze({
    id: generateUUID(),
    name: `DynamicsMainLoopTicker(${simulationTimestep}, ${panicThreshold})`,
    state: state,
    tickTimerState: tickTimerState,

    tick: tick,
  });
}
