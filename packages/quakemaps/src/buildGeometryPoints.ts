import { buildGeometryTriangles } from "./buildGeometryTriangles";
import { marshalCoords } from "./marshalCoords";

import type { Brush } from "./Brush.type";
import type { Vector3Simple } from "./Vector3Simple.type";

export function* buildGeometryPoints(brushes: ReadonlyArray<Brush>): Generator<Vector3Simple> {
  const unique: Set<string> = new Set();

  for (let brushHalfSpaceTriangle of buildGeometryTriangles(brushes)) {
    for (let point of brushHalfSpaceTriangle.triangle) {
      const marshaled = marshalCoords(point.x, point.y, point.z);

      if (!unique.has(marshaled)) {
        unique.add(marshaled);

        yield point;
      }
    }
  }
}
