import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type RaycasterState = MainLoopUpdatableState & {
  hasIntersections: boolean;
};
