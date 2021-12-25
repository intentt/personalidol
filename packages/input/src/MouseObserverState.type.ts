import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type MouseObserverState = MainLoopUpdatableState & {
  lastUpdate: number;
};
