import { generateUUID } from "../../math/src/generateUUID";

import { isPollablePreloading } from "./isPollablePreloading";

import type { Director } from "./Director.interface";
import type { DirectorPollablePreloadingObserver as IDirectorPollablePreloadingObserver } from "./DirectorPollablePreloadingObserver.interface";
import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { Scene } from "./Scene.interface";
import type { TickTimerState } from "./TickTimerState.type";

export function DirectorPollablePreloadingObserver(director: Director): IDirectorPollablePreloadingObserver {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  function start(): void {}

  function stop(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (!director.state.isTransitioning) {
      return;
    }

    const transitioning: null | Scene = director.state.transitioning;

    if (!transitioning) {
      throw new Error("Director is transitioning, but the transitioning scene is not defined");
    }

    if (!isPollablePreloading(transitioning)) {
      return;
    }

    transitioning.updatePreloadingState(delta, elapsedTime, tickTimerState);
  }

  return Object.freeze({
    id: generateUUID(),
    isDirectorPollablePreloadingObserver: true,
    isMainLoopUpdatable: true,
    name: "DirectorPollablePreloadingObserver",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
