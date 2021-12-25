import { createSettingsHandle } from "../../framework/src/createSettingsHandle";
import { generateUUID } from "../../math/src/generateUUID";

import { UserSettingsDynamicLightQualityMap } from "./UserSettingsDynamicLightQualityMap.enum";

import type { AmbientLight } from "three/src/lights/AmbientLight";
import type { HemisphereLight } from "three/src/lights/HemisphereLight";

import type { UserSettingsManager } from "../../framework/src/UserSettingsManager.interface";
import type { UserSettingsManagerState } from "../../framework/src/UserSettingsManagerState.type";

import type { UserSettings } from "./UserSettings.type";

type SupportedLights = AmbientLight | HemisphereLight;

const _lightDefaultIntensity: WeakMap<SupportedLights, number> = new WeakMap();

export function BackgroundLightUserSettingsManager(
  userSettings: UserSettings,
  light: SupportedLights
): UserSettingsManager {
  const state: UserSettingsManagerState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  let _defaultLightIntensity: undefined | number = 0;

  const applySettings = createSettingsHandle(userSettings, function () {
    if (!_lightDefaultIntensity.has(light)) {
      _lightDefaultIntensity.set(light, light.intensity);
    }

    _defaultLightIntensity = _lightDefaultIntensity.get(light);

    if ("number" !== typeof _defaultLightIntensity) {
      throw new Error("Unable to retrieve default light intensity.");
    }

    if (UserSettingsDynamicLightQualityMap.None === userSettings.dynamicLightQuality) {
      light.intensity = Math.min(1, Math.max(0.6, _defaultLightIntensity * 2));
    } else {
      light.intensity = _defaultLightIntensity;
    }
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
    name: "BackgroundLightUserSettingsManager",
    state: state,

    preload: preload,
    update: applySettings,
  });
}
