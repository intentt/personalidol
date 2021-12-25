import { createSettingsHandle } from "../../framework/src/createSettingsHandle";
import { generateUUID } from "../../math/src/generateUUID";

import type { i18n } from "i18next";

import type { UserSettingsManager } from "../../framework/src/UserSettingsManager.interface";
import type { UserSettingsManagerState } from "../../framework/src/UserSettingsManagerState.type";

import type { UserSettings } from "./UserSettings.type";

export function LanguageUserSettingsManager(userSettings: UserSettings, i18next: i18n): UserSettingsManager {
  const state: UserSettingsManagerState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const applySettings = createSettingsHandle(userSettings, function () {
    if (i18next.language !== userSettings.language) {
      i18next.changeLanguage(userSettings.language);
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
    name: "LanguageUserSettingsManager",
    state: state,

    preload: preload,
    update: applySettings,
  });
}
