import type { DisposableState } from "@personalidol/framework/src/DisposableState.type";
import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { MountableState } from "@personalidol/framework/src/MountableState.type";
import type { PauseableState } from "@personalidol/framework/src/PauseableState.type";
import type { PreloadableState } from "@personalidol/framework/src/PreloadableState.type";
import type { RaycastableState } from "@personalidol/input/src/RaycastableState.type";

import type { InteractableState } from "./InteractableState.type";

export type ViewState = DisposableState &
  InteractableState &
  MainLoopUpdatableState &
  MountableState &
  PauseableState &
  PreloadableState &
  RaycastableState;
