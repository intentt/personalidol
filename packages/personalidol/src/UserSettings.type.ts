import type { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import type { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";

import type { UserSettings as BaseUserSettings } from "../../framework/src/UserSettings.type";

export type UserSettings = BaseUserSettings & {
  cameraZoomAmount: number;
  cameraType: OrthographicCamera["type"] | PerspectiveCamera["type"];
  devicePixelRatio: number;
  dynamicLightQuality: 0 | 1 | 2 | 4;
  language: string;
  pixelRatio: number;
  shadowMapSize: 512 | 1024 | 2048 | 4096;
  useOffscreenCanvas: boolean;
  useShadows: boolean;
};
