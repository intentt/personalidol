import type { DisposableState } from "../../framework/src/DisposableState.type";
import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { MountableState } from "../../framework/src/MountableState.type";
import type { PauseableState } from "../../framework/src/PauseableState.type";
import type { PreloadableState } from "../../framework/src/PreloadableState.type";
import type { RaycastableState } from "../../input/src/RaycastableState.type";

import type { InteractableState } from "./InteractableState.type";

export type ViewState = DisposableState &
  InteractableState &
  MainLoopUpdatableState &
  MountableState &
  PauseableState &
  PreloadableState &
  RaycastableState;
