import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";

export function getPointerVectorX(dimensionsState: Uint32Array, relativeX: number): number {
  return (relativeX / dimensionsState[DimensionsIndices.D_WIDTH]) * 2 - 1;
}
