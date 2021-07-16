import type { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import type { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import type { Vector3 } from "three/src/math/Vector3";

import type { MainLoopUpdatable } from "@personalidol/framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "@personalidol/framework/src/Mountable.interface";
import type { Pauseable } from "@personalidol/framework/src/Pauseable.interface";

import type { CameraControllerState } from "./CameraControllerState.type";

export interface CameraController extends MainLoopUpdatable, Mountable, Pauseable {
  readonly camera: OrthographicCamera | PerspectiveCamera;
  readonly cameraResetPosition: Vector3;
  readonly position: Vector3;
  readonly state: CameraControllerState;

  follow(position: Vector3): void;

  resetPosition(): void;

  resetZoom(): void;

  unfollow(): void;

  zoomIn(scale?: number): void;

  zoomOut(scale?: number): void;
}
