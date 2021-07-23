import { Vector3 } from "three/src/math/Vector3";

import { generateUUID } from "@personalidol/math/src/generateUUID";
import { name } from "@personalidol/framework/src/name";

import { createEntityControllerState } from "./createEntityControllerState";

import type { Logger } from "loglevel";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { CameraController } from "@personalidol/framework/src/CameraController.interface";
import type { InteractableBag } from "@personalidol/views/src/InteractableBag.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityController } from "./EntityController.interface";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { EntityView } from "./EntityView.interface";

export function InteractorEntityController<T extends AnyEntity>(
  logger: Logger,
  view: EntityView<T>,
  cameraController: CameraController,
  interactableBag: InteractableBag,
  domMessagePort: MessagePort
): EntityController<T> {
  const state: EntityControllerState = createEntityControllerState({
    needsUpdates: true,
  });

  const _distanceVector: IVector3 = new Vector3();

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
    for (let interactable of interactableBag.interactables) {
      if (!interactable.state.needsInteractions) {
        interactable.state.isInteracting = false;

        continue;
      }

      _distanceVector.subVectors(interactable.interactableObject3D.position, view.object3D.position);

      interactable.state.isInteracting = _distanceVector.lengthSq() < 80 * 80;
    }
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isEntityController: true,
    isMountable: true,
    isPreloadable: true,
    name: `InteractorEntityController(${name(view)})`,
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
