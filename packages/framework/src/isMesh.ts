import type { Mesh as IMesh } from "three/src/objects/Mesh";

export function isMesh(item: any): item is IMesh {
  if ("object" !== typeof item || !item) {
    return false;
  }

  return item.isMesh && item.isObject3D;
}
