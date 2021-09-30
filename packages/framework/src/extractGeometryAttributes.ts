import { disposableMaterial } from "./disposableMaterial";
import { findMesh } from "./findMesh";
import { isMesh } from "./isMesh";

import type { BufferAttribute } from "three/src/core/BufferAttribute";
import type { Mesh } from "three/src/objects/Mesh";
import type { Object3D as IObject3D } from "three/src/core/Object3D";

import type { GeometryAttributes } from "./GeometryAttributes.type";

export function extractGeometryAttributes(
  object3d: IObject3D,
  transformMesh: (mesh: Mesh) => void
): GeometryAttributes {
  const mesh: any = findMesh(object3d);

  if (!isMesh(mesh)) {
    throw new Error("Unable to locate mesh in the object3D.");
  }

  // Materials are not needed here.
  disposableMaterial(mesh.material)();

  transformMesh(mesh);

  const indexAttribute: null | BufferAttribute = mesh.geometry.index;

  const index: null | Uint16Array = indexAttribute ? (indexAttribute.array as Uint16Array) : null;
  const normal: Float32Array = mesh.geometry.attributes.normal.array as Float32Array;
  const position: Float32Array = mesh.geometry.attributes.position.array as Float32Array;
  const uv: Float32Array = mesh.geometry.attributes.uv.array as Float32Array;

  const transferables: Array<ArrayBuffer> =
    normal.buffer === position.buffer ? [position.buffer, uv.buffer] : [normal.buffer, position.buffer, uv.buffer];
  if (index) {
    transferables.push(index.buffer);
  }

  return <GeometryAttributes>{
    index: index ? (index as Uint16Array) : null,
    normal: normal,
    position: position,
    uv: uv,

    transferables: transferables,
  };
}
