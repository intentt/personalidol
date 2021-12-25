import type { Object3D } from "three/src/core/Object3D";

import type { DOMElementsLookup } from "../../dom-renderer/src/DOMElementsLookup.type";

import type { CSS2DObject } from "./CSS2DObject.interface";

export function isCSS2DObject<L extends DOMElementsLookup>(object: Object3D): object is CSS2DObject<L> {
  return "CSS2DObject" === object.type;
}
