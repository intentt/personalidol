import { generateUUID } from "../../math/src/generateUUID";
import { mount } from "./mount";
import { unmount } from "./unmount";

import type { Logger } from "loglevel";

import type { DirectorState } from "./DirectorState.type";
import type { SceneTransition as ISceneTransition } from "./SceneTransition.interface";
import type { SceneTransitionState } from "./SceneTransitionState.type";
import type { TickTimerState } from "./TickTimerState.type";

export function SceneTransition(
  logger: Logger,
  sceneDirectorState: DirectorState,
  loadingScreenDirectorState: DirectorState
): ISceneTransition {
  const state: SceneTransitionState = Object.seal({
    lastUpdateCurrentTick: -1,
    lastUpdateNextTick: -1,
    lastUpdateTransitioningTick: -1,
    needsUpdates: true,
  });

  function start(): void {}

  function stop(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    const scene = sceneDirectorState.current;
    const loadingScreen = loadingScreenDirectorState.current;

    state.lastUpdateCurrentTick = Math.max(
      sceneDirectorState.lastUpdateCurrentTick,
      loadingScreenDirectorState.lastUpdateCurrentTick
    );
    state.lastUpdateNextTick = Math.max(
      sceneDirectorState.lastUpdateNextTick,
      loadingScreenDirectorState.lastUpdateNextTick
    );
    state.lastUpdateTransitioningTick = Math.max(
      sceneDirectorState.lastUpdateTransitioningTick,
      loadingScreenDirectorState.lastUpdateTransitioningTick
    );

    if (scene) {
      if (loadingScreen) {
        if (loadingScreen.state.isMounted) {
          unmount(logger, loadingScreen);
        }
      }

      if (!scene.state.isMounted) {
        mount(logger, scene);
      }

      scene.update(delta, elapsedTime, tickTimerState);

      return;
    }

    if (!loadingScreen) {
      return;
    }

    if (!loadingScreen.state.isMounted) {
      mount(logger, loadingScreen);
    }

    loadingScreen.update(delta, elapsedTime, tickTimerState);
  }

  return Object.freeze({
    id: generateUUID(),
    name: "SceneTransition",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
