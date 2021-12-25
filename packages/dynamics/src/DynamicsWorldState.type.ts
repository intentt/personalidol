import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { PauseableState } from "../../framework/src/PauseableState.type";

export type DynamicsWorldState = MainLoopUpdatableState & PauseableState;
