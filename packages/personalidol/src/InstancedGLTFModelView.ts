import { Object3D } from "three/src/core/Object3D";

import { generateUUID } from "@personalidol/math/src/generateUUID";
import { preload as fPreload } from "@personalidol/framework/src/preload";

import type { Logger } from "loglevel";
import type { Object3D as IObject3D } from "three/src/core/Object3D";
import type { Scene } from "three/src/scenes/Scene";

import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

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
  instancedGLTFModelViewManager: InstancedGLTFModelViewManager
): EntityView<EntityGLTFModel> {
  const state: EntityViewState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isObscuring: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    isRayIntersecting: false,
    needsRaycast: false,
    needsUpdates: true,
  });

  const _object3D: IObject3D = new Object3D();
  let _instancedMeshHandle: null | InstancedMeshHandle = null;
  let _instancedMeshHandleNeedsUpdate: boolean = false;

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  async function preload(): Promise<void> {
    state.isPreloading = true;

    _instancedMeshHandle = await instancedGLTFModelViewManager.createEntiyMeshHandle(entity, _object3D);
    _instancedMeshHandle.object3D.rotation.set(0, entity.angle, 0);
    _instancedMeshHandle.object3D.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
    _instancedMeshHandleNeedsUpdate = true;

    fPreload(logger, _instancedMeshHandle);

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
    if (!_instancedMeshHandle) {
      throw new Error("Instanced mesh handle is not set, but it was expected.");
    }

    if (!_instancedMeshHandleNeedsUpdate) {
      return;
    }

    _instancedMeshHandleNeedsUpdate = false;
    _instancedMeshHandle.update(delta, elapsedTime, tickTimerState);
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `InstancedGLTFModelView("${entity.model_name}", "${entity.model_texture}", ${entity.scale})`,
    object3D: _object3D,
    raycasterObject3D: _object3D,
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
