import { Group } from "three/src/objects/Group";

import { disposeAll } from "@personalidol/framework/src/disposeAll";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { mountAll } from "@personalidol/framework/src/mountAll";
import { preload as fPreload } from "@personalidol/framework/src/preload";
import { unmountAll } from "@personalidol/framework/src/unmountAll";

import { createEntityViewState } from "./createEntityViewState";
import { useObjectLabel } from "./useObjectLabel";

import type { Group as IGroup } from "three/src/objects/Group";
import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";

import type { EntityGLTFModel } from "./EntityGLTFModel.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";
import type { InstancedGLTFModelViewManager } from "./InstancedGLTFModelViewManager.interface";
import type { InstancedMeshHandle } from "./InstancedMeshHandle.interface";
import type { UserSettings } from "./UserSettings.type";

export function InstancedGLTFModelView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityGLTFModel,
  domMessagePort: MessagePort,
  instancedGLTFModelViewManager: InstancedGLTFModelViewManager
): EntityView<EntityGLTFModel> {
  const state: EntityViewState = createEntityViewState({
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _labelContainer: IGroup = new Group();
  const _meshContainer: IGroup = new Group();
  const _mountables: Set<MountableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();
  let _instancedMeshHandle: null | InstancedMeshHandle = null;
  let _instancedMeshHandleNeedsUpdate: boolean = false;

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    mountAll(_mountables);
    scene.add(_labelContainer);
  }

  function pause(): void {
    state.isPaused = true;
  }

  async function preload(): Promise<void> {
    state.isPreloading = true;

    _instancedMeshHandle = await instancedGLTFModelViewManager.createEntiyMeshHandle(entity, _meshContainer);
    _instancedMeshHandle.object3D.rotation.set(0, entity.angle, 0);
    _instancedMeshHandle.object3D.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
    _instancedMeshHandleNeedsUpdate = true;

    fPreload(logger, _instancedMeshHandle);

    // Entity label

    useObjectLabel(domMessagePort, _labelContainer, entity, _mountables, _unmountables, _disposables);

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    unmountAll(_unmountables);
    scene.remove(_labelContainer);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (!_instancedMeshHandle) {
      throw new Error("Instanced mesh handle is not set, but it was expected.");
    }

    if (!_instancedMeshHandleNeedsUpdate) {
      return;
    }

    _instancedMeshHandleNeedsUpdate = false;
    _instancedMeshHandle.update(delta, elapsedTime, tickTimerState);
    _labelContainer.position.copy(_instancedMeshHandle.object3D.position);
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    interactableObject3D: _meshContainer,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `InstancedGLTFModelView("${entity.model_name}", "${entity.model_texture}", ${entity.scale})`,
    object3D: _meshContainer,
    raycasterObject3D: _meshContainer,
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
