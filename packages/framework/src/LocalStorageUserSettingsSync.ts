import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { IsUserSettingsValidCallback } from "./IsUserSettingsValidCallback.type";
import type { UserSettings } from "./UserSettings.type";
import type { UserSettingsSync } from "./UserSettingsSync.interface";

const LOCAL_STORAGE_KEY: string = "pi-local-storage-user-settings";

function _loadUserSettings<U extends UserSettings>(userSettings: U, storedUserSettings: U): void {
  Object.assign(userSettings, storedUserSettings);
}

function _storeUserSettings<U extends UserSettings>(userSettings: U): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userSettings));
}

export function LocalStorageUserSettingsSync<U extends UserSettings>(
  userSettings: U,
  isUserSettingsValid: IsUserSettingsValidCallback<U>,
  debugName: string
): UserSettingsSync {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });
  let _lastSyncedVersion: number = userSettings.version;

  function start(): void {
    const storedUserSettings: null | string = localStorage.getItem(LOCAL_STORAGE_KEY);

    if ("string" !== typeof storedUserSettings) {
      _storeUserSettings<U>(userSettings);

      return;
    }

    const parsedUserSettings = JSON.parse(storedUserSettings);

    if (!isUserSettingsValid(parsedUserSettings)) {
      // Override user settings with the default settings object.
      _storeUserSettings<U>(userSettings);

      return;
    }

    if (parsedUserSettings.version > userSettings.version) {
      _loadUserSettings<U>(userSettings, parsedUserSettings);
    } else {
      _storeUserSettings<U>(userSettings);
    }
  }

  function stop(): void {}

  function update(delta: number): void {
    if (userSettings.version <= _lastSyncedVersion) {
      return;
    }

    _lastSyncedVersion = userSettings.version;
    _storeUserSettings<U>(userSettings);
  }

  return Object.freeze({
    id: generateUUID(),
    isUserSettingsSync: true,
    name: `LocalStorageUserSettingsSync(${debugName})`,
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
