import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";

export type RaycasterState = MainLoopUpdatableState & {
  hasIntersections: boolean;
};
