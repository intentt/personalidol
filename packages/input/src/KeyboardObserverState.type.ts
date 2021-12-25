import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type KeyboardObserverState = MainLoopUpdatableState & {
  lastUpdate: number;
};
