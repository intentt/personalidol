import { Plane } from "three/src/math/Plane";
import { Vector3 } from "three/src/math/Vector3";

import type { Brush } from "../../quakemaps/src/Brush.type";

export function fixBrushAfterDeserialization(brush: Brush): void {
  for (let halfSpace of brush.halfSpaces) {
    // Sometimes, but not always, the object prototype is messed up after
    // serialization / deserialization.
    if (!halfSpace.plane.isPlane) {
      halfSpace.plane = new Plane(
        new Vector3(halfSpace.plane.normal.x, halfSpace.plane.normal.y, halfSpace.plane.normal.z),
        halfSpace.plane.constant
      );
    }
  }
}
