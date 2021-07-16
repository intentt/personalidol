import { Raycaster } from "three/src/core/Raycaster";
import { Vector2 } from "three/src/math/Vector2";

import { generateUUID } from "@personalidol/math/src/generateUUID";
import { isMesh } from "@personalidol/framework/src/isMesh";
import { name } from "@personalidol/framework/src/name";

import type { Logger } from "loglevel";

import type { CameraController } from "@personalidol/framework/src/CameraController.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { EntityController } from "./EntityController.interface";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { EntityScriptedBrush } from "./EntityScriptedBrush.type";
import type { EntityView } from "./EntityView.interface";

export function StructureCeilingEntityController(
  logger: Logger,
  view: EntityView<EntityScriptedBrush>,
  cameraController: CameraController
): EntityController<EntityScriptedBrush> {
  const state: EntityControllerState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _raycaster = new Raycaster();
  const _raycasterVector = new Vector2(0, 0);

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (!isMesh(view.object3D) || Array.isArray(view.object3D.material)) {
      return;
    }

    _raycaster.setFromCamera(_raycasterVector, cameraController.camera);

    const _intersections = _raycaster.intersectObject(view.raycasterObject3D);
    const _isIntersecting = _intersections.length > 0;

    view.object3D.material.transparent = _isIntersecting;
    view.object3D.material.opacity = _isIntersecting ? 0.3 : 1;
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isEntityController: true,
    isMountable: true,
    isPreloadable: true,
    name: `StructureCeilingEntityController(${name(view)})`,
    state: state,
    view: view,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
