import { isMesh } from "./isMesh";

import type { Mesh as IMesh } from "three/src/objects/Mesh";
import type { Object3D as IObject3D } from "three/src/core/Object3D";

export function findAllMeshes(object3d: IObject3D): Array<IMesh> {
  let meshes: Array<IMesh> = [];

  object3d.traverse(function (child: IObject3D) {
    if (!isMesh(child)) {
      return;
    }

    if (isMesh(child)) {
      meshes.push(child);
    }
  });

  return meshes;
}
