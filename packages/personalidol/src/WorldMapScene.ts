import { generateUUID } from "../../math/src/generateUUID";

import type { Logger } from "loglevel";

import type { SceneState } from "../../framework/src/SceneState.type";

import type { WorldMapScene as IWorldMapScene } from "./WorldMapScene.interface";

export function WorldMapScene(logger: Logger, mapName: string): IWorldMapScene {
  const state: SceneState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(): void {}

  function updatePreloadingState(): void {}

  return Object.freeze({
    currentMap: mapName,
    id: generateUUID(),
    isDisposable: true,
    isLocationMapScene: true,
    isMountable: true,
    isPollablePreloading: true,
    isPreloadable: true,
    isScene: true,
    isViewBaggableScene: true,
    name: `WorldMapScene("${mapName}")`,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
    updatePreloadingState: updatePreloadingState,
  });
}
