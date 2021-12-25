import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { MountableState } from "../../framework/src/MountableState.type";
import type { PauseableState } from "../../framework/src/PauseableState.type";

export type UserInputControllerState = MainLoopUpdatableState & MountableState & PauseableState;
