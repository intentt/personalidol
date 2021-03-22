import type { Mountable } from "@personalidol/framework/src/Mountable.interface";
import type { Pauseable } from "@personalidol/framework/src/Pauseable.interface";

import type { PollablePreloadingState } from "@personalidol/framework/src/PollablePreloadingState.interface";

import type { View } from "./View.interface";
import type { ViewBagState } from "./ViewBagState.type";

export interface ViewBag extends Mountable, Pauseable, PollablePreloadingState {
  readonly state: ViewBagState;
  readonly views: Set<View>;
}