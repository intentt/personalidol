import { createRouter } from "./createRouter";
import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { UserSettings } from "./UserSettings.type";
import type { UserSettingsSync } from "./UserSettingsSync.interface";

export function MultiThreadUserSettingsSync(
  userSettings: UserSettings,
  userSettingsMessagePort: MessagePort,
  debugName: string
): UserSettingsSync {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  userSettingsMessagePort.onmessage = createRouter({
    updateUserSettings(updatedUserSettings: UserSettings) {
      _lastSyncedVersion = userSettings.version;
      Object.assign(userSettings, updatedUserSettings);
    },
  });

  let _lastSyncedVersion: number = userSettings.version;

  function start(): void {}

  function stop(): void {}

  function update(delta: number): void {
    if (userSettings.version <= _lastSyncedVersion) {
      return;
    }

    _lastSyncedVersion = userSettings.version;
    userSettingsMessagePort.postMessage({
      updateUserSettings: userSettings,
    });
  }

  return Object.freeze({
    id: generateUUID(),
    isUserSettingsSync: true,
    name: `MultiThreadUserSettingsSync(${debugName})`,
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
