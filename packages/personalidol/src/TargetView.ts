import { Object3D } from "three/src/core/Object3D";

import { generateUUID } from "../../math/src/generateUUID";
import { noop } from "../../framework/src/noop";

import { createEntityViewState } from "./createEntityViewState";

import type { Object3D as IObject3D } from "three/src/core/Object3D";
import type { Scene } from "three/src/scenes/Scene";

import type { EntityTarget } from "./EntityTarget.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";

// "target" is an abstract entity. At this point it won't be used with brushes,
// so the view is barebone.

export function TargetView(scene: Scene, entity: EntityTarget): EntityView<EntityTarget> {
  const state: EntityViewState = createEntityViewState();

  const base: IObject3D = new Object3D();

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;

    scene.add(base);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = false;
    state.isPreloaded = true;

    base.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
  }

  function unmount(): void {
    state.isMounted = false;

    scene.remove(base);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    interactableObject3D: base,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `TargetView("${entity.properties.targetname}")`,
    object3D: base,
    raycasterObject3D: base,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: noop,
  });
}
