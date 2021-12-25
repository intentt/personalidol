import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type TouchObserverState = MainLoopUpdatableState & {
  lastUpdate: number;
};
