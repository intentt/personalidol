import { Raycaster } from "three/src/core/Raycaster";
import { Vector2 } from "three/src/math/Vector2";

import { generateUUID } from "@personalidol/math/src/generateUUID";
import { name } from "@personalidol/framework/src/name";

import { createEntityControllerState } from "./createEntityControllerState";

import type { Intersection } from "three/src/core/Raycaster";
import type { Logger } from "loglevel";
import type { Raycaster as IRaycaster } from "three/src/core/Raycaster";
import type { Vector2 as IVector2 } from "three/src/math/Vector2";

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
  const state: EntityControllerState = createEntityControllerState({
    needsUpdates: true,
  });

  const _raycaster: IRaycaster = new Raycaster();
  const _raycasterVector: IVector2 = new Vector2(0, 0);
  const _intersects: Array<Intersection> = [];

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
    _intersects.length = 0;
    _raycaster.setFromCamera(_raycasterVector, cameraController.camera);

    view.state.isObscuring = _raycaster.intersectObject(view.raycasterObject3D, false, _intersects).length > 0;
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
