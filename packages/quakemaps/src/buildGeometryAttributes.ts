import { buildGeometryTriangles } from "./buildGeometryTriangles";
import { isAlmostEqual } from "./isAlmostEqual";
import { marshalVector3 } from "./marshalVector3";

import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { AtlasTextureDimension } from "../../texture-loader/src/AtlasTextureDimension.type";

import type { Brush } from "./Brush.type";
import type { Geometry } from "./Geometry.type";
import type { HalfSpace } from "./HalfSpace.type";
import type { TextureDimensionsResolver } from "./TextureDimensionsResolver.type";
import type { TriangleSimple } from "./TriangleSimple.type";
import type { Vector3Simple } from "./Vector3Simple.type";

type UV = [number, number];

export function buildGeometryAttributes(
  brushes: ReadonlyArray<Brush>,
  resolveTextureDimensions: TextureDimensionsResolver,
  skipPlaceholders: boolean = true,
  discardOccluding: null | IVector3 = null
): Geometry {
  let indexIncrement = 0;
  const indexLookup: {
    [key: string]: number;
  } = {};

  // BufferGeometry attributes
  const atlasUVStart: Array<number> = [];
  const atlasUVStop: Array<number> = [];
  const indices: Array<number> = [];
  const normals: Array<number> = [];
  const uvs: Array<number> = [];
  const vertices: Array<number> = [];

  for (let brushHalfSpaceTriangle of buildGeometryTriangles(brushes, skipPlaceholders, discardOccluding)) {
    const halfSpace = brushHalfSpaceTriangle.halfSpace;
    const normal = brushHalfSpaceTriangle.halfSpace.plane.normal;
    const triangle = brushHalfSpaceTriangle.triangle;

    for (let i = 0; i < triangle.length; i += 1) {
      const point = triangle[i];

      const textureDimensions: AtlasTextureDimension = resolveTextureDimensions(halfSpace.texture.name);
      const uv = _createUV(halfSpace, point, textureDimensions, triangle, i);
      const marshaled = _marshalToIndex(halfSpace, point, uv);

      if (indexLookup.hasOwnProperty(marshaled)) {
        indices.push(indexLookup[marshaled]);
      } else {
        indexLookup[marshaled] = indexIncrement;

        atlasUVStart.push(textureDimensions.uvStartU, textureDimensions.uvStartV);
        atlasUVStop.push(textureDimensions.uvStopU, textureDimensions.uvStopV);
        indices.push(indexIncrement);
        normals.push(normal.x, normal.y, normal.z);

        uvs.push(uv[0], uv[1]);
        vertices.push(point.x, point.y, point.z);

        indexIncrement += 1;
      }
    }
  }

  const atlasUVStartTypedArray = Float32Array.from(atlasUVStart);
  const atlasUVStopTypedArray = Float32Array.from(atlasUVStop);
  const indicesTypedArray = Uint32Array.from(indices);
  const normalsTypedArray = Float32Array.from(normals);
  const uvsTypedArray = Float32Array.from(uvs);
  const verticesTypedArray = Float32Array.from(vertices);

  // prettier-ignore
  return {
    atlasUVStart: atlasUVStartTypedArray,
    atlasUVStop: atlasUVStopTypedArray,
    index: indicesTypedArray,
    normal: normalsTypedArray,
    position: verticesTypedArray,
    uv: uvsTypedArray,
    transferables: [
      atlasUVStartTypedArray.buffer,
      atlasUVStopTypedArray.buffer,
      indicesTypedArray.buffer,
      normalsTypedArray.buffer,
      uvsTypedArray.buffer,
      verticesTypedArray.buffer
    ],
  };
}

function _textureWrapU(halfSpace: HalfSpace, textureDimensions: AtlasTextureDimension, u: number): number {
  return (u + halfSpace.texture.offset.x) / textureDimensions.width;
}

function _textureWrapV(halfSpace: HalfSpace, textureDimensions: AtlasTextureDimension, v: number): number {
  return (v + halfSpace.texture.offset.y) / textureDimensions.height;
}

function _createUV(
  halfSpace: HalfSpace,
  point: Vector3Simple,
  textureDimensions: AtlasTextureDimension,
  triangle: TriangleSimple,
  i: number
): UV {
  const normal = halfSpace.plane.normal;

  // prettier-ignore
  switch (true) {
    case isAlmostEqual(normal.x, normal.y) && isAlmostEqual(normal.y, normal.z):
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case isAlmostEqual(normal.x, normal.y) && normal.z < normal.x:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case isAlmostEqual(normal.x, normal.y) && normal.z > normal.x:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case isAlmostEqual(normal.x, normal.z) && normal.y < normal.x:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case isAlmostEqual(normal.x, normal.z) && normal.y > normal.x:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.z),
      ];
    case isAlmostEqual(normal.y, normal.z) && normal.x < normal.y:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.y),
        _textureWrapV(halfSpace, textureDimensions, point.z),
      ];
    case isAlmostEqual(normal.y, normal.z) && normal.x > normal.y:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.y),
        _textureWrapV(halfSpace, textureDimensions, point.z),
      ];
    case normal.x > normal.y && normal.x > normal.z && normal.y < normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.z),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.x > normal.y && normal.x > normal.z && normal.y > normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.z),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.x < normal.y && normal.x < normal.z && normal.y < normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.x < normal.y && normal.x < normal.z && normal.y > normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.z),
      ];
    case normal.y > normal.x && normal.y > normal.z && normal.x < normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.y > normal.x && normal.y > normal.z && normal.x > normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.z),
      ];
    case normal.y < normal.x && normal.y < normal.z && normal.x < normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.y < normal.x && normal.y < normal.z && normal.x > normal.z:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.z > normal.x && normal.z > normal.y && normal.x < normal.y:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.z > normal.x && normal.z > normal.y && normal.x > normal.y:
      return [
        _textureWrapU(halfSpace, textureDimensions, point.x),
        _textureWrapV(halfSpace, textureDimensions, point.y),
      ];
    case normal.z < normal.x && normal.z < normal.y:
      return [
        0,
        0,
      ];
    default:
      console.log(normal);
      throw new Error("Unable to determine UVs.");
  }
}

function _marshalToIndex(halfSpace: HalfSpace, point: Vector3Simple, uv: UV): string {
  return `${halfSpace.texture.name} ${marshalVector3(halfSpace.plane.normal)} ${marshalVector3(point)} ${uv[0]} ${
    uv[1]
  }`;
}
