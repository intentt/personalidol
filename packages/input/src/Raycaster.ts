import { Raycaster as THREERaycaster } from "three/src/core/Raycaster";
import { Vector2 } from "three/src/math/Vector2";

import { getPrimaryPointerVectorX } from "./getPrimaryPointerVectorX";
import { getPrimaryPointerVectorY } from "./getPrimaryPointerVectorY";

import type { Raycaster as ITHREERaycaster } from "three/src/core/Raycaster";
import type { Vector2 as IVector2 } from "three/src/math/Vector2";

import type { CameraController } from "../../framework/src/CameraController.interface";
import type { Object3D } from "three/src/core/Object3D";

import type { Raycastable } from "./Raycastable.interface";
import type { Raycaster as IRaycaster } from "./Raycaster.interface";
import type { RaycasterState } from "./RaycasterState.type";

export function Raycaster(
  cameraController: CameraController,
  dimensionsState: Uint32Array,
  mouseState: Int32Array,
  touchState: Int32Array
): IRaycaster {
  const state: RaycasterState = Object.seal({
    hasIntersections: false,
    needsUpdates: true,
  });
  const raycastables: Set<Raycastable> = new Set();

  const _raycastableObjects: Array<Object3D> = [];
  const _threeRaycaster: ITHREERaycaster = new THREERaycaster();
  const _vector2: IVector2 = new Vector2();

  function _clearIntersections(): void {
    state.hasIntersections = false;
  }

  function _resetRaycastable(raycastable: Raycastable): void {
    raycastable.state.isRayIntersecting = false;
  }

  function _updateRaycasterCamera(): void {
    _vector2.x = getPrimaryPointerVectorX(dimensionsState, mouseState, touchState);
    _vector2.y = getPrimaryPointerVectorY(dimensionsState, mouseState, touchState);
    _threeRaycaster.setFromCamera(_vector2, cameraController.camera);
  }

  function reset(): void {
    _clearIntersections();
    raycastables.forEach(_resetRaycastable);
  }

  function update(): void {
    if (raycastables.size < 1) {
      return;
    }

    _updateRaycasterCamera();
    _clearIntersections();

    _raycastableObjects.length = 0;

    for (let raycastable of raycastables) {
      _resetRaycastable(raycastable);
      _raycastableObjects.push(raycastable.raycasterObject3D);
    }

    const intersections = _threeRaycaster.intersectObjects(_raycastableObjects, false);

    if (intersections.length < 1) {
      return;
    }

    state.hasIntersections = true;

    for (let raycastable of raycastables) {
      raycastable.state.isRayIntersecting = raycastable.raycasterObject3D === intersections[0].object;
    }
  }

  return Object.freeze({
    isRaycaster: true,
    raycastables: raycastables,
    state: state,

    reset: reset,
    update: update,
  });
}
