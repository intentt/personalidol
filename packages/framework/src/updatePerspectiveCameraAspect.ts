import { Dimensions } from "./Dimensions";

import type { PerspectiveCamera } from "three";

export function updatePerspectiveCameraAspect(camera: PerspectiveCamera, dimensionsState: Uint16Array): void {
  const aspect = dimensionsState[Dimensions.code.D_WIDTH] / dimensionsState[Dimensions.code.D_HEIGHT];

  if (camera.aspect === aspect) {
    return;
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}
