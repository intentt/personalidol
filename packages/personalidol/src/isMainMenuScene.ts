import type { Scene } from "../../framework/src/Scene.interface";

import type { MainMenuScene } from "./MainMenuScene.interface";

export function isMainMenuScene(scene: null | Scene): scene is MainMenuScene {
  if (null === scene) {
    return false;
  }

  return true === (scene as MainMenuScene).isMainMenuScene;
}
