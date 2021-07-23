import { generateUUID } from "@personalidol/math/src/generateUUID";
import { name } from "@personalidol/framework/src/name";

import { createEntityControllerState } from "./createEntityControllerState";

import type { Logger } from "loglevel";

import type { CameraController } from "@personalidol/framework/src/CameraController.interface";
import type { InteractableBag } from "@personalidol/views/src/InteractableBag.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityController } from "./EntityController.interface";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { EntityView } from "./EntityView.interface";

export function InteractableEntityController<T extends AnyEntity>(
  logger: Logger,
  view: EntityView<T>,
  cameraController: CameraController,
  interactableBag: InteractableBag,
  domMessagePort: MessagePort
): EntityController<T> {
  const state: EntityControllerState = createEntityControllerState({
    needsUpdates: true,
  });

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;

    interactableBag.interactables.add(view);
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

    interactableBag.interactables.delete(view);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {}

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isEntityController: true,
    isMountable: true,
    isPreloadable: true,
    name: `InteractableEntityController(${name(view)})`,
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
