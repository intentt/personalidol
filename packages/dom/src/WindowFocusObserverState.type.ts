import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type WindowFocusObserverState = MainLoopUpdatableState & {
  isDocumentFocused: boolean;
  isFocusChanged: boolean;
  lastUpdate: number;
};
