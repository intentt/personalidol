import type { UserSettings } from "./UserSettings.type";

export function isUserSettingsValid(userSettings: any): userSettings is UserSettings {
  if (!userSettings) {
    return false;
  }

  if ("object" !== typeof userSettings) {
    return false;
  }

  if (Boolean(userSettings.prototype)) {
    // If settings have someting in the prototype, just discard them.
    return false;
  }

  switch (userSettings.cameraType) {
    case "OrthographicCamera":
    case "PerspectiveCamera":
      break;
    default:
      return false;
  }

  if ("number" !== typeof userSettings.devicePixelRatio) {
    return false;
  }

  if ("number" !== typeof userSettings.dynamicLightQuality) {
    return false;
  }

  switch (userSettings.language) {
    case "en":
    case "pl":
    case "ru":
      break;
    default:
      return false;
  }

  if ("number" !== typeof userSettings.pixelRatio) {
    return false;
  }

  switch (userSettings.shadowMapSize) {
    case 512:
    case 1024:
    case 2048:
    case 4096:
      break;
    default:
      return false;
  }

  if ("boolean" !== typeof userSettings.showStatsReporter) {
    return false;
  }

  if ("boolean" !== typeof userSettings.useOffscreenCanvas) {
    return false;
  }

  if ("boolean" !== typeof userSettings.useShadows) {
    return false;
  }

  if ("number" !== typeof userSettings.version) {
    return false;
  }

  return true;
}
