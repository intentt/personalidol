import { sceneMountSoft } from "@personalidol/framework/src/sceneMountSoft";
import { sceneUnmountSoft } from "@personalidol/framework/src/sceneUnmountSoft";

import { resetLoadingManagerState } from "./resetLoadingManagerState";

import type { Logger } from "loglevel";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import type { Director as IDirector } from "./Director.interface";
import type { SceneLoader as ISceneLoader } from "./SceneLoader.interface";

export function SceneLoader(logger: Logger, progressMessagePort: MessagePort, renderer: WebGLRenderer, sceneDirector: IDirector, loadingScreenDirector: IDirector): ISceneLoader {
  function start(): void {}

  function stop(): void {}

  function update(delta: number, elapsedTime: number): void {
    const scene = sceneDirector.state.current;
    const loadingScreen = loadingScreenDirector.state.current;

    if (scene) {
      if (loadingScreen) {
        sceneUnmountSoft(logger, loadingScreen);
        renderer.clear();
      }

      if (sceneMountSoft(logger, scene)) {
        // Clean up any loading manager state the scene might have provided
        // during preload ant mount phases.
        resetLoadingManagerState(progressMessagePort);
      }

      scene.update(delta, elapsedTime);

      return;
    }

    if (!loadingScreen) {
      return;
    }

    sceneMountSoft(logger, loadingScreen);
    loadingScreen.update(delta, elapsedTime);
  }

  return {
    name: "SceneLoader",

    start: start,
    stop: stop,
    update: update,
  };
}