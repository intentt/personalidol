import { createSettingsHandle } from "../../framework/src/createSettingsHandle";
import { generateUUID } from "../../math/src/generateUUID";

import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import type { UserSettingsManager } from "../../framework/src/UserSettingsManager.interface";
import type { UserSettingsManagerState } from "../../framework/src/UserSettingsManagerState.type";

import type { UserSettings } from "./UserSettings.type";

export function WebGLRendererUserSettingsManager(
  userSettings: UserSettings,
  renderer: WebGLRenderer
): UserSettingsManager {
  const state: UserSettingsManagerState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const applySettings = createSettingsHandle(userSettings, function () {
    renderer.setPixelRatio(userSettings.devicePixelRatio * userSettings.pixelRatio);
  });

  function preload(): void {
    state.isPreloading = true;

    applySettings();

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  return Object.freeze({
    id: generateUUID(),
    isPreloadable: true,
    isUserSettingsManager: true,
    name: "WebGLRendererUserSettingsManager",
    state: state,

    preload: preload,
    update: applySettings,
  });
}
