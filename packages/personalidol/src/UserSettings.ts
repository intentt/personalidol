import { isCanvasTransferControlToOffscreenSupported } from "../../framework/src/isCanvasTransferControlToOffscreenSupported";
import { UserSettings as BaseUserSettings } from "../../framework/src/UserSettings";

import { CameraParameters } from "./CameraParameters.enum";
import { UserSettingsDynamicLightQualityMap } from "./UserSettingsDynamicLightQualityMap.enum";

import type { UserSettings as IUserSettings } from "./UserSettings.type";

function createEmptyState(pixelRatio: number): IUserSettings {
  return Object.assign(BaseUserSettings.createEmptyState(), {
    cameraZoomAmount: CameraParameters.ZOOM_DEFAULT,
    cameraType: "PerspectiveCamera" as IUserSettings["cameraType"],
    devicePixelRatio: pixelRatio,
    dynamicLightQuality: UserSettingsDynamicLightQualityMap.Low,
    language: "en",
    pixelRatio: 1,
    shadowMapSize: 512 as IUserSettings["shadowMapSize"],
    useOffscreenCanvas: isCanvasTransferControlToOffscreenSupported(),
    useShadows: true,
  });
}

export const UserSettings = Object.freeze({
  createEmptyState: createEmptyState,
});
