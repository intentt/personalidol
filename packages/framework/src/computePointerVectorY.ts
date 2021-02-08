import { DimensionsIndices } from "./DimensionsIndices.enum";
import { Input } from "./Input";

export function computePointerVectorY(dimensionsState: Uint32Array, relativeY: number): number {
  return Input.vector_scale * (-1 * (relativeY / dimensionsState[DimensionsIndices.D_HEIGHT]) * 2 + 1);
}
