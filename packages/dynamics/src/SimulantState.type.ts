import type { DisposableState } from "../../framework/src/DisposableState.type";
import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { MountableState } from "../../framework/src/MountableState.type";
import type { PauseableState } from "../../framework/src/PauseableState.type";
import type { PreloadableState } from "../../framework/src/PreloadableState.type";

export type SimulantState = DisposableState &
  MainLoopUpdatableState &
  MountableState &
  PauseableState &
  PreloadableState;
