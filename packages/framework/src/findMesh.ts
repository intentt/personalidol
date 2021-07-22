import { isMesh } from "./isMesh";

import type { Mesh as IMesh } from "three/src/objects/Mesh";
import type { Object3D as IObject3D } from "three/src/core/Object3D";

export function findMesh(object3d: IObject3D): null | IMesh {
  let mesh: null | IMesh = null;

  object3d.traverse(function (child: IObject3D) {
    if (!isMesh(child)) {
      return;
    }

    if (isMesh(mesh)) {
      throw new Error("Found multiple meshes in Object3D.");
    }

    mesh = child;
  });

  return mesh;
}
