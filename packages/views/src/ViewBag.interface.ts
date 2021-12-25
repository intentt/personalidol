import type { Disposable } from "../../framework/src/Disposable.interface";
import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "../../framework/src/Mountable.interface";
import type { Pauseable } from "../../framework/src/Pauseable.interface";
import type { PollablePreloading } from "../../framework/src/PollablePreloading.interface";
import type { Preloadable } from "../../framework/src/Preloadable.interface";

import type { View } from "./View.interface";
import type { ViewBagState } from "./ViewBagState.type";

export interface ViewBag extends Disposable, MainLoopUpdatable, Mountable, Pauseable, PollablePreloading, Preloadable {
  readonly state: ViewBagState;
  readonly views: Set<View>;
}
