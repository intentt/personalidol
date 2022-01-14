import { getIntersectingPoint } from "./getIntersectingPoint";
import { isAlmostEqual } from "./isAlmostEqual";
import { triangulateFacePoints } from "./triangulateFacePoints";

import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { Brush } from "./Brush.type";
import type { BrushHalfSpaceTriangle } from "./BrushHalfSpaceTriangle.type";
import type { IntersectingPointsCache } from "./IntersectingPointsCache.type";

function _addUniquePointToBrush(brush: Brush, points: Array<IVector3>, point: IVector3): void {
  if (points.includes(point)) {
    return;
  }

  points.push(point);
}

/**
 * This is really important, as the given point, which can be a valid
 * halfspaces intersection, can still land outside the brush boundaries
 */
function _isPointInsideBrush(brush: Brush, point: IVector3): boolean {
  for (let halfSpace of brush.halfSpaces) {
    const distanceToPoint = halfSpace.plane.distanceToPoint(point);

    if (distanceToPoint > 0 && !isAlmostEqual(distanceToPoint, 0, 0.5)) {
      return false;
    }
  }

  return true;
}

export function* buildGeometryTriangles(brushes: ReadonlyArray<Brush>): Generator<BrushHalfSpaceTriangle> {
  const pointsCache: IntersectingPointsCache = {};

  for (let brush of brushes) {
    // faces intersections need to be found
    // each face needs to be compared with each other face
    // it's a brute force solution, but it's simple enough and since we are
    // working with the set of at most dozen of faces on average optimization
    // won't matter much in practice
    for (let i = 0; i < brush.halfSpaces.length; i += 1) {
      for (let j = i; j < brush.halfSpaces.length; j += 1) {
        for (let k = j; k < brush.halfSpaces.length; k += 1) {
          // this basically generates combinations without repetitions where
          // order does not matter
          const intersectingPoint = getIntersectingPoint(
            brush.halfSpaces[i],
            brush.halfSpaces[j],
            brush.halfSpaces[k],
            pointsCache
          );

          if (intersectingPoint && _isPointInsideBrush(brush, intersectingPoint)) {
            _addUniquePointToBrush(brush, brush.halfSpaces[i].points, intersectingPoint);
            _addUniquePointToBrush(brush, brush.halfSpaces[j].points, intersectingPoint);
            _addUniquePointToBrush(brush, brush.halfSpaces[k].points, intersectingPoint);
          }
        }
      }
    }
  }

  for (let brush of brushes) {
    for (let halfSpace of brush.halfSpaces) {
      const normal = halfSpace.plane.normal;

      for (let triangle of triangulateFacePoints(normal, halfSpace.points)) {
        yield Object.seal({
          brush: brush,
          halfSpace: halfSpace,
          triangle: triangle,
        });
      }
    }
  }
}
