import { disposableGeneric } from "./disposableGeneric";
import { disposableMaterial } from "./disposableMaterial";

import type { DisposableCallback } from "./DisposableCallback.type";
import type { Mesh as IMesh } from "three/src/objects/Mesh";

export function disposableMesh(mesh: IMesh): DisposableCallback {
  return function () {
    disposableGeneric(mesh.geometry)();
    disposableMaterial(mesh.material)();
  };
}
