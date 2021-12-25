import { createSettingsHandle } from "../../framework/src/createSettingsHandle";
import { generateUUID } from "../../math/src/generateUUID";

import type { Logger } from "loglevel";
import type { Mesh } from "three/src/objects/Mesh";

import type { UserSettingsManager } from "../../framework/src/UserSettingsManager.interface";
import type { UserSettingsManagerState } from "../../framework/src/UserSettingsManagerState.type";

import type { UserSettings } from "./UserSettings.type";

export function MeshUserSettingsManager(logger: Logger, userSettings: UserSettings, mesh: Mesh): UserSettingsManager {
  const state: UserSettingsManagerState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const applySettings = createSettingsHandle(userSettings, function () {
    mesh.castShadow = userSettings.useShadows;
    mesh.receiveShadow = userSettings.useShadows;
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
    name: "MeshUserSettingsManager",
    state: state,

    preload: preload,
    update: applySettings,
  });
}
