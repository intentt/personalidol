import { Object3D } from "three/src/core/Object3D";

import { generateUUID } from "../../math/src/generateUUID";

import { createEntityViewState } from "./createEntityViewState";

import type { Logger } from "loglevel";
import type { Object3D as IObject3D } from "three/src/core/Object3D";

import type { EntityScriptedZone } from "./EntityScriptedZone.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";

export function ScriptedZoneView(logger: Logger, entity: EntityScriptedZone): EntityView<EntityScriptedZone> {
  const state: EntityViewState = createEntityViewState({
    needsUpdates: true,
  });

  const _object: IObject3D = new Object3D();

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

  function update(): void {}

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    interactableObject3D: _object,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `ScriptedZoneView`,
    object3D: _object,
    raycasterObject3D: _object,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
