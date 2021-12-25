import { generateUUID } from "../../math/src/generateUUID";

import { dispose } from "./dispose";
import { preload } from "./preload";
import { unmount } from "./unmount";

import type { Logger } from "loglevel";

import type { Director as IDirector } from "./Director.interface";
import type { DirectorState } from "./DirectorState.type";
import type { TickTimerState } from "./TickTimerState.type";

export function Director(logger: Logger, tickTimerState: TickTimerState, debugName: string): IDirector {
  const state: DirectorState = Object.seal({
    current: null,
    isStarted: false,
    isTransitioning: false,
    lastUpdateCurrentTick: -1,
    lastUpdateNextTick: -1,
    lastUpdateTransitioningTick: -1,
    needsUpdates: true,
    next: null,
    transitioning: null,
  });

  function start(): void {
    if (state.isStarted) {
      throw new Error("Director is already started.");
    }

    state.isStarted = true;
  }

  function stop(): void {
    if (!state.isStarted) {
      throw new Error("Director is already stopped.");
    }

    state.isStarted = false;
  }

  function update(): void {
    if (!state.isStarted) {
      throw new Error("Director is not started, but it was updated.");
    }

    const _transitioning = state.transitioning;

    // This assignment is here to avoid a lot of additional typechecking.
    const { current, next } = state;

    // 0,0,0
    if (!next && !_transitioning && !current) {
      return;
    }

    // 0,0,1
    if (!next && !_transitioning && current) {
      return;
    }

    // 0,1,0
    if (!next && _transitioning && !current && _transitioning.state.isPreloaded) {
      state.current = _transitioning;
      state.isTransitioning = false;
      state.transitioning = null;

      state.lastUpdateCurrentTick = tickTimerState.currentTick;
      state.lastUpdateTransitioningTick = tickTimerState.currentTick;

      update();

      return;
    }

    // 0,1,0
    if (!next && _transitioning && !current && _transitioning.state.isPreloading) {
      return;
    }

    // 0,1,0
    if (!next && _transitioning && !current && !_transitioning.state.isPreloading) {
      throw new Error("Transitioning scene is not preloading, but it was expected to be.");
    }

    // 0,1,1
    if (!next && _transitioning && current) {
      throw new Error("Unexpected director state: both _transitioning and final scenes are set.");
    }

    // 1,0,0
    if (next && !_transitioning && !current) {
      preload(logger, next);

      state.next = null;
      state.isTransitioning = true;
      state.transitioning = next;

      state.lastUpdateNextTick = tickTimerState.currentTick;
      state.lastUpdateTransitioningTick = tickTimerState.currentTick;

      if (next.state.isPreloaded) {
        // Immediately transition to the next state if scene is aleready
        // preloaded.
        update();
      }

      return;
    }

    // 1,0,1
    if (next && !_transitioning && current) {
      if (current.state.isMounted) {
        unmount(logger, current);
      }

      dispose(logger, current);

      state.current = null;
      state.isTransitioning = true;

      state.lastUpdateCurrentTick = tickTimerState.currentTick;
      state.lastUpdateTransitioningTick = tickTimerState.currentTick;

      update();

      return;
    }

    // 1,1,0
    if (next && _transitioning && !current) {
      throw new Error("Can't set a new scene while current one is still _transitioning.");
    }

    // 1,1,1
    if (next && _transitioning && current) {
      throw new Error("Can't set a new scene while current one is still _transitioning.");
    }
  }

  return Object.freeze({
    id: generateUUID(),
    name: `Director(${debugName})`,
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
