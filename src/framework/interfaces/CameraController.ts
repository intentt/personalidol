import * as THREE from "three";

import CanvasController from "src/framework/interfaces/CanvasController";

export default interface CameraController extends CanvasController {
  getCameraFrustum(): THREE.Frustum;

  setZoom(zoom: number): void;
}
