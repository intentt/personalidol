import type { Object3D } from "three/src/core/Object3D";

import type { View } from "../../views/src/View.interface";

import type { EntityGLTFModel } from "./EntityGLTFModel.type";
import type { InstancedMeshHandle } from "./InstancedMeshHandle.interface";

export interface InstancedGLTFModelViewManager extends View {
  readonly isInstancedGLTFModelViewManager: true;

  createEntiyMeshHandle(entity: EntityGLTFModel, reference: Object3D): Promise<InstancedMeshHandle>;

  expectEntity(entity: EntityGLTFModel): void;
}
