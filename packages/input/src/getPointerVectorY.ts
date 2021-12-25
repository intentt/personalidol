import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";

export function getPointerVectorY(dimensionsState: Uint32Array, relativeY: number): number {
  return -1 * (relativeY / dimensionsState[DimensionsIndices.D_HEIGHT]) * 2 + 1;
}
