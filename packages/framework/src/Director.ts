import { sceneDispose } from "./sceneDispose";
import { scenePreload } from "./scenePreload";

import type { Logger } from "loglevel";

import type { Director as IDirector } from "./Director.interface";
import type { DirectorState } from "./DirectorState.type";
import type { Scene } from "./Scene.interface";

export function Director(logger: Logger): IDirector {
  const state: DirectorState = Object.seal({
    current: null,
    isStarted: false,
    isTransitioning: false,
    next: null,
  });

  let _transitioning: null | Scene = null;

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
      logger.debug("FINISHED PRELOADING SCENE", _transitioning.name);

      state.current = _transitioning;
      state.isTransitioning = false;
      _transitioning = null;

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
      throw new Error("Unexpected director state: both transitioning and final scenes are set.");
    }

    // 1,0,0
    if (next && !_transitioning && !current) {
      scenePreload(logger, next);

      state.next = null;

      state.isTransitioning = true;
      _transitioning = next;

      return;
    }

    // 1,0,1
    if (next && !_transitioning && current) {
      sceneDispose(logger, current);

      state.current = null;
      state.isTransitioning = true;

      return;
    }

    // 1,1,0
    if (next && _transitioning && !current) {
      sceneDispose(logger, _transitioning);

      state.isTransitioning = false;
      _transitioning = null;

      return;
    }

    // 1,1,1
    if (next && _transitioning && current) {
      sceneDispose(logger, current);

      state.current = null;

      return;
    }
  }

  return Object.freeze({
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}