import { generateUUID } from "@personalidol/math/src/generateUUID";

import type { Logger } from "loglevel";
import type { InstancedMesh } from "three/src/objects/InstancedMesh";
import type { Object3D } from "three/src/core/Object3D";

import type { InstancedMeshHandle as IInstancedMeshHandle } from "./InstancedMeshHandle.interface";
import type { InstancedMeshHandleState } from "./InstancedMeshHandleState.type";
import type { UserSettings } from "./UserSettings.type";

export function InstancedMeshHandle(
  logger: Logger,
  userSettings: UserSettings,
  mesh: InstancedMesh,
  index: number,
  container: Object3D
): IInstancedMeshHandle {
  const state: InstancedMeshHandleState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  function _updateMatrix(): void {
    container.updateMatrix();

    mesh.setMatrixAt(index, container.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }

  function preload(): void {
    state.isPreloading = true;

    _updateMatrix();

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  return Object.freeze({
    id: generateUUID(),
    isInstancedMeshHandle: true,
    isPreloadable: true,
    name: "InstancedMeshHandle",
    object3D: container,
    state: state,

    preload: preload,
    update: _updateMatrix,
  });
}
