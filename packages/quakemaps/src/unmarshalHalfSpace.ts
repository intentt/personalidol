import { Plane } from "three/src/math/Plane";
import { Vector3 } from "three/src/math/Vector3";

import { sanitizeVector3 } from "./sanitizeVector3";
import { UnmarshalException } from "./UnmarshalException";

import type { HalfSpace } from "./HalfSpace.type";
import type { TextureUrlResolver } from "./TextureUrlResolver.type";

const REGEXP_WHITESPACE = /\s+/;

function resolveTextureUrl(textureName: string, textureUrlResolver: null | TextureUrlResolver = null): string {
  if (!textureUrlResolver) {
    return textureName;
  }

  return textureUrlResolver(textureName);
}

export function unmarshalHalfSpace(
  filename: string,
  lineno: number,
  line: string,
  textureUrlResolver: null | TextureUrlResolver = null
): HalfSpace {
  const parts = line.trim().split(REGEXP_WHITESPACE);

  if (parts.length !== 21) {
    throw new UnmarshalException(filename, lineno, "Brush half-plane is in incorrect format.");
  }

  if (parts[0] !== parts[5] || parts[5] !== parts[10] || parts[0] !== "(") {
    throw new UnmarshalException(filename, lineno, "Expected '(', got something else.");
  }

  if (parts[4] !== parts[9] || parts[9] !== parts[14] || parts[4] !== ")") {
    throw new UnmarshalException(filename, lineno, "Expected ')', got something else.");
  }

  const coplanarPoints: [Vector3, Vector3, Vector3] = [
    sanitizeVector3(filename, lineno, parts[1], parts[2], parts[3]),
    sanitizeVector3(filename, lineno, parts[6], parts[7], parts[8]),
    sanitizeVector3(filename, lineno, parts[11], parts[12], parts[13]),
  ];

  const plane = new Plane();

  // half-plane is stored as a set of clockwise oriented points
  // threejs expects plane to be defined by counterclockwise set of points
  plane.setFromCoplanarPoints(coplanarPoints[0], coplanarPoints[2], coplanarPoints[1]);

  return {
    coplanarPoints: coplanarPoints,
    plane: plane,
    // to be used later
    points: [],
    texture: {
      name: resolveTextureUrl(String(parts[15]), textureUrlResolver),
      offset: {
        x: Number(parts[16]),
        y: Number(parts[17]),
      },
      rotation: Number(parts[18]),
      scale: {
        x: Number(parts[19]),
        y: Number(parts[20]),
      },
    },
  };
}
